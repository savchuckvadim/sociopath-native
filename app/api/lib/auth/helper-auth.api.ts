// import axios from "axios";
// import { API_URL } from "@/config/api.config";
import { getRefreshToken, saveTokensToStorage } from "./helper-storage.api";
import { getAuthMobile } from "@/api/generated/auth-mobile/auth-mobile";
import { RefreshTokenDto } from "@/api/generated/model";


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
        // const response = await axios.post<{ tokens: { accessToken: string; refreshToken: string }; user: any }>(
        //     API_URL + '/auth-mobile/refresh',
        //     { refreshToken }, // Токен в body для мобильного приложения
        //     {
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //     }
        // );

        const response = await getAuthMobile().authMobileRefreshToken({ refreshToken: refreshToken } as RefreshTokenDto);
        const hasTokens = !!response?.tokens;
        const accessToken = response?.tokens?.accessToken;
        const newRefreshToken = response?.tokens?.refreshToken;
        const hasUser = !!response?.user;
        console.log('🔄 getNewTokens: Response received:', {
            hasTokens,
            accessToken,
            newRefreshToken,
            hasUser,
        });

        // Мобильный endpoint возвращает токены в формате { tokens: { accessToken, refreshToken }, user }
        if (hasTokens && accessToken && newRefreshToken) {
            console.log('🔄 getNewTokens: Tokens received, saving...');
            // Сохраняем новые токены
            await saveTokensToStorage({
                accessToken: accessToken,
                refreshToken: newRefreshToken,
            });
            console.log('🔄 getNewTokens: Tokens saved successfully');
            return {
                accessToken: accessToken,
                refreshToken: newRefreshToken,
                user: response?.user,
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
