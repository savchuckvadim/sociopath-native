import { AxiosInstance } from 'axios';
import { getNewTokens } from "@/api/lib/auth/helper-auth.api";
import { errorCatch } from "@/api/lib/utils/error.util";
import { removeTokensFromStorage } from "@/api/lib/auth/helper-storage.api";
import { AUTH_ERRORS, isTokenError } from "@/api/lib/auth/auth-errors.const";

export const setupRefreshInterceptor = (api: AxiosInstance) => {
    api.interceptors.response.use((config) => {
        return config;
    }, async (error) => {
        const originalRequest = error.config;

        // Логируем детали ошибки для отладки
        console.log('setupRefreshInterceptor error:', {
            message: error.message,
            code: error.code,
            response: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
            } : 'No response (Network Error)',
            request: error.request ? {
                url: error.config?.url,
                method: error.config?.method,
            } : 'No request',
        });

        // Обрабатываем только 401 ошибки (не Network Error)
        if (error.response?.status === 401 && !originalRequest._isRetry) {
            originalRequest._isRetry = true;

            console.log('🔄 Refresh interceptor: Attempting to refresh token...');
            try {
                await getNewTokens();
                console.log('🔄 Refresh interceptor: Token refreshed, retrying request...');
                // Перезапрашиваем оригинальный запрос с новым токеном
                return api.request(originalRequest);
            } catch (refreshError: any) {
                const errorMessage = errorCatch(refreshError);
                console.error('🔄 Refresh interceptor: Failed to refresh token:', errorMessage);
                console.log('🔄 Refresh interceptor: Error details:', {
                    message: refreshError.message,
                    response: refreshError.response?.data,
                    errorMessage: errorMessage,
                    errorMessageType: typeof errorMessage,
                    errorMessageLength: errorMessage?.length,
                });

                // Проверяем различные варианты ошибок refresh token
                const responseMessage = refreshError.response?.data?.message || '';
                const isRefreshTokenError =
                    isTokenError(errorMessage) ||
                    isTokenError(refreshError.message) ||
                    isTokenError(responseMessage);

                console.log('🔄 Refresh interceptor: Token error check:', {
                    errorMessage,
                    refreshErrorMessage: refreshError.message,
                    responseMessage,
                    isRefreshTokenError,
                });

                if (isRefreshTokenError) {
                    console.log('🔄 Refresh interceptor: Refresh token invalid/expired, removing tokens...');
                    await removeTokensFromStorage();
                    console.log('🔄 Refresh interceptor: Tokens removed');
                    console.log('🔄 Refresh interceptor: NOTE - setUser(null) should be called elsewhere (e.g., in useAuthCheck)');
                    console.log('🔄 Refresh interceptor: Throwing error to prevent retry...');
                    // Не перезапрашиваем, если refresh token тоже истек
                    throw refreshError;
                }

                console.log('🔄 Refresh interceptor: Unknown error, throwing...');
                throw refreshError;
            }
        }

        // Для Network Error просто пробрасываем дальше
        throw error;
    });
};
