import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import type { Chat } from '@/entities/chats/lib/types/chats.types';
import { MessageList } from '@/entities/messages/ui/MessageList';
import { NO_MESSAGES_MESSAGE } from '@/entities/messages/lib/types/messages.types';
import { ChatDtoType } from '@/api';
import { Loader } from '@/shared';
import { Feather } from '@expo/vector-icons';
import { SecretChatSettingsMenu } from '../SecretChatSettingsMenu/SecretChatSettingsMenu';
import { useChatMessagesWidget } from './useChatMessagesWidget';

interface ChatMessagesWidgetProps {
  chatId: string | null;
  currentUserId: string;
  selectedChat: Chat | undefined;
  messagesEndRef: React.RefObject<ScrollView | null>;
  onRetryFailed?: (tempMessageId: string) => void;
}

export const ChatMessagesWidget = ({
  chatId,
  currentUserId,
  selectedChat,
  messagesEndRef,
  onRetryFailed,
}: ChatMessagesWidgetProps) => {
  const {
    navigation,
    sortedMessages,
    messagesLoading,
    hasScrolledToBottomRef,
    chatName,
    isSignal,
  } = useChatMessagesWidget({
    chatId,
    currentUserId,
    selectedChat,
    messagesEndRef,
  });

  if (!chatId) {
    return (
      <View className="flex-1 items-center justify-center">
        <View className="items-center">
          <Feather name="message-circle" size={64} color="#999" />
          <Text className="text-gray-500 mt-4">Выберите диалог или создайте новый</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex flex-col flex-1 overflow-hidden h-screen">
      <View className="border-b p-4 bg-white flex-shrink-0 flex-row items-center justify-between">
        <View className="flex-shrink-0 flex-row items-center gap-2 flex-1 min-w-0">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color="#666" />
          </TouchableOpacity>
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-2">
              <Text className="font-semibold text-base flex-shrink" numberOfLines={1}>
                {chatName}
              </Text>
              {isSignal ? <Feather name="lock" size={16} color="#2563eb" /> : null}
            </View>
            {selectedChat?.type === ChatDtoType.GROUP && (
              <Text className="text-sm text-gray-500">{selectedChat.members?.length} участников</Text>
            )}
            {isSignal ? (
              <Text className="text-xs text-blue-600 mt-0.5">Защищённый диалог (Signal E2EE)</Text>
            ) : null}
          </View>
        </View>
        {chatId && isSignal ? <SecretChatSettingsMenu chatId={chatId} /> : null}
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
              onRetryFailed={onRetryFailed}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
};
