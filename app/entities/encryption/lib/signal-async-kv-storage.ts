/**
 * Адаптер `StorageType` для libsignal: те же ключи, что в вебе (`signal-idb-storage.ts`),
 * но персистентность через AsyncStorage (RN вместо IndexedDB).
 */
import type { StorageType } from '@privacyresearch/libsignal-protocol-typescript';
import type { KeyPairType } from '@privacyresearch/libsignal-protocol-typescript';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

const KV_PREFIX = '@messenger_signal_v1:';

function bufToB64(buf: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(buf)).toString('base64');
}

function b64ToBuf(s: string): ArrayBuffer {
  return Uint8Array.from(Buffer.from(s, 'base64')).buffer;
}

function kpToJson(kp: KeyPairType): { pub: string; priv: string } {
  return { pub: bufToB64(kp.pubKey), priv: bufToB64(kp.privKey) };
}

function kpFromJson(j: { pub: string; priv: string }): KeyPairType {
  return { pubKey: b64ToBuf(j.pub), privKey: b64ToBuf(j.priv) };
}

async function kvGet(key: string): Promise<string | undefined> {
  const v = await AsyncStorage.getItem(KV_PREFIX + key);
  return v ?? undefined;
}

async function kvSet(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(KV_PREFIX + key, value);
}

async function kvDel(key: string): Promise<void> {
  await AsyncStorage.removeItem(KV_PREFIX + key);
}

export async function persistInitialMessengerKeys(
  identityKeyPair: KeyPairType,
  registrationId: number,
  signedPreKeyId: number,
  signedKeyPair: KeyPairType,
): Promise<void> {
  await kvSet('identity_keypair', JSON.stringify(kpToJson(identityKeyPair)));
  await kvSet('registration_id', String(registrationId));
  await kvSet(`signed_prekey_${signedPreKeyId}`, JSON.stringify(kpToJson(signedKeyPair)));
}

export function createMessengerSignalStorage(): StorageType {
  return {
    getIdentityKeyPair: async () => {
      const raw = await kvGet('identity_keypair');
      return raw ? kpFromJson(JSON.parse(raw)) : undefined;
    },
    getLocalRegistrationId: async () => {
      const raw = await kvGet('registration_id');
      return raw !== undefined ? Number(raw) : undefined;
    },
    isTrustedIdentity: async (_id, _key, _dir) => {
      void _id;
      void _key;
      void _dir;
      return true;
    },
    saveIdentity: async (encodedAddress, publicKey) => {
      await kvSet(`identity_${encodedAddress}`, bufToB64(publicKey));
      return false;
    },
    loadPreKey: async (keyId) => {
      const raw = await kvGet(`prekey_${keyId}`);
      return raw ? kpFromJson(JSON.parse(raw)) : undefined;
    },
    storePreKey: async (keyId, keyPair) => {
      await kvSet(`prekey_${keyId}`, JSON.stringify(kpToJson(keyPair)));
    },
    removePreKey: async (keyId) => {
      await kvDel(`prekey_${keyId}`);
    },
    storeSession: async (encodedAddress, record) => {
      await kvSet(`session_${encodedAddress}`, record);
    },
    loadSession: async (encodedAddress) => {
      return (await kvGet(`session_${encodedAddress}`)) ?? undefined;
    },
    loadSignedPreKey: async (keyId) => {
      const raw = await kvGet(`signed_prekey_${keyId}`);
      return raw ? kpFromJson(JSON.parse(raw)) : undefined;
    },
    storeSignedPreKey: async (keyId, keyPair) => {
      await kvSet(`signed_prekey_${keyId}`, JSON.stringify(kpToJson(keyPair)));
    },
    removeSignedPreKey: async (keyId) => {
      await kvDel(`signed_prekey_${keyId}`);
    },
  };
}

export { bufToB64, b64ToBuf };
