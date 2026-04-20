import { hydrateMessengerDeviceMeta } from './messenger-device-meta';
import { hydrateIncomingPlaintextCache } from './signal-incoming-plaintext-cache';
import { hydrateSentPlaintextCache } from './signal-sent-plaintext-cache';

/** Вызывать после авторизации, до открытия E2EE-чата. */
export async function initMessengerCryptoSession(): Promise<void> {
  await Promise.all([
    hydrateMessengerDeviceMeta(),
    hydrateSentPlaintextCache(),
    hydrateIncomingPlaintextCache(),
  ]);
}
