import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '../api/MessageService';
import { CreateMessageDto, MessagesGetChatMessagesParams } from '@/api';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';

export const useChatMessages = (chatId: string, limit?: number, offset?: number) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['messages', 'chat', chatId, limit, offset],
        queryFn: () => {
            const params: MessagesGetChatMessagesParams = {
                limit: limit !== undefined ? limit.toString() : '50',
                offset: offset !== undefined ? offset.toString() : '0',
            };
            return MessageService.getChatMessages(chatId, params);
        },
        enabled: !!user?.id && !!chatId,
    });
};

export const useMessageById = (messageId: string) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['messages', messageId],
        queryFn: () => MessageService.getMessageById(messageId),
        enabled: !!user?.id && !!messageId,
    });
};

export const useCreateMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateMessageDto) => MessageService.createMessage(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['messages', 'chat', variables.chatId] });
            queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });
        },
    });
};

export const useDeleteMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (messageId: string) => MessageService.deleteMessage(messageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
        },
    });
};
