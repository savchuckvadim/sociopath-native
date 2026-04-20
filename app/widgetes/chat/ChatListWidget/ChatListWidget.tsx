import { View, ScrollView } from 'react-native';
import { ChatList } from '@/entities/chats/ui/ChatsList';
import { Loader, Empty } from '@/shared';
import { ChatDto } from '@/api';

interface ChatListWidgetProps {
    chats: ChatDto[];
    currentUserId: string;
    isLoading: boolean;
}

export const ChatListWidget = ({ chats, currentUserId, isLoading }: ChatListWidgetProps) => {
    return (
        <ScrollView className="flex-1">
            {isLoading ? (
                <View className="p-4 items-center">
                    <Loader />
                </View>
            ) : !chats || chats.length === 0 ? (
                <Empty text="Нет диалогов" />
            ) : (
                <ChatList chats={chats} currentUserId={currentUserId} />
            )}
        </ScrollView>
    );
};
