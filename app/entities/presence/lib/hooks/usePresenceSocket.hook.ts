import { useEffect } from 'react';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';
import { connectWebSocket } from '@/shared/lib/socket/websocket';
import { PresenceSocketEvent } from '../constants/presence.consts';
import { PresenceStatus } from '../types/presence.types';
import { usePresence } from './usePresence.hook';

/**
 * Хук для отслеживания presence событий через WebSocket
 * Использует messages socket (общий socket для всех событий)
 */
export const usePresenceSocket = () => {
    const { user } = useAuth();
    const { updatePresenceUser, setPresence } = usePresence();

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        let messagesSocket: any = null;
        let isMounted = true;

        const initSocket = async () => {
            try {
                messagesSocket = await connectWebSocket(user.id);

                // Обработчик события online
                const handleOnline = (data: { userId: string }) => {
                    if (!isMounted) return;
                    console.log('🔵 Presence ONLINE event received:', data);
                    if (data?.userId) {
                        updatePresenceUser(data.userId, PresenceStatus.ONLINE);
                    } else {
                        console.warn('⚠️ Presence ONLINE event received without userId:', data);
                    }
                };

                // Обработчик события offline
                const handleOffline = (data: { userId: string }) => {
                    if (!isMounted) return;
                    console.log('🔴 Presence OFFLINE event received:', data);
                    if (data?.userId) {
                        updatePresenceUser(data.userId, PresenceStatus.OFFLINE, new Date());
                    } else {
                        console.warn('⚠️ Presence OFFLINE event received without userId:', data);
                    }
                };

                // Обработчик события bulk-online
                const handleBulkOnline = (data: { users: string[] }) => {
                    if (!isMounted) return;
                    console.log('📦 Presence BULK-ONLINE event received:', data.users?.length, 'users');
                    if (data?.users && Array.isArray(data.users)) {
                        const bulkPresence: Record<string, any> = {};
                        data.users.forEach(userId => {
                            if (userId) {
                                bulkPresence[userId] = {
                                    userId,
                                    status: PresenceStatus.ONLINE,
                                    lastSeenAt: 'just now',
                                };
                            }
                        });
                        setPresence(bulkPresence);
                    }
                };

                // Удаляем старые обработчики перед добавлением новых
                messagesSocket.off(PresenceSocketEvent.ONLINE, handleOnline);
                messagesSocket.off(PresenceSocketEvent.OFFLINE, handleOffline);
                messagesSocket.off(PresenceSocketEvent.BULK_ONLINE, handleBulkOnline);

                // Добавляем новые обработчики
                messagesSocket.on(PresenceSocketEvent.ONLINE, handleOnline);
                messagesSocket.on(PresenceSocketEvent.OFFLINE, handleOffline);
                messagesSocket.on(PresenceSocketEvent.BULK_ONLINE, handleBulkOnline);

                console.log('✅ Presence socket handlers registered for user:', user.id);

                // Если socket уже подключен, сразу добавляем текущего пользователя
                if (messagesSocket.connected) {
                    console.log('🔌 Socket already connected, adding current user immediately');
                    updatePresenceUser(user.id, PresenceStatus.ONLINE);
                } else {
                    // Если socket еще не подключен, ждем события connect
                    const handleConnect = () => {
                        if (!isMounted) return;
                        console.log('🔌 Socket connected, adding current user to presence');
                        updatePresenceUser(user.id, PresenceStatus.ONLINE);
                    };
                    messagesSocket.on('connect', handleConnect);
                }

                // Отправляем ping каждые 25 секунд для продления TTL (TTL = 60 сек)
                const interval = setInterval(() => {
                    if (messagesSocket && messagesSocket.connected) {
                        messagesSocket.emit(PresenceSocketEvent.PING);
                    }
                }, 25_000);

                // Cleanup
                return () => {
                    isMounted = false;
                    if (messagesSocket) {
                        messagesSocket.off(PresenceSocketEvent.ONLINE, handleOnline);
                        messagesSocket.off(PresenceSocketEvent.OFFLINE, handleOffline);
                        messagesSocket.off(PresenceSocketEvent.BULK_ONLINE, handleBulkOnline);
                        messagesSocket.off('connect', () => {});
                    }
                    clearInterval(interval);
                };
            } catch (error) {
                console.error('❌ Failed to initialize presence socket:', error);
            }
        };

        const cleanup = initSocket();

        return () => {
            isMounted = false;
            cleanup.then((cleanupFn) => {
                if (cleanupFn) cleanupFn();
            });
        };
    }, [user?.id, updatePresenceUser, setPresence]);
};
