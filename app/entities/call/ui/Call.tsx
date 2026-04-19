import * as React from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    ListRenderItem,
    Text,
    TouchableOpacity,
} from 'react-native';
import { useEffect, useState } from 'react';
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
import { Track } from 'livekit-client';
import { useCallToken } from '../lib/hooks/call-token.hook';
import { Loader } from '@/shared';
import { useRoute, RouteProp } from '@react-navigation/native';
import { TypeRootStackParamList } from '@/processes/navigation/interface/navigation.interface';
import { LIVEKIT_URL } from '@/config/api.config';



type CallScreenRouteProp = RouteProp<TypeRootStackParamList, 'Call'>;

export default function Call() {
    const route = useRoute<CallScreenRouteProp>();
    const { roomName, callType } = route.params || { roomName: 'test', callType: 'audio' as const };
    const { token } = useCallToken(roomName);
    const [isConnected, setIsConnected] = useState(false);

    console.log('🔵 Call component render - token:', token ? 'YES' : 'NO', 'isConnected:', isConnected);

    // Start the audio session first.
    useEffect(() => {
        let start = async () => {
            await AudioSession.startAudioSession();
        };

        start();
        return () => {
            AudioSession.stopAudioSession();
        };
    }, []);

    if (!token) {
        console.log('🔵 Call - waiting for token, showing Loader');
        return <Loader />;
    }

    // Если не подключено, показываем кнопку вне LiveKitRoom
    if (!isConnected) {
        console.log('🔵 Call - not connected, showing call button');
        return (
            <View style={styles.container}>
                <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>Нажмите кнопку, чтобы начать звонок</Text>
                </View>
                <View style={styles.controlsContainer}>
                    <TouchableOpacity
                        style={[styles.controlButton, styles.callButton]}
                        onPress={() => {
                            console.log('📞 Starting call...');
                            setIsConnected(true);
                        }}
                    >
                        <Text style={styles.controlButtonText}>📞 Позвонить</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    console.log('🔵 Call - connected, rendering LiveKitRoom');

    return (
        <LiveKitRoom
            serverUrl={LIVEKIT_URL}
            token={token}
            connect={isConnected}
            options={{
                // Use screen pixel density to handle screens with differing densities.
                adaptiveStream: { pixelDensity: 'screen' },
            }}
            audio={isConnected}
            video={isConnected && callType === 'video'}
            onConnected={() => {
                console.log('✅ LiveKit connected successfully!');
                setIsConnected(true);
            }}
            onDisconnected={() => {
                console.log('❌ LiveKit disconnected');
                setIsConnected(false);
            }}
            onError={(error: any) => {
                console.error('❌ LiveKit error:', error);
            }}
        >
            <RoomView isConnected={isConnected} onConnectChange={setIsConnected} />
        </LiveKitRoom>
    );
};

interface RoomViewProps {
    isConnected: boolean;
    onConnectChange: (connected: boolean) => void;
}

const RoomView = ({ isConnected, onConnectChange }: RoomViewProps) => {
    console.log('📹 RoomView render - isConnected:', isConnected);

    const handleCall = () => {
        console.log('📞 handleCall - starting call');
        // Начать звонок
        onConnectChange(true);
    };

    // Если комната не подключена, показываем только кнопку "Позвонить"
    if (!isConnected) {
        console.log('📹 RoomView - not connected, showing call button');
        return (
            <View className="flex-1 w-full h-full bg-orange-700">
                <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>Нажмите кнопку, чтобы начать звонок</Text>
                </View>
                <View style={styles.controlsContainer}>
                    <TouchableOpacity
                        style={[styles.controlButton, styles.callButton]}
                        onPress={handleCall}
                    >
                        <Text style={styles.controlButtonText}>📞 Позвонить</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    console.log('📹 RoomView - connected, initializing hooks');

    // Хуки вызываем только когда комната подключена
    const room = useRoomContext();
    const localParticipant = useLocalParticipant();
    const tracks = useTracks([Track.Source.Camera]);

    console.log('📹 RoomView - tracks count:', tracks.length);
    console.log('📹 isConnected:', isConnected);
    console.log('📹 room exists:', !!room);

    tracks.forEach((track, index) => {
        console.log(`📹 Track ${index}:`, {
            isTrackReference: isTrackReference(track),
            participant: track.participant?.identity,
            source: track.source,
        });
    });

    const handleDisconnect = async () => {
        if (room) {
            try {
                await room.disconnect();
            } catch (error) {
                console.error('Error disconnecting:', error);
            }
            onConnectChange(false);
        }
    };

    const toggleCamera = async () => {
        if (localParticipant.localParticipant) {
            try {
                const videoTrack = localParticipant.localParticipant.getTrackPublication(Track.Source.Camera);
                if (videoTrack) {
                    await localParticipant.localParticipant.setCameraEnabled(!videoTrack.isEnabled);
                }
            } catch (error) {
                console.error('Error toggling camera:', error);
            }
        }
    };

    const toggleMicrophone = async () => {
        if (localParticipant.localParticipant) {
            try {
                const audioTrack = localParticipant.localParticipant.getTrackPublication(Track.Source.Microphone);
                if (audioTrack) {
                    await localParticipant.localParticipant.setMicrophoneEnabled(!audioTrack.isEnabled);
                }
            } catch (error) {
                console.error('Error toggling microphone:', error);
            }
        }
    };

    const isCameraEnabled = localParticipant.localParticipant?.getTrackPublication(Track.Source.Camera)?.isEnabled ?? false;
    const isMicrophoneEnabled = localParticipant.localParticipant?.getTrackPublication(Track.Source.Microphone)?.isEnabled ?? false;

    // Для одного трека используем простой View (как в документации)
    if (tracks.length === 1) {
        const track = tracks[0];
        if (isTrackReference(track)) {
            console.log('📹 Rendering single track with View');
            console.log('📹 Track details:', {
                participant: track.participant?.identity,
                publication: track.publication?.kind,
                source: track.source,
                trackSid: track.publication?.trackSid,
            });
            return (
                <View style={styles.container}>
                    <VideoTrack
                        trackRef={track}
                        style={styles.participantView}
                        mirror={track.participant?.isLocal}
                        zOrder={0}
                    />
                    <View style={styles.controlsContainer}>
                        <TouchableOpacity
                            style={[styles.controlButton, styles.hangupButton]}
                            onPress={handleDisconnect}
                        >
                            <Text style={styles.controlButtonText}>📞 Положить трубку</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.controlButton, styles.toggleButton, !isCameraEnabled && styles.disabledButton]}
                            onPress={toggleCamera}
                        >
                            <Text style={styles.controlButtonText}>
                                {isCameraEnabled ? '📹 Камера' : '📹 Камера (выкл)'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.controlButton, styles.toggleButton, !isMicrophoneEnabled && styles.disabledButton]}
                            onPress={toggleMicrophone}
                        >
                            <Text style={styles.controlButtonText}>
                                {isMicrophoneEnabled ? '🎤 Микрофон' : '🎤 Микрофон (выкл)'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }
    }

    // Для нескольких треков используем FlatList
    const renderTrack: ListRenderItem<TrackReferenceOrPlaceholder> = ({ item }) => {
        if (isTrackReference(item)) {
            console.log('📹 Rendering track in FlatList');
            return (<VideoTrack trackRef={item} style={styles.participantView} />)
        } else {
            return (<View style={styles.participantView} />)
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={tracks}
                renderItem={renderTrack}
                keyExtractor={(item, index) => {
                    if (isTrackReference(item)) {
                        return item.participant?.sid || item.publication?.trackSid || `track-${index}`;
                    }
                    return `placeholder-${index}`;
                }}
            />
            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={[styles.controlButton, styles.hangupButton]}
                    onPress={handleDisconnect}
                >
                    <Text style={styles.controlButtonText}>📞 Положить трубку</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.controlButton, styles.toggleButton, !isCameraEnabled && styles.disabledButton]}
                    onPress={toggleCamera}
                >
                    <Text style={styles.controlButtonText}>
                        {isCameraEnabled ? '📹 Камера' : '📹 Камера (выкл)'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.controlButton, styles.toggleButton, !isMicrophoneEnabled && styles.disabledButton]}
                    onPress={toggleMicrophone}
                >
                    <Text style={styles.controlButtonText}>
                        {isMicrophoneEnabled ? '🎤 Микрофон' : '🎤 Микрофон (выкл)'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
    },
    participantView: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
    },
    controlButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        minWidth: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    callButton: {
        backgroundColor: '#4CAF50',
    },
    hangupButton: {
        backgroundColor: '#F44848',
    },
    toggleButton: {
        backgroundColor: '#2196F3',
    },
    disabledButton: {
        backgroundColor: '#666',
        opacity: 0.6,
    },
    controlButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    placeholderContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'transparent',
    },
    placeholderText: {
        color: '#FFFFFF',
        fontSize: 18,
        textAlign: 'center',
        fontWeight: '500',
    },
});

// export default function Call() {
//     // Start the audio session first.
//     const { token } = useCallToken('test');

//     useEffect(() => {
//         console.log('🔵 Call component mounted');
//         console.log('🔵 LIVEKIT_URL:', LIVEKIT_URL);
//         console.log('🔵 Token received:', token ? 'YES (length: ' + token.length + ')' : 'NO');

//         let start = async () => {
//             console.log('🔵 Starting audio session...');
//             await AudioSession.startAudioSession();
//             console.log('🔵 Audio session started');
//         };

//         start();
//         return () => {
//             console.log('🔵 Stopping audio session...');
//             AudioSession.stopAudioSession();
//         };
//     }, [token]);

//     useEffect(() => {
//         if (token) {
//             console.log('🔵 Attempting to connect to LiveKit');
//             console.log('🔵 Server URL:', LIVEKIT_URL);
//             console.log('🔵 Token preview:', token.substring(0, 50) + '...');
//         }
//     }, [token]);

//     if (!token) {
//         console.log('🔵 Waiting for token...');
//         return <Loader />
//     }

//     return (
//         <LiveKitRoom
//             serverUrl={LIVEKIT_URL}
//             token={token}
//             connect={true}
//             options={{
//                 // Use screen pixel density to handle screens with differing densities.
//                 adaptiveStream: { pixelDensity: 'screen' },
//             }}
//             audio={true}
//             video={true}
//             onConnected={() => {
//                 console.log('✅ LiveKit connected successfully!');
//                 console.log('✅ WebSocket connection established');
//             }}
//             onDisconnected={() => {
//                 console.log('❌ LiveKit disconnected');
//                 console.log('❌ WebSocket connection closed');
//             }}
//             onError={(error: any) => {
//                 console.error('❌ LiveKit error:', error);
//                 console.error('❌ Error type:', typeof error);
//                 console.error('❌ Error message:', error?.message || error?.toString());
//                 console.error('❌ Server URL used:', LIVEKIT_URL);
//                 console.error('❌ Expected WebSocket:', LIVEKIT_URL.replace('https://', 'wss://').replace(/\/$/, '') + '/rtc');
//                 if (error) {
//                     try {
//                         console.error('❌ Error details:', JSON.stringify(error, null, 2));
//                     } catch (e) {
//                         console.error('❌ Error (cannot stringify):', error);
//                     }
//                 }
//             }}
//         >
//             <RoomView />
//         </LiveKitRoom>
//     );
// };

// const RoomView = () => {
//     // Get all camera tracks.
//     const tracks = useTracks([Track.Source.Camera]);

//     useEffect(() => {
//         console.log('📹 RoomView - tracks count:', tracks.length);
//         tracks.forEach((track, index) => {
//             console.log(`📹 Track ${index}:`, {
//                 isTrackReference: isTrackReference(track),
//                 participant: track.participant?.identity,
//                 source: track.source,
//                 publication: track.publication?.kind,
//             });
//         });
//     }, [tracks]);

//     const renderTrack: ListRenderItem<TrackReferenceOrPlaceholder> = ({ item }) => {
//         // Render using the VideoTrack component.
//         if (isTrackReference(item)) {
//             console.log('📹 Rendering VideoTrack for:', item.participant?.identity);
//             return (
//                 <VideoTrack
//                     trackRef={item}
//                     style={styles.participantView}
//                     mirror={item.participant?.isLocal} // Зеркалим только локальное видео
//                 />
//             );
//         } else {
//             console.log('📹 Rendering placeholder (no track)');
//             return (
//                 <View style={[styles.participantView, styles.placeholder]}>
//                     <Text style={styles.placeholderText}>Waiting for video...</Text>
//                 </View>
//             );
//         }
//     };

//     if (tracks.length === 0) {
//         return (
//             <View style={styles.container}>
//                 <Text style={styles.noTracksText}>
//                     No video tracks available. This might be because:
//                     {'\n'}1. Emulator doesn't have a camera
//                     {'\n'}2. Camera permission not granted
//                     {'\n'}3. Camera not started yet
//                 </Text>
//             </View>
//         );
//     }

//     return (
//         <View style={styles.container}>
//             <FlatList
//                 data={tracks}
//                 renderItem={renderTrack}
//                 keyExtractor={(item, index) => {
//                     if (isTrackReference(item)) {
//                         return item.participant?.sid || item.publication?.trackSid || `track-${index}`;
//                     }
//                     return `placeholder-${index}`;
//                 }}
//             />
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         alignItems: 'stretch',
//         justifyContent: 'center',
//         // backgroundColor: '#000',
//     },
//     participantView: {
//         height: 300,
//         width: '100%',
//         // backgroundColor: '#1a1a1a',
//     },
//     placeholder: {
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     placeholderText: {
//         color: '#fff',
//         fontSize: 16,
//     },
//     noTracksText: {
//         color: '#fff',
//         fontSize: 14,
//         padding: 20,
//         textAlign: 'center',
//     },
// });
