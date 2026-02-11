import { View, Text } from 'react-native';
import { Message, NO_MESSAGES_MESSAGE } from '../../lib/types/messages.types';
import { MessageItem } from '../MessageItem';

interface MessageListProps {
    messages: Message[];
    currentUserId: string;
    messagesEndRef: React.RefObject<any>;
}

export const MessageList = ({ messages, currentUserId, messagesEndRef }: MessageListProps) => {
    if (messages.length === 0) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-gray-500">{NO_MESSAGES_MESSAGE}</Text>
            </View>
        );
    }

    return (
        <View className="flex flex-col">
            {messages.map((message: Message, index) => {
                const isOwn = message.senderId === currentUserId;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
                return (
                    <MessageItem
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                    />
                );
            })}
            <View ref={messagesEndRef} />
        </View>
    );
};
