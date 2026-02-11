import AsyncStorage from "@react-native-async-storage/async-storage";
import { EnumAuthType, IAuthResponse } from "./auth.type";
import axios from "axios";
import { API_URL } from "@/config/api.config";
import { saveTokensToStorage } from "./helper-storage.api";


export const getNewTokens = async () => {
    try {
        const refreshToken = await AsyncStorage.getItem(EnumAuthType.REFRESH_TOKEN);

        if (!refreshToken) {
            console.log('🔄 getNewTokens: No refresh token found');
            throw new Error('No refresh token');
        }

        console.log('🔄 getNewTokens: Requesting new tokens...');
        console.log('🔄 getNewTokens: Refresh token exists:', !!refreshToken);
        const response = await axios.post<IAuthResponse>(
            API_URL + '/auth/refresh',
            { refreshToken },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${refreshToken}`
                },
            }
        );

        console.log('🔄 getNewTokens: Response received:', {
            hasAccessToken: !!response.data?.accessToken,
            hasRefreshToken: !!response.data?.refreshToken,
            hasUser: !!response.data?.user,
        });

        if (response.data?.accessToken && response.data?.refreshToken) {
            console.log('🔄 getNewTokens: Tokens received, saving...');
            // Сохраняем новые токены
            await saveTokensToStorage({
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
            });
            console.log('🔄 getNewTokens: Tokens saved successfully');
            return response.data;
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
