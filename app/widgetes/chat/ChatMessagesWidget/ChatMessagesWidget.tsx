import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Chat, ChatType } from '@/entities/chats';
import { MessageList, Message, useChatMessages, NO_MESSAGES_MESSAGE } from '@/entities/messages';
import { ChatMemberDto } from '@/api';
import { Loader } from '@/shared';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useRef, useEffect } from 'react';
import { scrollToBottom } from '@/entities/messages/lib/utils/scroll-to-bottom.util';

interface ChatMessagesWidgetProps {
    chatId: string | null;
    currentUserId: string;
    selectedChat: Chat | undefined;
    messagesEndRef: React.RefObject<ScrollView | null>;
}

export const ChatMessagesWidget = ({
    chatId,
    currentUserId,
    selectedChat,
    messagesEndRef,
}: ChatMessagesWidgetProps) => {
    const navigation = useNavigation();
    const { data: messages, isLoading: messagesLoading } = useChatMessages(
        chatId || '',
        50,
        0
    );
    const hasScrolledToBottomRef = useRef(false);

    const sortedMessages = messages ? (messages as unknown as Message[]) : [];

    // Сброс флага при смене чата
    useEffect(() => {
        hasScrolledToBottomRef.current = false;
    }, [chatId]);

    // Автоматическая прокрутка к последнему сообщению при первой загрузке
    useEffect(() => {
        if (!messagesLoading && sortedMessages.length > 0 && !hasScrolledToBottomRef.current && messagesEndRef.current) {
            hasScrolledToBottomRef.current = true;
            // Используем несколько таймаутов для надежности на разных устройствах
            setTimeout(() => {
                messagesEndRef.current?.scrollToEnd({ animated: false });
            }, 100);
            setTimeout(() => {
                messagesEndRef.current?.scrollToEnd({ animated: true });
            }, 300);
        }
    }, [messagesLoading, sortedMessages.length, chatId]);

    if (!chatId) {
        return (
            <View className="flex-1 items-center justify-center">
                <View className="items-center">
                    <Feather name="message-circle" size={64} color="#999" />
                    <Text className="text-gray-500 mt-4">
                        Выберите диалог или создайте новый
                    </Text>
                </View>
            </View>
        );
    }

    const otherUser = selectedChat?.members?.find((m: ChatMemberDto) => m.userId !== currentUserId) || null;
    const chatName = selectedChat?.type === ChatType.PRIVATE
        ? otherUser?.user?.name || 'Пользователь'
        : selectedChat?.name || 'Групповой чат';

    return (
        <View className="flex flex-col flex-1 overflow-hidden h-screen">
            {/* Заголовок чата */}
            <View className="border-b p-4 bg-white flex-shrink-0 flex-row items-center justify-between">
                <View className="flex-shrink-0 flex-row items-center gap-2">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Feather name="arrow-left" size={20} color="#666" />
                    </TouchableOpacity>
                    <View>
                        <Text className="font-semibold text-base">{chatName}</Text>
                        {selectedChat?.type === ChatType.GROUP && (
                            <Text className="text-sm text-gray-500">
                                {selectedChat.members?.length} участников
                            </Text>
                        )}
                    </View>
                </View>
                <View className="flex-row gap-2">
                    {/* Кнопки звонков будут добавлены позже */}
                </View>
            </View>

            {sortedMessages.length === 0 ? (
                <View className="flex-1 bg-gray-50 items-center justify-center">
                    <Text className="text-gray-500">{NO_MESSAGES_MESSAGE}</Text>
                </View>
            ) : (
                <ScrollView
                    ref={messagesEndRef}
                    className="flex-1 p-4"
                    contentContainerStyle={{ flexGrow: 1 }}
                    onContentSizeChange={() => {
                        // Автоматическая прокрутка при изменении размера контента (первая загрузка)
                        if (!hasScrolledToBottomRef.current && sortedMessages.length > 0 && !messagesLoading) {
                            hasScrolledToBottomRef.current = true;
                            setTimeout(() => {
                                messagesEndRef.current?.scrollToEnd({ animated: false });
                            }, 50);
                        }
                    }}
                >
                    {messagesLoading ? (
                        <Loader />
                    ) : (
                        <MessageList
                            messages={sortedMessages}
                            currentUserId={currentUserId}
                        />
                    )}
                </ScrollView>
            )}
        </View>
    );
};
