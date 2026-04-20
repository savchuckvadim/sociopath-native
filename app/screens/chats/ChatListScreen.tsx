import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';
import { Loader } from '@/shared';
import { ChatListWidget } from '@/widgetes/chat/ChatListWidget/ChatListWidget';
import { useUserChats } from '@/entities/chats/lib/hooks/useChats';
import { IncomingInvitationsBanner } from '@/features/invitations';
import { Feather } from '@expo/vector-icons';

export default function ChatListScreen() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const { data: chats, isLoading: chatsLoading } = useUserChats();
    console.log('🔐 ChatListScreen - chats:', chats);
    if (!user || !user.id) {
        return (
            <View className="flex-1 items-center justify-center">
                <Loader />
            </View>
        );
    }



    const chatsArray = Array.isArray(chats) ? chats : [];

    // Сортируем чаты: сначала непрочитанные, затем по дате последнего сообщения
    const sortedChats = [...chatsArray].sort((a, b) => {
        // Сначала сортируем по наличию непрочитанных сообщений
        const aHasUnread = (a.unreadCount || 0) > 0;
        const bHasUnread = (b.unreadCount || 0) > 0;

        if (aHasUnread && !bHasUnread) return -1;
        if (!aHasUnread && bHasUnread) return 1;

        // Если оба имеют или не имеют непрочитанных, сортируем по дате последнего сообщения
        const aCreatedAt = a.lastMessage?.createdAt;
        const bCreatedAt = b.lastMessage?.createdAt;

        const aDate = aCreatedAt
            ? new Date(aCreatedAt as string | number).getTime()
            : 0;
        const bDate = bCreatedAt
            ? new Date(bCreatedAt as string | number).getTime()
            : 0;

        return bDate - aDate; // Новые сверху
    });

    const filteredChats = sortedChats.filter((chat) => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
            chat.name?.toLowerCase().includes(searchLower) ||
            chat.members?.some((m) =>
                m.user?.name.toLowerCase().includes(searchLower) ||
                m.user?.email.toLowerCase().includes(searchLower)
            )
        );
    }) || [];

    return (
        <View className="flex-1 bg-gray-50">
            <View className="p-4 bg-white border-b">
                <View className="flex-row items-center gap-2 mb-4">
                    <Text className="text-2xl font-bold">Диалоги</Text>
                    <TouchableOpacity
                        onPress={() => {
                            // TODO: Открыть диалог выбора пользователей
                        }}
                    >
                        <Feather name="plus" size={24} color="#666" />
                    </TouchableOpacity>
                </View>
                <View className="flex-row items-center gap-2">
                    <Feather name="search" size={20} color="#999" style={{ position: 'absolute', left: 12, zIndex: 1 }} />
                    <TextInput
                        className="flex-1 border border-gray-300 rounded-lg px-10 py-2"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>
            <IncomingInvitationsBanner />
            <ChatListWidget
                chats={filteredChats}
                currentUserId={user.id}
                isLoading={chatsLoading}
            />
        </View>
    );
}
