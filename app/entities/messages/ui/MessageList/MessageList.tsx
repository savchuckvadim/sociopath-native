import { View } from 'react-native';
import { Message } from '../../lib/types/messages.types';
import { MessageItem } from '../MessageItem';

interface MessageListProps {
    messages: Message[];
    currentUserId: string;
}

export const MessageList = ({ messages, currentUserId }: MessageListProps) => {
    return (
        <View className="flex flex-col">
            {messages.map((message: Message, index) => {
                const isOwn = message.senderId === currentUserId;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                // Показываем аватар, если это первое сообщение или предыдущее сообщение от другого пользователя
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
            {/* Отступ внизу для корректной прокрутки */}
            <View className="h-5" />
        </View>
    );
};
