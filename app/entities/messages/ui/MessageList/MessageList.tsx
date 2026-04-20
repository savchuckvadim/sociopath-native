import { View, Text } from 'react-native';
import { Message } from '../../lib/types/messages.types';
import { MessageItem } from '../MessageItem';
import { dayKeyForMessage, formatChatDaySeparatorLabel } from '../../lib/utils/message-day-label.util';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onRetryFailed?: (tempMessageId: string) => void;
}

export const MessageList = ({ messages, currentUserId, onRetryFailed }: MessageListProps) => {
  return (
    <View className="flex flex-col">
      {messages.map((message: Message, index) => {
        const isOwn = message.senderId === currentUserId;
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;

        const dayKey = dayKeyForMessage(message.createdAt);
        const prevDayKey = prevMessage ? dayKeyForMessage(prevMessage.createdAt) : null;
        const showDaySep = !prevMessage || dayKey !== prevDayKey;

        return (
          <View key={message.id}>
            {showDaySep ? (
              <View className="mb-3 items-center">
                <Text className="text-xs text-gray-400">{formatChatDaySeparatorLabel(message.createdAt)}</Text>
              </View>
            ) : null}
            <MessageItem
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
              onRetryFailed={onRetryFailed}
            />
          </View>
        );
      })}
      <View className="h-5" />
    </View>
  );
};
