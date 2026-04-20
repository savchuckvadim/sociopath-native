/**
 * Signal E2EE для мессенджера (паритет с auth-mono `messenger-e2ee.ts`).
 */
import '@/polyfills/installTextEncoding';
import type { DeviceType } from '@privacyresearch/libsignal-protocol-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import type { RegisterDeviceDto } from '@/api';
import { getEncryption } from '@/api/generated/encryption/encryption';
import {
    b64ToBuf,
    bufToB64,
    createMessengerSignalStorage,
    persistInitialMessengerKeys,
} from './signal-async-kv-storage';
import {
    getLocalMessengerClientDeviceId,
    getLocalMessengerServerDeviceId,
    hydrateMessengerDeviceMeta,
    persistClientDeviceId,
    persistMessengerDeviceIds,
} from './messenger-device-meta';

interface PreKeyBundleDto {
    id: string;
    clientDeviceId: string;
    identityKey: string;
    registrationId: number;
    signedPreKey: {
        keyId: number;
        publicKey: string;
        signature: string;
    };
    preKey?: { keyId: number; publicKey: string };
}

let storeSingleton: ReturnType<typeof createMessengerSignalStorage> | null = null;
type LibSignalModule = typeof import('@privacyresearch/libsignal-protocol-typescript');
let libSignalPromise: Promise<LibSignalModule> | null = null;

function getLibSignal(): Promise<LibSignalModule> {
    if (!libSignalPromise) {
        libSignalPromise = import('@privacyresearch/libsignal-protocol-typescript');
    }
    return libSignalPromise;
}

function getStore() {
    if (!storeSingleton) {
        storeSingleton = createMessengerSignalStorage();
    }
    return storeSingleton;
}

export function stableDeviceNumber(clientDeviceId: string): number {
    let h = 5381;
    for (let i = 0; i < clientDeviceId.length; i++) {
        h = ((h << 5) + h) ^ clientDeviceId.charCodeAt(i);
    }
    const n = h >>> 0;
    return n === 0 ? 1 : n;
}

function binaryStringToBase64(s: string): string {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff;
    return Buffer.from(bytes).toString('base64');
}

/** `Uint8Array.buffer` is typed as `ArrayBufferLike`; libsignal APIs expect `ArrayBuffer`. */
function uint8ArrayToArrayBuffer(u8: Uint8Array): ArrayBuffer {
    const out = new ArrayBuffer(u8.byteLength);
    new Uint8Array(out).set(u8);
    return out;
}

function arrayBufferToBinaryString(ab: ArrayBuffer): string {
    const u8 = new Uint8Array(ab);
    let str = '';
    for (let i = 0; i < u8.length; i++) {
        const b = u8[i];
        if (b !== undefined) str += String.fromCharCode(b);
    }
    return str;
}

function bundleToDeviceType(bundle: PreKeyBundleDto): DeviceType {
    return {
        identityKey: b64ToBuf(bundle.identityKey),
        registrationId: bundle.registrationId,
        signedPreKey: {
            keyId: bundle.signedPreKey.keyId,
            publicKey: b64ToBuf(bundle.signedPreKey.publicKey),
            signature: b64ToBuf(bundle.signedPreKey.signature),
        },
        ...(bundle.preKey
            ? {
                preKey: {
                    keyId: bundle.preKey.keyId,
                    publicKey: b64ToBuf(bundle.preKey.publicKey),
                },
            }
            : {}),
    };
}

export async function ensureLocalSignalDeviceRegistered(): Promise<{
    serverDeviceId: string;
    clientDeviceId: string;
}> {
    const { KeyHelper } = await getLibSignal();
    await hydrateMessengerDeviceMeta();
    const row = getLocalMessengerServerDeviceId();
    let client = getLocalMessengerClientDeviceId();
    if (row && client) {
        return { serverDeviceId: row, clientDeviceId: client };
    }

    if (!client) {
        client = uuidv4();
        await persistClientDeviceId(client);
    }

    const store = getStore();
    const registrationId = KeyHelper.generateRegistrationId();
    const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
    const signedPreKeyId = 1;
    const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, signedPreKeyId);
    const preKeys: { keyId: number; publicKey: string }[] = [];
    const oneTimePreKeys: { keyId: number; publicKey: string }[] = [];
    for (let i = 1; i <= 5; i++) {
        const pk = await KeyHelper.generatePreKey(i);
        preKeys.push({
            keyId: pk.keyId,
            publicKey: bufToB64(pk.keyPair.pubKey),
        });
        await store.storePreKey(pk.keyId, pk.keyPair);
    }
    for (let i = 1; i <= 10; i++) {
        const pk = await KeyHelper.generatePreKey(100 + i);
        oneTimePreKeys.push({
            keyId: pk.keyId,
            publicKey: bufToB64(pk.keyPair.pubKey),
        });
        await store.storePreKey(pk.keyId, pk.keyPair);
    }

    await persistInitialMessengerKeys(
        identityKeyPair,
        registrationId,
        signedPreKeyId,
        signedPreKey.keyPair,
    );

    const api = getEncryption();
    const dto: RegisterDeviceDto = {
        clientDeviceId: client,
        name: 'Mobile',
        type: 'mobile',
        registrationId,
        identityKey: bufToB64(identityKeyPair.pubKey),
        signedPreKey: bufToB64(signedPreKey.keyPair.pubKey),
        signedPreKeySig: bufToB64(signedPreKey.signature),
        preKeys,
        oneTimePreKeys,
    };
    const res = await api.encryptionRegister(dto);

    await persistMessengerDeviceIds(res.id, client);
    return { serverDeviceId: res.id, clientDeviceId: client };
}

export type EncryptedOutgoingPayload = {
    content: string;
    isEncrypted: true;
    toDeviceId: string;
    senderDeviceId: string;
    signalMessageType: string;
    registrationId?: number;
};

export async function encryptOutgoingForSignalChat(
    recipientUserId: string,
    plaintext: string,
    myServerDeviceId: string,
): Promise<EncryptedOutgoingPayload[]> {
    const { SessionBuilder, SessionCipher, SignalProtocolAddress } = await getLibSignal();
    const store = getStore();
    const api = getEncryption();
    const bundles = (await api.encryptionBundleForUser(recipientUserId)) as unknown as PreKeyBundleDto[];
    if (!bundles.length) {
        throw new Error('Recipient has no registered Signal devices');
    }
    const out: EncryptedOutgoingPayload[] = [];
    const buf = uint8ArrayToArrayBuffer(new TextEncoder().encode(plaintext));
    for (const bundle of bundles) {
        const device = bundleToDeviceType(bundle);
        const address = new SignalProtocolAddress(recipientUserId, stableDeviceNumber(bundle.clientDeviceId));
        const cipher = new SessionCipher(store, address);
        if (!(await cipher.hasOpenSession())) {
            const builder = new SessionBuilder(store, address);
            await builder.processPreKey(device);
        }
        const msg = await cipher.encrypt(buf);
        const body = msg.body!;
        const b64 = binaryStringToBase64(body);
        out.push({
            content: b64,
            isEncrypted: true,
            toDeviceId: bundle.id,
            senderDeviceId: myServerDeviceId,
            signalMessageType: String(msg.type),
            registrationId: msg.registrationId,
        });
    }
    return out;
}

export async function decryptSignalMessageContent(input: {
    senderId: string;
    senderClientDeviceId?: string;
    content: string;
    signalMessageType?: string;
}): Promise<string> {
    const { SessionCipher, SignalProtocolAddress } = await getLibSignal();
    if (!input.senderClientDeviceId) {
        throw new Error('Missing senderClientDeviceId on encrypted message');
    }
    const store = getStore();
    const address = new SignalProtocolAddress(
        input.senderId,
        stableDeviceNumber(input.senderClientDeviceId),
    );
    const cipher = new SessionCipher(store, address);
    const binStr = arrayBufferToBinaryString(b64ToBuf(input.content));
    const t = input.signalMessageType;
    const raw = String(t ?? '').trim();
    const typeNum = typeof t === 'number' ? t : Number(raw);
    const isPreKey =
        raw === '3' || raw === 'PREKEY' || raw === 'PREKEY_WHISPER' || typeNum === 3;
    const plaintext = isPreKey
        ? await cipher.decryptPreKeyWhisperMessage(binStr, 'binary')
        : await cipher.decryptWhisperMessage(binStr, 'binary');
    return new TextDecoder().decode(new Uint8Array(plaintext));

}

const incomingDecryptChains = new Map<string, Promise<unknown>>();

function incomingDecryptQueueKey(senderId: string, senderClientDeviceId: string) {
    return `${senderId}\u0000${senderClientDeviceId}`;
}

export function decryptSignalMessageContentSerialized(input: {
    senderId: string;
    senderClientDeviceId?: string;
    content: string;
    signalMessageType?: string;
}): Promise<string> {
    const sid = input.senderClientDeviceId;
    if (!sid) {
        return decryptSignalMessageContent(input);
    }
    const qKey = incomingDecryptQueueKey(input.senderId, sid);
    const prev = incomingDecryptChains.get(qKey) ?? Promise.resolve();
    const next = prev
        .catch(() => { })
        .then(() => decryptSignalMessageContent(input));
    incomingDecryptChains.set(
        qKey,
        next.then(
            () => undefined,
            () => undefined,
        ),
    );
    return next;
}
