import { useQuery } from "@tanstack/react-query";
import { UserService } from "../api/UserService";

export const useUser = (userId: string) => {
    const {data, isLoading, error} = useQuery({
        queryKey: ['user', userId],
        queryFn: () => UserService.getUser(userId),
    });


    const {data: users, isLoading: isLoadingUsers, error: errorUsers} = useQuery({
        queryKey: ['users'],
        queryFn: () => UserService.getAllUsers(),
    });

    return {user: data, isLoading, error, users, isLoadingUsers, errorUsers};
}
