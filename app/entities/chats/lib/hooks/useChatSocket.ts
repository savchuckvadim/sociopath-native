import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectMessagesSocket } from '@/shared/lib/socket/messages-socket';
import { Message } from '@/entities/messages';
import { scrollToBottom } from '@/entities/messages/lib/utils/scroll-to-bottom.util';
import { RefObject } from 'react';
import { ScrollView } from 'react-native';
import { useAuth } from '@/processes/auth';

interface UseChatSocketProps {
    chatId: string | null;
    userId: string | undefined;
    messagesEndRef: RefObject<ScrollView | null>;
}

export const useChatSocket = ({ chatId, userId, messagesEndRef }: UseChatSocketProps) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useEffect(() => {
        if (!userId || !chatId) return;

        let messagesSocket: any = null;

        const initSocket = async () => {
            messagesSocket = await connectMessagesSocket(userId);

            const handleNewMessage = (newMessage: Message) => {
                console.log('📨 [Chat] New message received via WebSocket:', newMessage);

                // Звук уведомлений теперь обрабатывается в useGlobalMessagesSocket
                // Здесь только обновляем UI текущего открытого чата

                if (newMessage.chatId === chatId) {
                    queryClient.setQueryData(
                        ['messages', 'chat', chatId, 50, 0],
                        (oldData: Message[] | undefined) => {
                            if (!oldData) {
                                return [newMessage];
                            }
                            const exists = oldData.some((msg: Message) => msg.id === newMessage.id);
                            if (exists) {
                                return oldData;
                            }
                            const filtered = oldData.filter((msg: Message) =>
                                !(msg.id?.startsWith('temp-') && msg.content === newMessage.content && msg.senderId === newMessage.senderId)
                            );
                            return [...filtered, newMessage];
                        }
                    );

                    queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });

                    setTimeout(() => {
                        scrollToBottom(messagesEndRef);
                    }, 100);
                } else {
                    queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });
                }
            };

            messagesSocket.on('message:new', handleNewMessage);

            messagesSocket.on('chat:joined', (data: { chatId?: string;[key: string]: unknown }) => {
                console.log('✅ Joined chat room:', data);
            });

            const joinChat = () => {
                console.log('📤 Joining chat:', chatId);
                messagesSocket.emit('chat:join', { chatId }, (response: { error?: string;[key: string]: unknown } | null) => {
                    if (response?.error) {
                        console.error('❌ Chat join error:', response.error);
                    } else {
                        console.log('✅ Chat join success:', response);
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

            messagesSocket.on('reconnect', () => {
                console.log('🔄 Messages socket reconnected');
                joinChat();
            });

            return () => {
                messagesSocket.off('message:new', handleNewMessage);
                if (chatId) {
                    messagesSocket.emit('chat:leave', { chatId });
                }
            };
        };

        const cleanup = initSocket();

        return () => {
            cleanup.then((cleanupFn) => {
                if (cleanupFn) cleanupFn();
            });
        };
    }, [chatId, userId, queryClient, messagesEndRef, user?.id]);
};
