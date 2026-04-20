import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';
import { Loader } from '@/shared';
import { ChatMessagesWidget } from '@/widgetes/chat/ChatMessagesWidget/ChatMessagesWidget';
import { ChatInputWidget } from '@/widgetes/chat/ChatInputWidget/ChatInputWidget';
import {
  useUserChats,
  useMarkChatAsRead,
  useChatById,
} from '@/entities/chats/lib/hooks/useChats';
import { useChatSocket } from '@/entities/chats/lib/hooks/useChatSocket';
import { useSendMessage } from '@/entities/chats/lib/hooks/useSendMessage';
import type { Chat } from '@/entities/chats/lib/types/chats.types';
import { scrollToBottom } from '@/entities/messages/lib/utils/scroll-to-bottom.util';
import { useRoute, RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
import { TypeRootStackParamList } from '@/processes/navigation/interface/navigation.interface';
import { initMessengerCryptoSession } from '@/entities/encryption/lib/init-messenger-crypto';

type ChatScreenRouteProp = RouteProp<TypeRootStackParamList, 'Chat'>;

export default function ChatScreen() {
  const { user } = useAuth();
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<NavigationProp<TypeRootStackParamList>>();
  const { chatId } = route.params;
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const lastMarkedChatIdRef = useRef<string | null>(null);

  const { data: chats } = useUserChats();
  const { data: chatFromApi } = useChatById(chatId);
  const markChatReadMutation = useMarkChatAsRead();

  const selectedChat = (chatFromApi as Chat | undefined) ?? (chats as Chat[] | undefined)?.find((c) => c.id === chatId);

  const otherMember = selectedChat?.members?.find((m) => m.userId !== user?.id);

  useEffect(() => {
    void initMessengerCryptoSession();
  }, []);

  useChatSocket({
    chatId: chatId || null,
    userId: user?.id,
    messagesEndRef,
  });

  const { sendMessage, retryFailedMessage, isPending: isSendingMessage } = useSendMessage({
    chatId: chatId || null,
    currentUser: user,
    messagesEndRef,
    chat: selectedChat,
  });

  useEffect(() => {
    if (chatId && lastMarkedChatIdRef.current !== chatId) {
      lastMarkedChatIdRef.current = chatId;
      markChatReadMutation.mutate(chatId);
    }
  }, [chatId]);

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

  const content = (
    <>
      <View className="flex-1">
        <ChatMessagesWidget
          chatId={chatId || null}
          currentUserId={user.id}
          selectedChat={selectedChat}
          messagesEndRef={messagesEndRef}
          onRetryFailed={retryFailedMessage}
        />
      </View>
      {chatId && (
        <View>
          <ChatInputWidget
            chatId={chatId || ''}
            otherUserId={otherMember?.userId || ''}
            messageText={messageText}
            onMessageTextChange={setMessageText}
            onSendMessage={handleSendMessage}
            isPending={isSendingMessage}
            onAudioCall={handleAudioCall}
          />
        </View>
      )}
    </>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView className="flex-1 bg-gray-50" behavior="padding" keyboardVerticalOffset={0} style={{ flex: 1 }}>
        {content}
      </KeyboardAvoidingView>
    );
  }

  return <View className="flex-1 bg-gray-50">{content}</View>;
}
