import { useQueryClient } from '@tanstack/react-query';
import { useCreateMessage } from '@/entities/messages';
import { Message, MessageType } from '@/entities/messages';
import { IUser } from '@/entities/user';
import { scrollToBottom } from '@/entities/messages/lib/utils/scroll-to-bottom.util';
import { RefObject } from 'react';
import { ScrollView } from 'react-native';

interface UseSendMessageProps {
    chatId: string | null;
    currentUser: IUser | null;
    messagesEndRef: RefObject<ScrollView | null>;
}

export const useSendMessage = ({ chatId, currentUser, messagesEndRef }: UseSendMessageProps) => {
    const queryClient = useQueryClient();
    const createMessageMutation = useCreateMessage();

    const sendMessage = async (content: string) => {
        if (!chatId || !content.trim() || !currentUser) return;

        const messageText = content.trim();

        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            chatId: chatId,
            senderId: currentUser.id!,
            content: messageText,
            type: MessageType.TEXT,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sender: {
                id: currentUser.id!,
                name: currentUser.name || '',
                email: currentUser.email || '',
            },
        } as Message;

        queryClient.setQueryData(
            ['messages', 'chat', chatId, 50, 0],
            (oldData: Message[] | undefined) => {
                if (!oldData) return [tempMessage];
                return [...oldData, tempMessage];
            }
        );

        setTimeout(() => {
            scrollToBottom(messagesEndRef);
        }, 50);

        try {
            const sentMessage = await createMessageMutation.mutateAsync({
                chatId: chatId,
                content: messageText,
            });

            const messageData = sentMessage as Message;

            queryClient.setQueryData(
                ['messages', 'chat', chatId, 50, 0],
                (oldData: Message[] | undefined) => {
                    if (!oldData) {
                        return [messageData];
                    }
                    const filtered = oldData.filter((msg: Message) => !msg.id?.startsWith('temp-'));
                    const exists = filtered.some((msg: Message) => msg.id === messageData.id);
                    if (exists) {
                        return filtered;
                    }
                    return [...filtered, messageData];
                }
            );

            queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });

            setTimeout(() => {
                scrollToBottom(messagesEndRef);
            }, 100);
        } catch (error) {
            console.error('Failed to send message:', error);
            queryClient.setQueryData(
                ['messages', 'chat', chatId, 50, 0],
                (oldData: Message[] | undefined) => {
                    if (!oldData) return [];
                    return oldData.filter((msg: Message) => !msg.id?.startsWith('temp-'));
                }
            );
            throw error;
        }
    };

    return {
        sendMessage,
        isPending: createMessageMutation.isPending,
    };
};
