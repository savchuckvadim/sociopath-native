import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import {
    AudioSession,
    LiveKitRoom,
    useTracks,
    TrackReferenceOrPlaceholder,
    VideoTrack,
    isTrackReference,
    useRoomContext,
    useLocalParticipant,
} from '@livekit/react-native';
import { Track, RemoteParticipant, LocalParticipant } from 'livekit-client';
import { useGlobalCallContext } from '@/entities/call/lib/context/GlobalCallProvider';
import { useLiveKitControls } from '@/entities/call/lib/hooks/useLiveKitControls.hook';
import { useCallToken } from '@/entities/call/lib/hooks/call-token.hook';
import { CallIncoming } from '@/entities/call/ui/CallIncoming';
import { CallControls } from '@/entities/call/ui/CallControls';
import { useUser } from '@/entities/user';
import { Loader } from '@/shared';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || 'https://ws.sociopath-network.ru';

/**
 * Компонент для отображения видео участника LiveKit
 */
const LiveKitVideoPlayer = ({
    participant,
    name,
    style,
}: {
    participant: RemoteParticipant | LocalParticipant;
    name: string;
    style?: any;
}) => {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: false },
            { source: Track.Source.ScreenShare, withPlaceholder: false }
        ],
        { onlySubscribed: false }
    );

    // Находим видео трек для этого участника
    const videoTrack = tracks.find((track) =>
        isTrackReference(track) &&
        track.participant?.identity === participant.identity &&
        track.publication &&
        track.publication.kind === 'video' &&
        track.publication.isSubscribed &&
        (track.source === Track.Source.Camera || track.source === Track.Source.ScreenShare)
    );

    // Для удаленных участников - убеждаемся, что подписываемся на треки
    useEffect(() => {
        if (participant instanceof RemoteParticipant) {
            participant.trackPublications.forEach((publication) => {
                if (publication.kind === 'video' && !publication.isSubscribed) {
                    publication.setSubscribed(true);
                }
            });
        }
    }, [participant]);

    if (!isTrackReference(videoTrack)) {
        return (
            <View style={[style, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                <Text className="text-white text-sm">Нет видео</Text>
                <Text className="text-white text-xs text-gray-400">{name}</Text>
            </View>
        );
    }

    return (
        <View style={style}>
            <VideoTrack
                trackRef={videoTrack}
                style={{ width: '100%', height: '100%' }}
                mirror={participant instanceof LocalParticipant}
                zOrder={0}
            />
            {name && (
                <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded">
                    <Text className="text-white text-sm">{name}</Text>
                </View>
            )}
        </View>
    );
};

/**
 * Overlay для активного звонка
 */
const CallOverlay = ({
    callType,
    remoteUserId
}: {
    callType: 'VIDEO' | 'AUDIO';
    remoteUserId: string | null;
}) => {
    let room;
    try {
        room = useRoomContext();
    } catch (error) {
        console.warn('⚠️ [CallOverlay] Room context not available yet:', error);
        return (
            <View className="absolute inset-0 z-50 bg-black flex items-center justify-center">
                <Text className="text-white text-xl">Подключение к комнате...</Text>
            </View>
        );
    }

    const { handleEndCall } = useGlobalCallContext();
    const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
    const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);



    const { isAudioMute, isVideoOnHold, toggleAudio, toggleVideo } = useLiveKitControls({
        room: room || null,
        localParticipant: localParticipant
    });

    const remoteParticipant = participants.find(p => p.identity !== localParticipant?.identity);
    // Используем useUser только если remoteUserId определен (всегда вызываем хук, но с пустой строкой если нет ID)
    const { user: remoteUser, isLoading: isLoadingRemoteUser } = useUser(remoteUserId || '');



    // Инициализируем участников
    useEffect(() => {
        if (!room) return;

        setLocalParticipant(room.localParticipant);
        setParticipants(Array.from(room.remoteParticipants.values()));

        const updateParticipants = () => {
            setParticipants(Array.from(room.remoteParticipants.values()));
        };

        const handleParticipantConnected = (participant: RemoteParticipant) => {
            updateParticipants();
            // Подписываемся на все треки удаленного участника
            participant.trackPublications.forEach((publication) => {
                if (!publication.isSubscribed && publication.kind === 'video') {
                    publication.setSubscribed(true);
                }
            });
            participant.on('trackPublished', (publication) => {
                if (publication.kind === 'video' && !publication.isSubscribed) {
                    publication.setSubscribed(true);
                }
            });
        };

        const handleParticipantDisconnected = (participant: RemoteParticipant) => {
            updateParticipants();
            if (participant.identity === remoteParticipant?.identity) {
                handleEndCall();
            }
        };

        room.on('participantConnected', handleParticipantConnected);
        room.on('participantDisconnected', handleParticipantDisconnected);
        room.on('connected', updateParticipants);

        return () => {
            room.off('participantConnected', handleParticipantConnected);
            room.off('participantDisconnected', handleParticipantDisconnected);
            room.off('connected', updateParticipants);
        };
    }, [room, remoteParticipant, handleEndCall]);

    // // Проверка после хуков - показываем загрузку, если пользователь еще загружается
    // if (remoteUserId && isLoadingRemoteUser) {
    //     return (
    //         <View className="absolute inset-0 z-50 bg-black flex items-center justify-center">
    //             <Text className="text-white text-xl">Загрузка информации о пользователе...</Text>
    //         </View>
    //     );
    // }
    // // Проверка, что room доступен
    // if (!room) {
    //     return (
    //         <View className="absolute inset-0 z-50 bg-black flex items-center justify-center">
    //             <Text className="text-white text-xl">Подключение к комнате...</Text>
    //         </View>
    //     );
    // }

    const handleEndCallLiveKit = () => {
        if (room) {
            room.disconnect();
        }
        handleEndCall();
    };

    if (callType === 'VIDEO') {
        return (
            <View className="absolute inset-0 z-50 bg-black">
                {/* Удаленное видео - на весь экран */}
                {remoteParticipant ? (
                    <View className="absolute inset-0">
                        <LiveKitVideoPlayer
                            participant={remoteParticipant}
                            name={remoteUser?.name || ''}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                ) : (
                    <View className="absolute inset-0 flex items-center justify-center">
                        <Text className="text-white text-xl mb-2">Ожидание подключения...</Text>
                        {remoteUser && (
                            <Text className="text-white text-sm text-gray-400">{remoteUser.name}</Text>
                        )}
                    </View>
                )}

                {/* Локальное видео - маленькое справа внизу */}
                {localParticipant && (
                    <View className="absolute bottom-24 right-4 z-10" style={{ width: 112, height: 144 }}>
                        <LiveKitVideoPlayer
                            participant={localParticipant}
                            name="You"
                            style={{ width: '100%', height: '100%', borderRadius: 8, borderWidth: 2, borderColor: '#fff' }}
                        />
                    </View>
                )}

                {/* Контролы внизу */}
                <View className="absolute bottom-0 left-0 right-0 pb-4 flex justify-center z-20 px-4">
                    <CallControls
                        isAudioMute={isAudioMute}
                        isVideoOnHold={isVideoOnHold}
                        onToggleAudio={toggleAudio}
                        onToggleVideo={toggleVideo}
                        onEndCall={handleEndCallLiveKit}
                    />
                </View>
            </View>
        );
    }

    // Аудио звонок
    return (
        <View className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center gap-8">
            {remoteUser && (
                <Text className="text-white text-2xl font-semibold">
                    {remoteUser.name}
                </Text>
            )}
            <Text className="text-white text-xl">
                Аудио звонок
            </Text>
            <CallControls
                isAudioMute={isAudioMute}
                isVideoOnHold={isVideoOnHold}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onEndCall={handleEndCallLiveKit}
            />
        </View>
    );
};

interface CallWrapperWidgetProps {
    children: React.ReactNode;
}

/**
 * Компонент-обертка для управления звонками
 * Показывает входящие звонки, исходящие звонки и активные звонки
 */
export const CallWrapperWidget: React.FC<CallWrapperWidgetProps> = ({
    children,
}) => {
    const call = useGlobalCallContext();
    const {
        isInCall,
        callType,
        isIncomingCall,
        remoteUserId,
        handleEndCall,
        chatId,
    } = call;

    // Генерируем roomName на основе chatId
    const roomName = chatId ? `chat-${chatId}` : null;

    // Берем токен ТОЛЬКО когда есть активный звонок и roomName
    const { token, isLoading: tokenLoading, error: tokenError } = useCallToken(roomName);

    // Отслеживаем ошибки токена
    useEffect(() => {
        if (tokenError) {
            console.error('❌ [LIVEKIT] Token error:', tokenError);
            handleEndCall();
        }
    }, [tokenError, handleEndCall]);

    // Start audio session
    useEffect(() => {
        if (isInCall && token) {
            AudioSession.startAudioSession();
            return () => {
                AudioSession.stopAudioSession();
            };
        }
    }, [isInCall, token]);

    return (
        <View className="flex-1">
            {children}

            {/* Incoming call overlay */}
            {isIncomingCall && <CallIncoming />}

            {/* Outgoing call waiting overlay */}
            {isInCall && (!token || tokenLoading) && !isIncomingCall && (
                <View className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
                    <View className="flex flex-col gap-4 items-center">
                        <Text className="text-white text-xl font-semibold">
                            Звонок {callType === 'VIDEO' ? 'видео' : 'аудио'}...
                            {tokenLoading && ' (Подключение...)'}
                        </Text>
                        {tokenLoading && <Loader />}
                        <TouchableOpacity
                            onPress={handleEndCall}
                            className="bg-red-600 px-6 py-3 rounded-lg flex-row items-center gap-2"
                        >
                            <Text className="text-white font-semibold">Отменить вызов</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* LiveKitRoom только когда есть токен и активный звонок */}
            {isInCall && token && !tokenLoading && roomName && (
                <LiveKitRoom
                    video={callType === 'VIDEO'}
                    audio={true}
                    token={token}
                    serverUrl={LIVEKIT_URL}
                    connect={true}
                    options={{
                        adaptiveStream: { pixelDensity: 'screen' },
                    }}
                    onDisconnected={() => {
                        console.log('🔌 [LIVEKIT] Disconnected from room');
                    }}
                    onError={(error) => {
                        console.error('❌ [LIVEKIT] Room error:', error);
                        const errorMessage = error?.message || '';
                        const ignoredErrors = [
                            'Client initiated disconnect',
                            'could not establish pc connection',
                            'publishing rejected as engine not connected within timeout',
                        ];
                        const shouldIgnore = ignoredErrors.some(ignored =>
                            errorMessage.toLowerCase().includes(ignored.toLowerCase())
                        );
                        if (!shouldIgnore) {
                            handleEndCall();
                        }
                    }}
                >
                    <CallOverlay callType={callType} remoteUserId={remoteUserId} />
                </LiveKitRoom>
            )}
        </View>
    );
};
