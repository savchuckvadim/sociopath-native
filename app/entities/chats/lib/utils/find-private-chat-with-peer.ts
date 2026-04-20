import { ChatDtoEncryptionMode, ChatDtoType, type ChatDto } from '@/api';

export type PrivateChatLookup = Pick<ChatDto, 'id' | 'type' | 'encryptionMode' | 'members'>;

export function findPrivateChatWithPeer(
  chats: PrivateChatLookup[] | undefined,
  currentUserId: string,
  peerUserId: string,
  encryptionMode: ChatDtoEncryptionMode,
): PrivateChatLookup | undefined {
  if (!chats?.length) return undefined;
  for (const chat of chats) {
    if (chat.type !== ChatDtoType.PRIVATE) continue;
    if (chat.encryptionMode !== encryptionMode) continue;
    const members = chat.members;
    if (!members || members.length !== 2) continue;
    const ids = new Set(members.map((m) => m.userId));
    if (ids.has(currentUserId) && ids.has(peerUserId)) {
      return chat;
    }
  }
  return undefined;
}
