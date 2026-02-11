import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/processes/auth';
import { Loader } from '@/shared';
import { ChatMessagesWidget, ChatInputWidget } from '@/widgetes/chat';
import { useUserChats, useMarkChatAsRead, useChatSocket, useSendMessage, Chat } from '@/entities/chats';
import { scrollToBottom } from '@/entities/messages/lib/utils/scroll-to-bottom.util';
import { useRoute, RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
import { TypeRootStackParamList } from '@/processes/navigation/interface/navigation.interface';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatMemberDto } from '@/api';

type ChatScreenRouteProp = RouteProp<TypeRootStackParamList, 'Chat'>;

export default function ChatScreen() {
    const { user } = useAuth();
    const route = useRoute<ChatScreenRouteProp>();
    const navigation = useNavigation<NavigationProp<TypeRootStackParamList>>();
    const { chatId } = route.params;
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<ScrollView>(null);
    const lastMarkedChatIdRef = useRef<string | null>(null);
    const insets = useSafeAreaInsets();

    const { data: chats } = useUserChats();
    const markChatReadMutation = useMarkChatAsRead();

    const selectedChat = (chats as Chat[] | undefined)?.find((c) => c.id === chatId);

    // Получаем другого участника чата (не текущего пользователя)
    const otherMember = selectedChat?.members?.find(
        (m: ChatMemberDto) => m.userId !== user?.id
    );

    // WebSocket hook
    useChatSocket({
        chatId: chatId || null,
        userId: user?.id,
        messagesEndRef,
    });

    // Send message hook
    const { sendMessage, isPending: isSendingMessage } = useSendMessage({
        chatId: chatId || null,
        currentUser: user,
        messagesEndRef,
    });

    // Mark chat as read when selected (only once per chat)
    useEffect(() => {
        if (chatId && lastMarkedChatIdRef.current !== chatId) {
            lastMarkedChatIdRef.current = chatId;
            markChatReadMutation.mutate(chatId);
        }
    }, [chatId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current && chatId) {
            setTimeout(() => {
                scrollToBottom(messagesEndRef);
            }, 100);
        }
    }, [chatId]);

    if (!user || !user.id) {
        return (
            <View className="flex-1 items-center justify-center">
                <Loader />
            </View>
        );
    }

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        try {
            await sendMessage(messageText);
            setMessageText('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleAudioCall = () => {
        if (!chatId) return;
        navigation.navigate('Call', {
            roomName: chatId,
            callType: 'audio',
        });
    };

    const handleVideoCall = () => {
        if (!chatId) return;
        navigation.navigate('Call', {
            roomName: chatId,
            callType: 'video',
        });
    };

    const content = (
        <>
            <View className="flex-1">
                <ChatMessagesWidget
                    chatId={chatId || null}
                    currentUserId={user.id}
                    selectedChat={selectedChat}
                    messagesEndRef={messagesEndRef}
                />
            </View>
            {chatId && (
                <View style={{ paddingBottom: insets.bottom }}>
                    <ChatInputWidget
                        messageText={messageText}
                        onMessageTextChange={setMessageText}
                        onSendMessage={handleSendMessage}
                        isPending={isSendingMessage}
                        onAudioCall={handleAudioCall}
                        onVideoCall={handleVideoCall}
                    />
                </View>
            )}
        </>
    );

    // На Android используем настройку из app.json (softwareKeyboardLayoutMode: "resize")
    // На iOS используем KeyboardAvoidingView
    if (Platform.OS === 'ios') {
        return (
            <KeyboardAvoidingView
                className="flex-1 bg-gray-50"
                behavior="padding"
                keyboardVerticalOffset={0}
                style={{ flex: 1 }}
            >
                {content}
            </KeyboardAvoidingView>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {content}
        </View>
    );
}
