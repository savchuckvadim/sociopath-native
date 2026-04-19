import { UserDto } from "@/api";
import { FC, useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { usePresence } from "@/entities/presence";

export interface IUserAvatarProps {
    user?: UserDto;
    size?: 'sm' | 'md' | 'lg';

}

export const UserAvatar: FC<IUserAvatarProps> = ({ user, size = 'md' }) => {
    const [isOnline, setIsOnline] = useState(false);
    const { presence, getIsUserOnline } = usePresence();

    useEffect(() => {
        setIsOnline(getIsUserOnline(user?.id || ''));
    }, [presence]);


    return <Avatar
        src={user?.avatarUrl || ''}
        name={user?.name || ''}
        size={size}
        isOnline={isOnline}

    />
}
