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

const NEW_MESSAGE_EVENT_ALIASES = [
  MessagesWsServerEvent.NEW_MESSAGE,
  'newMessage',
  'message:new',
] as const;

const CHAT_READ_EVENT_ALIASES = [
  MessagesWsServerEvent.CHAT_READ,
  'chat:read',
  'message:read',
  'message:chatRead',
] as const;

const CHAT_JOIN_EVENT_ALIASES = [
  MessagesWsClientEvent.CHAT_JOIN,
  'joinChat',
  'chat:subscribe',
] as const;

const CHAT_LEAVE_EVENT_ALIASES = [
  MessagesWsClientEvent.CHAT_LEAVE,
  'leaveChat',
  'chat:unsubscribe',
] as const;
const DEBUG_WS_MESSAGES = typeof __DEV__ !== 'undefined' && __DEV__;

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
      if (DEBUG_WS_MESSAGES) {
        console.log('🔌 [Chat] socket connected?', messagesSocket.connected, 'id:', messagesSocket.id, 'chatId:', chatId);
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

      NEW_MESSAGE_EVENT_ALIASES.forEach((eventName) => {
        messagesSocket.on(eventName, handleNewMessage);
        if (DEBUG_WS_MESSAGES) console.log('👂 [Chat] listen:', eventName, 'chatId:', chatId);
      });

      const handleChatRead = (payload: { chatId: string }) => {
        if (payload.chatId === chatId) {
          void queryClient.invalidateQueries({
            queryKey: ['messages', 'chat', chatId],
          });
          void queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });
          void queryClient.invalidateQueries({ queryKey: ['messages', 'unread', 'total'] });
        }
      };
      CHAT_READ_EVENT_ALIASES.forEach((eventName) => {
        messagesSocket.on(eventName, handleChatRead);
        if (DEBUG_WS_MESSAGES) console.log('👂 [Chat] listen:', eventName, 'chatId:', chatId);
      });

      const anyListener = (eventName: string, ...args: unknown[]) => {
        if (!DEBUG_WS_MESSAGES) return;
        console.log('📡 [Chat:onAny]', eventName, args[0], 'chatId:', chatId);
      };
      messagesSocket.onAny(anyListener);

      const joinChat = () => {
        CHAT_JOIN_EVENT_ALIASES.forEach((eventName) => {
          if (DEBUG_WS_MESSAGES) console.log('📤 [Chat] emit join:', eventName, { chatId });
          messagesSocket.emit(eventName, { chatId }, (response: { error?: string } | null) => {
            if (response?.error) {
              console.error('Chat join error:', response.error);
            }
          });
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
        NEW_MESSAGE_EVENT_ALIASES.forEach((eventName) => {
          messagesSocket.off(eventName, handleNewMessage);
        });
        CHAT_READ_EVENT_ALIASES.forEach((eventName) => {
          messagesSocket.off(eventName, handleChatRead);
        });
        messagesSocket.off('reconnect', joinChat);
        if (chatId) {
          CHAT_LEAVE_EVENT_ALIASES.forEach((eventName) => {
            if (DEBUG_WS_MESSAGES) console.log('📤 [Chat] emit leave:', eventName, { chatId });
            messagesSocket.emit(eventName, { chatId });
          });
        }
        messagesSocket.offAny(anyListener);
      };
    };

    const p = initSocket();

    return () => {
      disposedRef.current = true;
      void p.then((cleanup) => cleanup());
    };
  }, [chatId, userId, queryClient, messagesEndRef, markChatAsReadMutate]);
};
