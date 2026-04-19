import { useState, useCallback } from 'react';
import type { Room, LocalParticipant } from 'livekit-client';

interface UseLiveKitControlsOptions {
    room: Room | null;
    localParticipant: LocalParticipant | null;
}

/**
 * Упрощенный хук для управления медиа в LiveKit
 * Работает напрямую с LiveKit Room и LocalParticipant
 */
export const useLiveKitControls = ({
    room,
    localParticipant
}: UseLiveKitControlsOptions) => {
    const [isAudioMute, setIsAudioMute] = useState(false);
    const [isVideoOnHold, setIsVideoOnHold] = useState(false);

    const toggleAudio = useCallback(() => {
        if (!localParticipant) {
            console.warn('⚠️ [LIVEKIT CONTROLS] No local participant');
            return;
        }

        const newState = !localParticipant.isMicrophoneEnabled;
        localParticipant.setMicrophoneEnabled(newState);
        setIsAudioMute(!newState);
        console.log('🎤 [LIVEKIT CONTROLS] Audio toggled', { enabled: newState });
    }, [localParticipant]);

    const toggleVideo = useCallback(() => {
        if (!localParticipant) {
            console.warn('⚠️ [LIVEKIT CONTROLS] No local participant');
            return;
        }

        const newState = !localParticipant.isCameraEnabled;
        localParticipant.setCameraEnabled(newState);
        setIsVideoOnHold(!newState);
        console.log('📹 [LIVEKIT CONTROLS] Video toggled', { enabled: newState });
    }, [localParticipant]);

    // Синхронизация состояния с LiveKit
    const updateMediaState = useCallback(() => {
        if (!localParticipant) {
            return;
        }

        setIsAudioMute(!localParticipant.isMicrophoneEnabled);
        setIsVideoOnHold(!localParticipant.isCameraEnabled);
    }, [localParticipant]);

    return {
        isAudioMute,
        isVideoOnHold,
        toggleAudio,
        toggleVideo,
        updateMediaState,
    };
};
