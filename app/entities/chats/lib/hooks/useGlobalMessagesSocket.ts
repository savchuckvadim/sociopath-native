import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectMessagesSocket } from '@/shared/lib/socket/messages-socket';
import { Message } from '@/entities/messages';
import { playMessageSound } from '@/shared/lib/notifications/sound-notification';
import { useAuth } from '@/processes/auth';

/**
 * Глобальный хук для прослушивания всех сообщений через WebSocket
 * Работает всегда, когда пользователь авторизован
 * Отвечает за:
 * - Воспроизведение звука уведомлений
 * - Обновление списка чатов
 */
export function useGlobalMessagesSocket() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) return;

        let messagesSocket: any = null;
        let isMounted = true;

        const initSocket = async () => {
            try {
                messagesSocket = await connectMessagesSocket(user.id);

                const handleNewMessage = (newMessage: Message) => {
                    if (!isMounted) return;

                    console.log('📨 [Global] New message received via WebSocket:', newMessage);

                    // Проверяем, не от текущего пользователя ли сообщение
                    const isFromCurrentUser = newMessage.senderId === user.id;

                    if (!isFromCurrentUser) {
                        // Воспроизводим звук для всех сообщений от других пользователей
                        playMessageSound().catch((error) => {
                            console.error('Failed to play notification sound:', error);
                        });
                    }

                    // Всегда обновляем список чатов при получении нового сообщения
                    queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });

                    // Также обновляем кэш сообщений для конкретного чата (если он загружен)
                    queryClient.invalidateQueries({
                        queryKey: ['messages', 'chat', newMessage.chatId]
                    });
                };

                // Подписываемся на событие новых сообщений
                messagesSocket.on('message:new', handleNewMessage);

                // Обработка переподключения
                messagesSocket.on('reconnect', () => {
                    console.log('🔄 [Global] Messages socket reconnected');
                });

                // Очистка при размонтировании
                return () => {
                    isMounted = false;
                    if (messagesSocket) {
                        messagesSocket.off('message:new', handleNewMessage);
                    }
                };
            } catch (error) {
                console.error('❌ [Global] Failed to initialize messages socket:', error);
            }
        };

        const cleanup = initSocket();

        return () => {
            isMounted = false;
            cleanup.then((cleanupFn) => {
                if (cleanupFn) cleanupFn();
            });
        };
    }, [user?.id, queryClient]);
}
