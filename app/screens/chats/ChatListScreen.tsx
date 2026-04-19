import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';
import { Loader } from '@/shared';
import { ChatListWidget } from '@/widgetes/chat';
import { useUserChats, ChatType, CreateChat, useCreateChat } from '@/entities/chats';
import { useUser } from '@/entities/user/lib/hook/user.hook';
import { ChatMemberDto, CreateChatDto, ChatDto } from '@/api';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { TypeRootStackParamList } from '@/processes/navigation/interface/navigation.interface';

export default function ChatListScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<NavigationProp<TypeRootStackParamList>>();
    const [searchQuery, setSearchQuery] = useState('');

    if (!user || !user.id) {
        return (
            <View className="flex-1 items-center justify-center">
                <Loader />
            </View>
        );
    }

    const { data: chats, isLoading: chatsLoading } = useUserChats();
    const { users: allUsers } = useUser(user.id);
    const createChatMutation = useCreateChat();

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

        const aDate = aCreatedAt && (typeof aCreatedAt === 'string' || typeof aCreatedAt === 'number' || aCreatedAt instanceof Date)
            ? new Date(aCreatedAt as string | number | Date).getTime()
            : 0;
        const bDate = bCreatedAt && (typeof bCreatedAt === 'string' || typeof bCreatedAt === 'number' || bCreatedAt instanceof Date)
            ? new Date(bCreatedAt as string | number | Date).getTime()
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

    const handleUserSelect = async (userId: string) => {
        // Проверяем, есть ли уже чат с этим пользователем
        const existingChat = chatsArray.find((c: ChatDto) =>
            c.members?.some((m: ChatMemberDto) => m.userId === userId)
        );

        if (existingChat) {
            navigation.navigate('Chat', { chatId: existingChat.id });
        } else {
            // Создаем новый чат
            try {
                const chatData: CreateChat = {
                    type: ChatType.PRIVATE,
                    memberIds: [user.id, userId],
                    name: '',
                    description: '',
                };
                const chat = await createChatMutation.mutateAsync(chatData as CreateChatDto);
                navigation.navigate('Chat', { chatId: chat.id });
            } catch (error) {
                console.error('Failed to create chat:', error);
            }
        }
    };

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
            <ChatListWidget
                chats={filteredChats}
                currentUserId={user.id}
                isLoading={chatsLoading}
            />
        </View>
    );
}
