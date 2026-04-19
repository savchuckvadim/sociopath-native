import { AxiosInstance } from 'axios';
import { getAccessToken } from "@/api/lib/auth/helper-storage.api";
// import { authGlobalService } from "@/processes/auth/lib/services/auth-global.service";

// Mobile interceptor для автоматического добавления токена
// Важно: getAccessToken() асинхронная, поэтому используем async/await
export const setupTokenInterceptor = (api: AxiosInstance) => {
    api.interceptors.request.use(async (config) => {
        // Отменяем запросы, если идет процесс logout
        // if (authGlobalService.getIsLoggingOut()) {
        //     console.log('🚫 Token interceptor: Request cancelled - logout in progress');
        //     return Promise.reject(new Error('Request cancelled: logout in progress'));
        // }

        const token = await getAccessToken();
        console.log('setupTokenInterceptor token', token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('setupTokenInterceptor config', config.headers);
        return config;
    });
};
