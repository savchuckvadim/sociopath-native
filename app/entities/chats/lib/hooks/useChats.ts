import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '../api/ChatService';
import { MessageService } from '@/entities/messages/lib/api/MessageService';
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

export const useDeleteChat = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (chatId: string) => ChatService.deleteChat(chatId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        },
    });
};

export const useMarkChatAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        // Keep parity with web client: read state/unread counters are owned by messages endpoints.
        mutationFn: (chatId: string) => MessageService.markChatAsRead(chatId),
        onMutate: async (chatId) => {
            await queryClient.cancelQueries({ queryKey: ['chats', 'user'] });
            await queryClient.cancelQueries({ queryKey: ['chats', chatId] });
            await queryClient.cancelQueries({ queryKey: ['messages', 'unread', 'total'] });

            const prevChatsUser = queryClient.getQueryData<unknown[]>(['chats', 'user']);
            const prevChatById = queryClient.getQueryData<unknown>(['chats', chatId]);
            const prevTotalUnread = queryClient.getQueryData<number>(['messages', 'unread', 'total']);

            let consumedUnread = 0;

            if (Array.isArray(prevChatsUser)) {
                const nextChatsUser = prevChatsUser.map((chat: any) => {
                    if (chat?.id !== chatId) return chat;
                    const currentUnread = typeof chat?.unreadCount === 'number' ? chat.unreadCount : 0;
                    consumedUnread = currentUnread;
                    return { ...chat, unreadCount: 0 };
                });
                queryClient.setQueryData(['chats', 'user'], nextChatsUser);
            }

            if (prevChatById && typeof prevChatById === 'object') {
                queryClient.setQueryData(['chats', chatId], {
                    ...(prevChatById as Record<string, unknown>),
                    unreadCount: 0,
                });
            }

            if (typeof prevTotalUnread === 'number' && consumedUnread > 0) {
                queryClient.setQueryData(
                    ['messages', 'unread', 'total'],
                    Math.max(0, prevTotalUnread - consumedUnread),
                );
            }

            return { prevChatsUser, prevChatById, prevTotalUnread };
        },
        onError: (_error, chatId, context) => {
            if (!context) return;
            queryClient.setQueryData(['chats', 'user'], context.prevChatsUser);
            queryClient.setQueryData(['chats', chatId], context.prevChatById);
            queryClient.setQueryData(['messages', 'unread', 'total'], context.prevTotalUnread);
        },
        onSuccess: (_, chatId) => {
            queryClient.invalidateQueries({ queryKey: ['messages', 'chat', chatId] });
            queryClient.invalidateQueries({ queryKey: ['chats', chatId] });
            queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });
            queryClient.invalidateQueries({ queryKey: ['messages', 'unread', 'total'] });
        },
    });
};
