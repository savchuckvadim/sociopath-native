import type { QueryClient } from '@tanstack/react-query';
import type { Message } from '../types/messages.types';

const defaultLimit = 50;
const defaultOffset = 0;

export function mergeIncomingMessageIntoChatCache(
  queryClient: QueryClient,
  chatId: string,
  newMessage: Message,
  limit = defaultLimit,
  offset = defaultOffset,
): void {
  queryClient.setQueryData(
    ['messages', 'chat', chatId, limit, offset],
    (oldData: Message[] | undefined) => {
      if (!oldData) {
        return [newMessage];
      }
      const exists = oldData.some((msg: Message) => msg.id === newMessage.id);
      if (exists) {
        return oldData;
      }
      const filtered = oldData.filter(
        (msg: Message) =>
          !(msg.id?.startsWith('temp-') && msg.content === newMessage.content && msg.senderId === newMessage.senderId),
      );
      const merged = [...filtered, newMessage];
      const seen = new Set<string>();
      return merged.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
    },
  );
}

export function invalidateChatsAndUnreadIfNotSelf(
  queryClient: QueryClient,
  userId: string | undefined,
  senderId: string,
): void {
  void queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });
  if (senderId !== userId) {
    void queryClient.invalidateQueries({ queryKey: ['messages', 'unread', 'total'] });
  }
}
