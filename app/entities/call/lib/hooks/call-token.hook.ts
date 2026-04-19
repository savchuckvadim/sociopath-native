import { getCalls } from "@/api/generated/calls/calls";
import { useAuth } from "@/processes/auth/lib/hooks/auth.hook";
import { useQuery } from "@tanstack/react-query";

/**
 * Хук для получения LiveKit токена
 * Запрос выполняется только если есть roomName
 */
export const useCallToken = (roomName: string | null) => {
    const { user } = useAuth();
    const api = getCalls();

    const { data, isPending: isLoading, error } = useQuery({
        queryKey: ['livekit-token', user?.id, roomName],
        queryFn: () => {
            if (!user?.id || !roomName) {
                return null;
            }
            return api.callsGetToken({
                roomName,
                userId: user.id
            });
        },
        enabled: !!user?.id && !!roomName, // ✅ Запрос только если есть roomName
    });

    return { token: data?.token, isLoading, error };
}
