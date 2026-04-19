import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react-native';

interface CallControlsProps {
    isAudioMute: boolean;
    isVideoOnHold: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onEndCall: () => void;
    showSaveButton?: boolean;
    onSaveHistory?: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
    isAudioMute,
    isVideoOnHold,
    onToggleAudio,
    onToggleVideo,
    onEndCall,
    showSaveButton = false,
    onSaveHistory,
}) => {
    return (
        <View className="flex-row items-center justify-center gap-4 p-4 bg-black/80 rounded-lg">
            <TouchableOpacity
                onPress={onToggleAudio}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                    isAudioMute ? 'bg-red-600' : 'bg-gray-700'
                }`}
            >
                {isAudioMute ? (
                    <MicOff size={24} color="#fff" />
                ) : (
                    <Mic size={24} color="#fff" />
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onToggleVideo}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                    isVideoOnHold ? 'bg-red-600' : 'bg-gray-700'
                }`}
            >
                {isVideoOnHold ? (
                    <VideoOff size={24} color="#fff" />
                ) : (
                    <Video size={24} color="#fff" />
                )}
            </TouchableOpacity>

            {showSaveButton && onSaveHistory && (
                <TouchableOpacity
                    onPress={onSaveHistory}
                    className="w-14 h-14 rounded-full items-center justify-center bg-gray-700"
                >
                    <Text className="text-white">💾</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                onPress={onEndCall}
                className="w-14 h-14 rounded-full items-center justify-center bg-red-600"
            >
                <PhoneOff size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};
