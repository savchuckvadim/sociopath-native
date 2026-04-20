import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'messenger_e2ee_sent_plaintext_v1';
const MAX_KEYS = 3000;

let memoryMap: Record<string, string> | null = null;

export async function hydrateSentPlaintextCache(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    memoryMap = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    memoryMap = {};
  }
}

function trim(m: Record<string, string>): void {
  const keys = Object.keys(m);
  if (keys.length <= MAX_KEYS) return;
  keys.sort();
  for (let i = 0; i < keys.length - MAX_KEYS; i++) {
    const k = keys[i];
    if (k) delete m[k];
  }
}

export function rememberSentPlaintext(messageId: string, plaintext: string): void {
  if (!messageId) return;
  if (!memoryMap) memoryMap = {};
  memoryMap[messageId] = plaintext;
  trim(memoryMap);
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryMap));
}

export function getSentPlaintext(messageId: string): string | undefined {
  if (!messageId || !memoryMap) return undefined;
  return memoryMap[messageId];
}
