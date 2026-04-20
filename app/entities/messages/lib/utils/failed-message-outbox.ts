import AsyncStorage from '@react-native-async-storage/async-storage';
import { MessageType, type Message } from '../types/messages.types';

const STORAGE_KEY = 'messenger-failed-outbox-v1';

type OutboxRecord = Record<string, { chatId: string; content: string; failedAt: string }>;

async function readAll(): Promise<OutboxRecord> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as OutboxRecord;
  } catch {
    return {};
  }
}

async function writeAll(data: OutboxRecord): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function saveFailedMessageToOutbox(
  tempId: string,
  chatId: string,
  content: string,
): Promise<void> {
  const all = await readAll();
  all[tempId] = {
    chatId,
    content,
    failedAt: new Date().toISOString(),
  };
  await writeAll(all);
}

export async function removeFailedMessageFromOutbox(tempId: string): Promise<void> {
  const all = await readAll();
  if (all[tempId]) {
    delete all[tempId];
    await writeAll(all);
  }
}

type OutboxUser = { id: string; name: string; email: string };

export async function loadOutboxMessagesForChat(chatId: string, user: OutboxUser): Promise<Message[]> {
  const all = await readAll();
  const out: Message[] = [];
  for (const [tempId, row] of Object.entries(all)) {
    if (row.chatId !== chatId) continue;
    out.push({
      id: tempId,
      chatId: row.chatId,
      senderId: user.id,
      content: row.content,
      type: MessageType.TEXT,
      createdAt: row.failedAt,
      updatedAt: row.failedAt,
      isEncrypted: false,
      sender: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      _clientStatus: 'failed',
    } as Message);
  }
  return out;
}
