import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectMessagesSocket } from '@/shared/lib/socket/messages-socket';
import type { Message } from '@/entities/messages/lib/types/messages.types';
import { playMessageSound } from '@/shared/lib/notifications/sound-notification';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';
import { MessagesWsServerEvent } from '@/entities/messages/lib/const/messages-ws-events';
import { invalidateChatsAndUnreadIfNotSelf } from '@/entities/messages/lib/utils/incoming-message-cache.util';

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
        };

        messagesSocket.on(MessagesWsServerEvent.NEW_MESSAGE, handleNewMessage);
        messagesSocket.on(MessagesWsServerEvent.CHAT_READ, handleChatRead);

        messagesSocket.on('reconnect', () => {
          console.log('🔄 [Global] Messages socket reconnected');
        });

        return () => {
          messagesSocket.off(MessagesWsServerEvent.NEW_MESSAGE, handleNewMessage);
          messagesSocket.off(MessagesWsServerEvent.CHAT_READ, handleChatRead);
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
