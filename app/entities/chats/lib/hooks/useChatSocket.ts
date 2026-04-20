import { useEffect, useRef, RefObject } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectMessagesSocket } from '@/shared/lib/socket/messages-socket';
import type { Message } from '@/entities/messages/lib/types/messages.types';
import { useMarkChatAsRead } from './useChats';
import { scrollToBottom } from '@/entities/messages/lib/utils/scroll-to-bottom.util';
import {
  MessagesWsClientEvent,
  MessagesWsServerEvent,
} from '@/entities/messages/lib/const/messages-ws-events';
import {
  invalidateChatsAndUnreadIfNotSelf,
  mergeIncomingMessageIntoChatCache,
} from '@/entities/messages/lib/utils/incoming-message-cache.util';
import { ScrollView } from 'react-native';

interface UseChatSocketProps {
  chatId: string | null;
  userId: string | undefined;
  messagesEndRef: RefObject<ScrollView | null>;
}

export const useChatSocket = ({ chatId, userId, messagesEndRef }: UseChatSocketProps) => {
  const queryClient = useQueryClient();
  const { mutate: markChatAsReadMutate } = useMarkChatAsRead();
  const disposedRef = useRef(false);

  useEffect(() => {
    if (!userId || !chatId) return;

    disposedRef.current = false;

    const initSocket = async (): Promise<() => void> => {
      const messagesSocket = await connectMessagesSocket(userId);
      if (disposedRef.current) {
        return () => undefined;
      }

      const handleNewMessage = (newMessage: Message) => {
        if (newMessage.chatId === chatId) {
          mergeIncomingMessageIntoChatCache(queryClient, chatId, newMessage);
          if (newMessage.senderId !== userId) {
            markChatAsReadMutate(chatId);
          }
          invalidateChatsAndUnreadIfNotSelf(queryClient, userId, newMessage.senderId);
          setTimeout(() => {
            scrollToBottom(messagesEndRef);
          }, 80);
        } else {
          void queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });
          invalidateChatsAndUnreadIfNotSelf(queryClient, userId, newMessage.senderId);
        }
      };

      messagesSocket.on(MessagesWsServerEvent.NEW_MESSAGE, handleNewMessage);

      const handleChatRead = (payload: { chatId: string }) => {
        if (payload.chatId === chatId) {
          void queryClient.invalidateQueries({
            queryKey: ['messages', 'chat', chatId],
          });
        }
      };
      messagesSocket.on(MessagesWsServerEvent.CHAT_READ, handleChatRead);

      const joinChat = () => {
        messagesSocket.emit(MessagesWsClientEvent.CHAT_JOIN, { chatId }, (response: { error?: string } | null) => {
          if (response?.error) {
            console.error('Chat join error:', response.error);
          }
        });
      };

      if (messagesSocket.connected) {
        joinChat();
      } else {
        const connectHandler = () => {
          joinChat();
          messagesSocket.off('connect', connectHandler);
        };
        messagesSocket.on('connect', connectHandler);
      }

      messagesSocket.on('reconnect', joinChat);

      return () => {
        messagesSocket.off(MessagesWsServerEvent.NEW_MESSAGE, handleNewMessage);
        messagesSocket.off(MessagesWsServerEvent.CHAT_READ, handleChatRead);
        messagesSocket.off('reconnect', joinChat);
        if (chatId) {
          messagesSocket.emit(MessagesWsClientEvent.CHAT_LEAVE, { chatId });
        }
      };
    };

    const p = initSocket();

    return () => {
      disposedRef.current = true;
      void p.then((cleanup) => cleanup());
    };
  }, [chatId, userId, queryClient, messagesEndRef, markChatAsReadMutate]);
};
