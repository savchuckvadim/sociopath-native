import { LogOut } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useAuthLogout } from "../../lib/hooks/auth-logout.hook";
import { useCallback } from "react";
import clsx from "clsx";

export const Logout = () => {
    const { logout, isLogoutLoading: isLoading } = useAuthLogout();
    const handleLogout = useCallback(() => {
        logout();
    }, [logout]);

    return (
        <Pressable
            onPress={handleLogout}
            disabled={isLoading}
            className={clsx(
                'self-center',
                'rounded-lg',
                'w-full',
                'py-3',
                'flex-row',
                'items-center',
                'justify-center',
                isLoading ? 'bg-gray-400' : 'bg-[#F44848]'
            )}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color="white" />
            ) : (
                <LogOut size={16} color="white" />
            )}
            <Text className={clsx("text-white font-medium", 'ml-2')}>
                Выйти
            </Text>
        </Pressable>
    );
};
