import type { ChatMemberDto } from '@/api';
import { ChatDtoEncryptionMode, ChatDtoType } from '@/api';

export function findPeerMember(
  members: ChatMemberDto[] | undefined,
  currentUserId: string,
): ChatMemberDto | undefined {
  return members?.find((m) => m.userId !== currentUserId);
}

export function resolveChatHeaderDisplayName(
  selectedChat: { type: string; name: string } | undefined,
  peerMember: ChatMemberDto | undefined,
): string {
  if (!selectedChat) return 'Групповой чат';
  if (selectedChat.type === ChatDtoType.PRIVATE) {
    return peerMember?.user?.name || 'Пользователь';
  }
  return selectedChat.name || 'Групповой чат';
}

export function isSignalChatEncryption(
  chat: { encryptionMode?: ChatDtoEncryptionMode } | undefined,
): boolean {
  return chat?.encryptionMode === ChatDtoEncryptionMode.SIGNAL;
}
