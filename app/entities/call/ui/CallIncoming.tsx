import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useGlobalCallContext } from '../lib/context/GlobalCallProvider';
import { useUser } from '@/entities/user';
import { Phone, PhoneOff } from 'lucide-react-native';

export const CallIncoming = () => {
    const { callType, incomingCallFromUserId, acceptCall, rejectCall } = useGlobalCallContext();
    const { user } = useUser(incomingCallFromUserId || '');

    return (
        <View className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
            <View className="flex flex-col gap-4 items-center">
                <View className="items-center">
                    <Text className="text-white text-xl font-semibold mb-4">
                        Входящий {callType === 'VIDEO' ? 'видео' : 'аудио'} звонок
                    </Text>
                    {user && (
                        <View className="items-center gap-2">
                            {user.avatarUrl ? (
                                <Image
                                    source={{ uri: user.avatarUrl }}
                                    className="w-20 h-20 rounded-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-20 h-20 rounded-full bg-gray-300 items-center justify-center">
                                    <Text className="text-2xl font-bold text-gray-600">
                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                    </Text>
                                </View>
                            )}
                            <Text className="text-white text-lg font-semibold">{user.name}</Text>
                        </View>
                    )}
                </View>
                <View className="flex-row gap-4">
                    <TouchableOpacity
                        onPress={() => {
                            console.log('✅ [CALL WRAPPER] Accept button clicked');
                            acceptCall();
                        }}
                        className="bg-green-600 px-6 py-3 rounded-lg flex-row items-center gap-2"
                    >
                        <Phone size={20} color="#fff" />
                        <Text className="text-white font-semibold">Принять</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            console.log('❌ [CALL WRAPPER] Reject button clicked');
                            rejectCall();
                        }}
                        className="bg-red-600 px-6 py-3 rounded-lg flex-row items-center gap-2"
                    >
                        <PhoneOff size={20} color="#fff" />
                        <Text className="text-white font-semibold">Отклонить</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
