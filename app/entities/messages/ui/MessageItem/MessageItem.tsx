import { View, Text, Image } from 'react-native';
import { Message } from '../../lib/types/messages.types';
import { UserAvatar } from '@/shared';
import { useUser } from '@/entities/user';

interface MessageItemProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
}

export const MessageItem = ({ message, isOwn, showAvatar = true }: MessageItemProps) => {

  const { user } = useUser(message.sender?.id || '');
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <View className={`flex-row gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {showAvatar && !isOwn && ( <UserAvatar user={user} />
                // <View className="w-8 h-8 rounded-full bg-gray-300 items-center justify-center">
                //     {message.sender?.name ? (
                //         <Text className="text-xs font-bold text-gray-600">
                //             {message.sender.name.charAt(0).toUpperCase()}
                //         </Text>
                //     ) : (
                //         <Text className="text-xs font-bold text-gray-600">U</Text>
                //     )}
                // </View>
            )}
            <View className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${showAvatar && !isOwn ? 'max-w-[75%]' : 'max-w-[70%]'}`}>
                {!isOwn && showAvatar && (
                    <Text className="text-xs font-medium mb-1 text-gray-500 px-1">
                        {message.sender?.name || 'Пользователь'}
                    </Text>
                )}
                <View
                    className={`rounded-lg px-4 py-2 ${
                        isOwn
                            ? 'bg-blue-500'
                            : 'bg-gray-200'
                    }`}
                >
                    <Text className={`text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                        {message.content}
                    </Text>
                    <Text className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.createdAt)}
                    </Text>
                </View>
            </View>
        </View>
    );
};
