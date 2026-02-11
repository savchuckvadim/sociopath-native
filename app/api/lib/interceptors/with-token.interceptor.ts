import { AxiosInstance } from 'axios';
import { getAccessToken } from "@/api/lib/auth/helper-storage.api";

// Mobile interceptor для автоматического добавления токена
// Важно: getAccessToken() асинхронная, поэтому используем async/await
export const setupTokenInterceptor = (api: AxiosInstance) => {
    api.interceptors.request.use(async (config) => {
        const token = await getAccessToken();
        console.log('setupTokenInterceptor token', token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('setupTokenInterceptor config', config.headers);
        return config;
    });
};
