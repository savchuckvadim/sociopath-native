import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '../api/ChatService';
import { CreateChatDto, UpdateChatDto, AddMemberDto } from '@/api';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';

export const useUserChats = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['chats', 'user'],
        queryFn: () => ChatService.getUserChats(),
        enabled: !!user?.id,
    });
};

export const useChatById = (chatId: string) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['chats', chatId],
        queryFn: () => ChatService.getChatById(chatId),
        enabled: !!user?.id && !!chatId,
    });
};

export const useCreateChat = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateChatDto) => ChatService.createChat(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        },
    });
};

export const useUpdateChat = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateChatDto }) =>
            ChatService.updateChat(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['chats', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });
        },
    });
};

export const useAddMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ chatId, data }: { chatId: string; data: AddMemberDto }) =>
            ChatService.addMember(chatId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['chats', variables.chatId] });
        },
    });
};

export const useMarkChatAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (chatId: string) => ChatService.markAsRead(chatId),
        onSuccess: (_, chatId) => {
            queryClient.invalidateQueries({ queryKey: ['chats', chatId] });
            queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });
        },
    });
};
