import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { PresenceStatus, IPresence } from '../types/presence.types';
import { formatRelativeDate } from '@/shared/lib/utils/format-relative-date';

const PRESENCE_QUERY_KEY = ['presence'];

/**
 * Хук для работы с presence состоянием пользователей
 * Использует React Query вместо Redux для хранения состояния
 */
export const usePresence = () => {
    const queryClient = useQueryClient();

    // Получаем текущее состояние presence из React Query cache
    const presenceData = useQuery<Record<string, IPresence>>({
        queryKey: PRESENCE_QUERY_KEY,
        queryFn: () => ({}), // Начальное состояние - пустой объект
        initialData: {},
    });

    const presence = presenceData.data || {};

    const getPresenceUser = useCallback((userId: string): IPresence | undefined => {
        return presence[userId];
    }, [presence]);

    const getIsUserOnline = useCallback((userId: string): boolean => {
        return presence[userId]?.status === PresenceStatus.ONLINE;
    }, [presence]);

    const getPresenceUsers = useCallback((userIds: string[]): IPresence[] => {
        return userIds
            .map(id => presence[id])
            .filter(Boolean) as IPresence[];
    }, [presence]);

    const updatePresenceUser = useCallback((
        userId: string,
        status: PresenceStatus,
        timestamp?: Date
    ) => {
        const now = timestamp || new Date();
        const lastSeenAt = formatRelativeDate(now);
        const newPresenceItem: IPresence = { userId, status, lastSeenAt };

        // Обновляем кэш React Query
        queryClient.setQueryData<Record<string, IPresence>>(
            PRESENCE_QUERY_KEY,
            (oldData) => {
                const currentData = oldData || {};
                return {
                    ...currentData,
                    [userId]: newPresenceItem,
                };
            }
        );
    }, [queryClient]);

    const setPresence = useCallback((presenceData: Record<string, IPresence>) => {
        queryClient.setQueryData(PRESENCE_QUERY_KEY, presenceData);
    }, [queryClient]);

    return {
        presence,
        getPresenceUser,
        getIsUserOnline,
        getPresenceUsers,
        updatePresenceUser,
        setPresence,
    };
};
