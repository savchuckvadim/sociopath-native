import { useAuth } from "@/processes/auth/lib/hooks/auth.hook";
import { useEffect } from "react";
import { AuthService } from "../api/AuthService";
import { getAccessToken, getRefreshToken } from "@/api/lib/auth/helper-storage.api";
import { errorCatch } from "@/api/lib/utils/error.util";
import { getNewTokens } from "@/api/lib/auth/helper-auth.api";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { EnumAuthType } from "@/api/lib/auth/auth.type";
import { isTokenError } from "@/api/lib/auth/auth-errors.const";
import { NavigationProp, CommonActions, NavigationContainerRef } from "@react-navigation/native";
import { TypeRootStackParamList } from "@/processes/navigation/interface/navigation.interface";

export const useAuthCheck = (
    roteName?: string,
    navigationRef?: NavigationContainerRef<NavigationProp<TypeRootStackParamList>>
) => {
    const { user, setUser } = useAuth();


    const checkAuth = async () => {
        console.log('🔍 useAuthCheck: checkAuth called');
        const accessToken = await getAccessToken();
        const authService = new AuthService();
        if (!accessToken) {
            console.log('🔍 useAuthCheck: No access token, skipping');
            return;
        }
        try {
            console.log('🔍 useAuthCheck: Attempting to refresh tokens...');
            await getNewTokens();
            console.log('🔍 useAuthCheck: Tokens refreshed successfully');
        } catch (error) {
            const errorMessage = errorCatch(error);
            console.log('🔍 useAuthCheck: Error refreshing tokens:', errorMessage);
            console.log('🔍 useAuthCheck: Error details:', {
                message: (error as any)?.message,
                response: (error as any)?.response?.data,
            });
            // Обрабатываем различные варианты ошибок токенов
            const isTokenErrorResult =
                isTokenError(errorMessage) ||
                isTokenError((error as any)?.response?.data?.message || '');

            if (isTokenErrorResult) {
                console.log('🔍 useAuthCheck: Token error detected, calling logout and setUser(null)...');
                await authService.logout();
                setUser(null);
                console.log('🔍 useAuthCheck: Logout completed, user cleared');
            } else {
                console.log('🔍 useAuthCheck: Error is not a token error, not logging out');
            }
        }
    }
    const checkRefreshToken = async () => {
        console.log('🔍 useAuthCheck: checkRefreshToken called, routeName:', roteName);
        // const refreshToken = await AsyncStorage.getItem(EnumAuthType.REFRESH_TOKEN);
        const refreshToken = await getRefreshToken();
        console.log('🔍 useAuthCheck: Refresh token exists:', !!refreshToken, 'User exists:', !!user);

        if (!refreshToken && user) {
            console.log('🔍 useAuthCheck: No refresh token but user exists, calling logout...');
            const authService = new AuthService();
            await authService.logout();
            setUser(null);
            console.log('🔍 useAuthCheck: Logout completed, user cleared');
            return;
        } else if (!refreshToken && !user) {
            // Редирект на экран Auth, если нет токена и пользователя
            if (navigationRef?.isReady()) {
                console.log('🔍 useAuthCheck: No refresh token and user not exists, redirecting to Auth...');
                navigationRef.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'Auth' }],
                    })
                );
            } else {
                console.log('🔍 useAuthCheck: No refresh token and user not exists, navigation ref not ready');
            }
            return;
        } else {
            console.log('🔍 useAuthCheck: Refresh token and user exists, not logging out');
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
