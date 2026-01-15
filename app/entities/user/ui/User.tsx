'use client'
import { useUser } from "../lib/hook/user.hook";
import { UserCard } from "./UserCard";


export const User = ({ userId }: { userId: string }) => {
    const { user, isLoading, error } = useUser(userId);
    if (isLoading) {
        return <div>Loading...</div>
    }
    if (error) {
        return <div>Error: {error.message}</div>
    }
    return (
        <div>

            <UserCard user={user!} />
        </div>
    )
}
