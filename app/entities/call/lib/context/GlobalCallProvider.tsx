import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLiveKitCall } from '../hooks/useLiveKitCall.hook';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';

interface GlobalCallContextValue {
    isInCall: boolean;
    callType: 'VIDEO' | 'AUDIO';
    myStream: null; // LiveKit управляет медиа сам
    remoteStream: null; // LiveKit управляет медиа сам
    isAudioMute: boolean;
    isVideoOnHold: boolean;
    handleToggleAudio: () => void;
    handleToggleVideo: () => void;
    handleEndCall: () => void;
    handleCallUser: (otherUserId: string, chatId: string, type: 'VIDEO' | 'AUDIO') => Promise<void>;
    handleSaveHistory: () => void;
    isIncomingCall: boolean;
    acceptCall: () => void;
    rejectCall: () => void;
    incomingCallFromUserId: string | null;
    remoteUserId: string | null;
    chatId: string | null;
}

const GlobalCallContext = createContext<GlobalCallContextValue | null>(null);

interface GlobalCallProviderProps {
    children: ReactNode;
}

/**
 * Глобальный провайдер звонков для всего приложения
 * Слушает все входящие звонки независимо от того, где находится пользователь
 */
export const GlobalCallProvider: React.FC<GlobalCallProviderProps> = ({
    children,
}) => {
    const { user } = useAuth();
    const [activeOtherUserId, setActiveOtherUserId] = useState<string | null>(null);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    // ✅ Используем упрощенный хук для LiveKit (БЕЗ WebRTC)
    const liveKitCall = useLiveKitCall({ chatId: activeChatId });

    // ✅ ВСЕГДА используем LiveKit хук (БЕЗ WebRTC!)
    const call = liveKitCall;

    const handleCallUser = async (otherUserId: string, chatId: string, type: 'VIDEO' | 'AUDIO') => {
        // ✅ Устанавливаем otherUserId и chatId для UI состояния
        debugger;
        setActiveOtherUserId(otherUserId);
        setActiveChatId(chatId);
        // ✅ Используем LiveKit хук (БЕЗ WebRTC!)
        debugger;
        console.log('📞 [GLOBAL CALL] Using LiveKit for call', { otherUserId, chatId, type });
        await liveKitCall.handleCallUser(otherUserId, chatId, type);
    };

    const handleEndCall = () => {
        // ✅ Используем правильный метод
        call.handleEndCall();

        // ✅ Сбрасываем после завершения звонка
        setActiveOtherUserId(null);
        setActiveChatId(null);
    };

    const acceptCall = () => {
        // ✅ КРИТИЧНО: Устанавливаем chatId и otherUserId ПЕРЕД вызовом call.acceptCall()
        // чтобы useLiveKitCall получил правильный chatId
        if (liveKitCall.incomingCallFromUserId) {
            // Получаем chatId из incomingCallData
            const incomingData = (liveKitCall as any).incomingCallData;
            if (incomingData?.chatId) {
                setActiveChatId(incomingData.chatId);
                console.log('✅ [GLOBAL CALL] Set chatId from incoming call BEFORE accept', {
                    chatId: incomingData.chatId,
                    fromUserId: incomingData.fromUserId
                });
            }
            // ✅ Устанавливаем otherUserId для UI
            if (incomingData?.fromUserId) {
                setActiveOtherUserId(incomingData.fromUserId);
            }
        }

        // ✅ Теперь вызываем acceptCall - chatId уже установлен
        call.acceptCall();
    };

    const rejectCall = () => {
        call.rejectCall();
        setActiveOtherUserId(null);
        setActiveChatId(null);
    };

    // ✅ Используем только LiveKit хук
    // Добавляем недостающие поля для совместимости с интерфейсом
    const contextValue: GlobalCallContextValue = {
        ...liveKitCall,
        // Добавляем недостающие поля для совместимости
        myStream: null, // LiveKit управляет медиа сам
        remoteStream: null, // LiveKit управляет медиа сам
        isAudioMute: false, // Управляется через LiveKitRoom (обновляется в CallOverlay)
        isVideoOnHold: false, // Управляется через LiveKitRoom (обновляется в CallOverlay)
        handleToggleAudio: () => { }, // Управляется через LiveKitRoom (в CallOverlay)
        handleToggleVideo: () => { }, // Управляется через LiveKitRoom (в CallOverlay)
        handleSaveHistory: () => { }, // TODO: реализовать для LiveKit
        chatId: activeChatId,
        handleCallUser,
        handleEndCall,
        acceptCall,
        rejectCall,
    };

    return (
        <GlobalCallContext.Provider value={contextValue}>
            {children}
        </GlobalCallContext.Provider>
    );
};

export const useGlobalCallContext = () => {
    const context = useContext(GlobalCallContext);
    if (!context) {
        throw new Error('useGlobalCallContext must be used within GlobalCallProvider');
    }
    return context;
};
