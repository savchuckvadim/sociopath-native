import { AxiosInstance, AxiosError } from 'axios';
import Toast from 'react-native-toast-message';
import { errorCatch } from '../utils/error.util';

/**
 * Глобальный interceptor для показа Toast при ошибках
 * Работает после всех остальных интерцепторов (refresh, token и т.д.)
 */
export const setupErrorToastInterceptor = (api: AxiosInstance) => {
    api.interceptors.response.use(
        (response) => {
            // Успешный ответ - просто возвращаем
            return response;
        },
        async (error: AxiosError) => {
            // Пропускаем ошибки, которые уже обрабатываются специально
            // Например, ошибки refresh token обрабатываются в refresh.interceptor
            const isRefreshError = error.config?.url?.includes('/auth/refresh') ||
                error.config?.url?.includes('/auth-mobile/refresh');

            // Пропускаем ошибки, которые уже обработаны (например, в refresh interceptor)
            const isAlreadyHandled = (error.config as any)?._skipErrorToast;

            // Показываем Toast только для ошибок, которые не обрабатываются специально
            // И только для ошибок с response (не для Network Error)
            if (!isRefreshError && !isAlreadyHandled && error.response) {
                const errorMessage = errorCatch(error);

                // Показываем Toast для всех ошибок с response (кроме тех, что обрабатываются специально)
                Toast.show({
                    type: 'error',
                    text1: 'Ошибка',
                    text2: errorMessage,
                });
            }
            // Для Network Error (когда нет response) не показываем Toast,
            // так как это может быть просто проблема с интернетом

            // Пробрасываем ошибку дальше
            return Promise.reject(error);
        }
    );
};
