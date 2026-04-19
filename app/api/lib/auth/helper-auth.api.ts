import AsyncStorage from "@react-native-async-storage/async-storage";
import { EnumAuthType, IAuthResponse } from "./auth.type";
import axios from "axios";
import { API_URL } from "@/config/api.config";
import { getRefreshToken, saveTokensToStorage } from "./helper-storage.api";


export const getNewTokens = async () => {
    try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
            console.log('🔄 getNewTokens: No refresh token found');
            throw new Error('No refresh token');
        }

        console.log('🔄 getNewTokens: Requesting new tokens...');
        console.log('🔄 getNewTokens: Refresh token exists:', !!refreshToken);

        // Используем мобильный endpoint /auth-mobile/refresh
        // Токен отправляется в body, а не в куках
        const response = await axios.post<{ tokens: { accessToken: string; refreshToken: string }; user: any }>(
            API_URL + '/auth-mobile/refresh',
            { refreshToken }, // Токен в body для мобильного приложения
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('🔄 getNewTokens: Response received:', {
            hasTokens: !!response.data?.tokens,
            hasAccessToken: !!response.data?.tokens?.accessToken,
            hasRefreshToken: !!response.data?.tokens?.refreshToken,
            hasUser: !!response.data?.user,
        });

        // Мобильный endpoint возвращает токены в формате { tokens: { accessToken, refreshToken }, user }
        if (response.data?.tokens?.accessToken && response.data?.tokens?.refreshToken) {
            console.log('🔄 getNewTokens: Tokens received, saving...');
            // Сохраняем новые токены
            await saveTokensToStorage({
                accessToken: response.data.tokens.accessToken,
                refreshToken: response.data.tokens.refreshToken,
            });
            console.log('🔄 getNewTokens: Tokens saved successfully');
            return {
                accessToken: response.data.tokens.accessToken,
                refreshToken: response.data.tokens.refreshToken,
                user: response.data.user,
            };
        }

        throw new Error('Invalid response from refresh endpoint');
    } catch (error: any) {
        console.error('🔄 getNewTokens error:', error.message || error);
        console.error('🔄 getNewTokens error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText,
        });
        throw error;
    }
}
