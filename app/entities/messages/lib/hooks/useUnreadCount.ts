import { useUserChats } from '@/entities/chats/lib/hooks/useChats';

/**
 * Хук для получения общего количества непрочитанных сообщений
 */
export function useUnreadCount() {
    const { data: chats } = useUserChats();

    const unreadCount = chats?.reduce((total, chat) => {
        return total + (chat.unreadCount || 0);
    }, 0) || 0;

    return {
        unreadCount,
        hasUnread: unreadCount > 0,
    };
}
