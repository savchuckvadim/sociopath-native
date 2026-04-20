import * as SecureStore from 'expo-secure-store';

const LS_DEVICE_ROW = 'messenger_signal_device_row_id';
const LS_CLIENT_DEVICE = 'signal_device_id';

let serverCache: string | null = null;
let clientCache: string | null = null;
let hydratePromise: Promise<void> | null = null;

export async function hydrateMessengerDeviceMeta(): Promise<void> {
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    const row = await SecureStore.getItemAsync(LS_DEVICE_ROW);
    const client = await SecureStore.getItemAsync(LS_CLIENT_DEVICE);
    serverCache = row;
    clientCache = client;
  })();
  return hydratePromise;
}

export function getLocalMessengerServerDeviceId(): string | null {
  return serverCache;
}

export function getLocalMessengerClientDeviceId(): string | null {
  return clientCache;
}

export function setMessengerDeviceCache(serverId: string, clientId: string): void {
  serverCache = serverId;
  clientCache = clientId;
}

export async function persistClientDeviceId(clientId: string): Promise<void> {
  await SecureStore.setItemAsync(LS_CLIENT_DEVICE, clientId);
  clientCache = clientId;
}

export async function persistMessengerDeviceIds(serverId: string, clientId: string): Promise<void> {
  await SecureStore.setItemAsync(LS_DEVICE_ROW, serverId);
  await SecureStore.setItemAsync(LS_CLIENT_DEVICE, clientId);
  setMessengerDeviceCache(serverId, clientId);
}

export { LS_DEVICE_ROW, LS_CLIENT_DEVICE };
