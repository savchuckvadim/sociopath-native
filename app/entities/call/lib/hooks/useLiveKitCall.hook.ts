import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';
import { connectWebSocket } from '@/shared/lib/socket/websocket';
import { CallEvent } from '../types/call-event.type';
import { IncomingCallData } from '../types/call.types';
import { DeviceEventEmitter } from 'react-native';

interface UseLiveKitCallOptions {
    chatId: string | null;
}

/**
 * хук для LiveKit звонков
 *
 */
export const useLiveKitCall = ({ chatId }: UseLiveKitCallOptions) => {
    const { user } = useAuth();
    const [isInCall, setIsInCall] = useState(false);
    const [callType, setCallType] = useState<'VIDEO' | 'AUDIO'>('AUDIO');
    const [isIncomingCall, setIsIncomingCall] = useState(false);
    const [incomingCallData, setIncomingCallData] = useState<IncomingCallData | null>(null);
    const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
    const [activeOtherUserId, setActiveOtherUserId] = useState<string | null>(null);
    const [socket, setSocket] = useState<any>(null);
    const [callStartedAt, setCallStartedAt] = useState<number | null>(null);

    // Инициализация сокета
    useEffect(() => {
        if (!user?.id) {
            return;
        }

        let isMounted = true;

        const initSocket = async () => {
            try {
                const s = await connectWebSocket(user.id);
                if (isMounted) {
                    setSocket(s);
                }
            } catch (error) {
                console.error('❌ [LIVEKIT CALL] Failed to connect calls socket:', error);
            }
        };

        initSocket();

        return () => {
            isMounted = false;
        };
    }, [user?.id]);

    // Обработка входящих звонков
    useEffect(() => {
        if (!socket || !user?.id) {
            return;
        }

        const handleIncomingCall = (data: IncomingCallData) => {
            console.log('📞 [LIVEKIT CALL] Incoming call received', {
                fromUserId: data.fromUserId,
                type: data.type,
                chatId: data.chatId,
                from: data.from
            });

            setIncomingCallData(data);
            setIsIncomingCall(true);
            setActiveOtherUserId(data.fromUserId);
            setCallType(data.type);
        };

        socket.on(CallEvent.INCOMING, handleIncomingCall);

        return () => {
            socket.off(CallEvent.INCOMING, handleIncomingCall);
        };
    }, [socket, user?.id]);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener(
            'call:incoming:push',
            (data: IncomingCallData) => {
                setIncomingCallData(data);
                setIsIncomingCall(true);
                setActiveOtherUserId(data.fromUserId);
                setCallType(data.type);
            },
        );

        return () => {
            subscription.remove();
        };
    }, []);

    // Обработка завершения звонка
    useEffect(() => {
        if (!socket) {
            return;
        }

        const handleCallEnd = ({ from }: { from: string }) => {
            console.log('🔌 [LIVEKIT CALL] Call ended', { from });

            // Проверяем, что это наш звонок
            if (incomingCallData?.from === from || activeOtherUserId) {
                setIsInCall(false);
                setIsIncomingCall(false);
                setIncomingCallData(null);
                setRemoteUserId(null);
                setActiveOtherUserId(null);
                setCallStartedAt(null);
            }
        };

        socket.on(CallEvent.END, handleCallEnd);

        return () => {
            socket.off(CallEvent.END, handleCallEnd);
        };
    }, [socket, incomingCallData, activeOtherUserId]);

    // Инициирование звонка
    const handleCallUser = useCallback(async (
        otherUserId: string,
        chatId: string,
        type: 'VIDEO' | 'AUDIO'
    ) => {
        console.log('📞 [LIVEKIT CALL] Initiating call', {
            otherUserId,
            chatId,
            type
        });

        setActiveOtherUserId(otherUserId);
        setRemoteUserId(otherUserId);
        setCallType(type);
        setIsInCall(true);
        setCallStartedAt(Date.now());
        setIsIncomingCall(false);

        // Отправляем событие инициации звонка через socket (для уведомления другого пользователя)
        if (socket) {
            socket.emit(CallEvent.INITIATE, {
                toUserId: otherUserId,
                chatId,
                type,
                // НЕ отправляем offer - LiveKit сам все сделает
            });
        }
    }, [socket]);

    // Принятие звонка
    const acceptCall = useCallback(() => {
        if (!incomingCallData) {
            console.warn('⚠️ [LIVEKIT CALL] No incoming call to accept');
            return;
        }

        console.log('✅ [LIVEKIT CALL] Accepting call', {
            fromUserId: incomingCallData.fromUserId,
            chatId: incomingCallData.chatId
        });

        // ✅ Устанавливаем все состояния ПЕРЕД установкой isInCall
        setRemoteUserId(incomingCallData.fromUserId);
        setActiveOtherUserId(incomingCallData.fromUserId);
        setCallType(incomingCallData.type);
        setIsIncomingCall(false);
        setIsInCall(true);
        setCallStartedAt(Date.now());

        // Отправляем событие принятия звонка
        if (socket) {
            socket.emit(CallEvent.ACCEPTED, {
                toUserId: incomingCallData.fromUserId,
                // НЕ отправляем answer - LiveKit сам все сделает
            });
        }
    }, [incomingCallData, socket]);

    // Отклонение звонка
    const rejectCall = useCallback(() => {
        if (!incomingCallData) {
            console.warn('⚠️ [LIVEKIT CALL] No incoming call to reject');
            return;
        }

        console.log('❌ [LIVEKIT CALL] Rejecting call', {
            fromUserId: incomingCallData.fromUserId
        });

        // Отправляем событие отклонения (через call:end)
        if (socket) {
            socket.emit(CallEvent.END, {
                toUserId: incomingCallData.fromUserId,
                endedReason: 'REJECTED',
            });
        }

        setIsIncomingCall(false);
        setIncomingCallData(null);
        setActiveOtherUserId(null);
        setCallStartedAt(null);
    }, [incomingCallData, socket]);

    // Завершение звонка
    const handleEndCall = useCallback(() => {
        console.log('🔌 [LIVEKIT CALL] Ending call');

        // Отправляем событие завершения звонка
        if (socket && (activeOtherUserId || remoteUserId)) {
            const targetUserId = remoteUserId || activeOtherUserId;
            const duration = callStartedAt
                ? Math.max(0, Math.floor((Date.now() - callStartedAt) / 1000))
                : undefined;
            socket.emit(CallEvent.END, {
                toUserId: targetUserId,
                endedReason: 'CANCELED',
                duration,
            });
        }

        setIsInCall(false);
        setIsIncomingCall(false);
        setIncomingCallData(null);
        setRemoteUserId(null);
        setActiveOtherUserId(null);
        setCallStartedAt(null);
    }, [socket, activeOtherUserId, remoteUserId, callStartedAt]);

    return {
        isInCall,
        callType,
        isIncomingCall,
        incomingCallFromUserId: incomingCallData?.fromUserId || null,
        remoteUserId: remoteUserId || activeOtherUserId,
        incomingCallData, // ✅ Экспортируем для доступа к chatId
        handleCallUser,
        acceptCall,
        rejectCall,
        handleEndCall,
    };
};
