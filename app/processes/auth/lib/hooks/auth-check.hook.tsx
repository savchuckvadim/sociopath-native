import { useAuth } from "@/processes";
import { useEffect } from "react";
import { AuthService } from "../api/AuthService";
import { getAccessToken } from "@/api/lib/auth/helper-storage.api";
import { errorCatch } from "@/api/lib/utils/error.util";
import { getNewTokens } from "@/api/lib/auth/helper-auth.api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EnumAuthType } from "@/api/lib/auth/auth.type";

export const useAuthCheck = (roteName?: string) => {
    const { user, setUser } = useAuth();


    const checkAuth = async () => {
        const accessToken = await getAccessToken();
        const authService = new AuthService();
        if (!accessToken) {
            return;
        }
        try {

            await getNewTokens();

        } catch (error) {
            if (errorCatch(error) === 'Token expired') {
                await authService.logout();
                setUser(null);

            }

        }
    }
    const checkRefreshToken = async () => {
        const refreshToken = await AsyncStorage.getItem(EnumAuthType.REFRESH_TOKEN);

        if (!refreshToken && user) {
            const authService = new AuthService();
            await authService.logout();
            setUser(null);
            return;
        }

    }
    useEffect(() => {
        checkAuth();
    }, []);
    useEffect(() => {
        checkRefreshToken();
    }, [roteName]);


}
