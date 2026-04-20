import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectMessagesSocket } from '@/shared/lib/socket/messages-socket';
import type { Message } from '@/entities/messages/lib/types/messages.types';
import { playMessageSound } from '@/shared/lib/notifications/sound-notification';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';
import { MessagesWsServerEvent } from '@/entities/messages/lib/const/messages-ws-events';
import { invalidateChatsAndUnreadIfNotSelf } from '@/entities/messages/lib/utils/incoming-message-cache.util';

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
const DEBUG_WS_MESSAGES = typeof __DEV__ !== 'undefined' && __DEV__;

export function useGlobalMessagesSocket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const initSocket = async (): Promise<(() => void) | void> => {
      try {
        const messagesSocket = await connectMessagesSocket(user.id);
        if (!isMounted || !messagesSocket) return;
        if (DEBUG_WS_MESSAGES) {
          console.log('🔌 [Global] socket connected?', messagesSocket.connected, 'id:', messagesSocket.id);
        }

        const handleNewMessage = (newMessage: Message) => {
          if (!isMounted) return;

          const isFromCurrentUser = newMessage.senderId === user.id;

          if (!isFromCurrentUser) {
            playMessageSound().catch((error) => {
              console.error('Failed to play notification sound:', error);
            });
          }

          void queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });
          void queryClient.invalidateQueries({
            queryKey: ['messages', 'chat', newMessage.chatId],
          });
          invalidateChatsAndUnreadIfNotSelf(queryClient, user.id, newMessage.senderId);
        };

        const handleChatRead = (payload: { chatId: string }) => {
          void queryClient.invalidateQueries({
            queryKey: ['messages', 'chat', payload.chatId],
          });
          void queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });
          void queryClient.invalidateQueries({ queryKey: ['messages', 'unread', 'total'] });
        };

        NEW_MESSAGE_EVENT_ALIASES.forEach((eventName) => {
          messagesSocket.on(eventName, handleNewMessage);
          if (DEBUG_WS_MESSAGES) console.log('👂 [Global] listen:', eventName);
        });
        CHAT_READ_EVENT_ALIASES.forEach((eventName) => {
          messagesSocket.on(eventName, handleChatRead);
          if (DEBUG_WS_MESSAGES) console.log('👂 [Global] listen:', eventName);
        });

        const anyListener = (eventName: string, ...args: unknown[]) => {
          if (!DEBUG_WS_MESSAGES) return;
          console.log('📡 [Global:onAny]', eventName, args[0]);
        };
        messagesSocket.onAny(anyListener);

        messagesSocket.on('reconnect', () => {
          console.log('🔄 [Global] Messages socket reconnected');
        });

        return () => {
          NEW_MESSAGE_EVENT_ALIASES.forEach((eventName) => {
            messagesSocket.off(eventName, handleNewMessage);
          });
          CHAT_READ_EVENT_ALIASES.forEach((eventName) => {
            messagesSocket.off(eventName, handleChatRead);
          });
          messagesSocket.offAny(anyListener);
        };
      } catch (error) {
        console.error('❌ [Global] Failed to initialize messages socket:', error);
      }
    };

    const p = initSocket();

    return () => {
      isMounted = false;
      void p.then((cleanup) => cleanup?.());
    };
  }, [user?.id, queryClient]);
}
