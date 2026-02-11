import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChatMemberDto, ChatType } from '../../lib/types/chats.types';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { ChatDto } from '@/api';
import { TypeRootStackParamList } from '@/processes/navigation/interface/navigation.interface';

interface ChatsListItemProps {
    chat: ChatDto;
    currentUserId: string;
}

export const ChatsListItem = ({ chat, currentUserId }: ChatsListItemProps) => {
    const navigation = useNavigation<NavigationProp<TypeRootStackParamList>>();

    const handleChatSelect = (chatId: string) => {
        navigation.navigate('Chat', { chatId });
    };

    const otherMembers = chat.members?.filter(
        (m: ChatMemberDto) => m.userId !== currentUserId
    ) || [];

    const chatName =
        chat.type === ChatType.PRIVATE || chat.type === 'PRIVATE'
            ? otherMembers[0]?.user?.name || 'Пользователь'
            : chat.name || 'Групповой чат';

    const lastMessageContent = chat.lastMessage?.content
        ? String(chat.lastMessage.content)
        : null;

    return (
        <TouchableOpacity
            onPress={() => handleChatSelect(chat.id)}
            className="bg-white flex-row items-center gap-3 p-4 rounded-xl mb-2"
        >
            <View className="relative">
                <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
                    {chat.avatar ? (
                        <Image
                            source={{ uri: chat.avatar }}
                            className="w-full h-full rounded-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <Text className="text-lg font-bold text-gray-600">
                            {chatName.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>
            </View>
            <View className="flex-1 min-w-0">
                <Text className="font-medium text-sm" numberOfLines={1}>{chatName}</Text>
                {lastMessageContent && (
                    <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                        {lastMessageContent}
                    </Text>
                )}
            </View>
            {chat.unreadCount && chat.unreadCount > 0 && (
                <View className="flex items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-red-500" />
                </View>
            )}
        </TouchableOpacity>
    );
};
