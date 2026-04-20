import React from 'react';
import { View } from 'react-native';
import { ChatsListItem } from './ChatsListItem';
import { ChatDto } from '@/api';

export interface ChatListProps {
    chats: ChatDto[];
    currentUserId: string;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, currentUserId }) => {
    return (
        <View className="flex flex-col gap-2 p-2">
            {chats.map((chat: ChatDto) => (
                <ChatsListItem
                    key={chat.id}
                    chat={chat}
                    currentUserId={currentUserId}
                    allChats={chats}
                />
            ))}
        </View>
    );
};
