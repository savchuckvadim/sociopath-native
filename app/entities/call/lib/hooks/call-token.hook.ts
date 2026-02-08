import { getCalls } from "@/api/generated/calls/calls";
import { useAuth } from "@/processes";
import { useQuery } from "@tanstack/react-query";


export const useCallToken = (roomName: string) => {
    const { user } = useAuth();
    const api = getCalls()
    const { data, isPending: isLoading, error } = useQuery({
        queryKey: ['livekit-token', user?.id, roomName],
        queryFn: () => user?.id
            ? api.callsGetToken({
                roomName,
                userId: user?.id
            })
            : null,
    })

    return { token: data?.token, isLoading, error };
}
