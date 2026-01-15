import axios, { Method } from 'axios';
import { getAccessToken } from './auth/helper-storage.api';
import { SERVER_URL } from '@/config/api.config';

console.log('back-api SERVER_URL', SERVER_URL);

const url = SERVER_URL || `http://localhost:3000`;
const AUTH_TOKEN_NAME = 'accessToken';

export interface IBackResponse<T> {
    resultCode: EResultCode; // 0 - успех, 1 - ошибка
    data?: T; // данные ответа (при успехе)
    message?: string; // сообщение ошибки (при ошибке)
    errors?: string[]; // ошибки (при ошибке)
}
export enum EResultCode {
    SUCCESS = 0,
    ERROR = 1,
}

const headers = {
    'content-type': 'application/json',
    'X-BACK-API-KEY': '',
};

export const $api = axios.create({
    baseURL: url,
    withCredentials: true,
    headers: headers,
});
// // // 🔐 автоматически добавляем JWT
// $api.interceptors.request.use((config) => {
//     const token = localStorage.getItem(AUTH_TOKEN_NAME);
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });
// $api.interceptors.response.use((response) => {
//     return response;
// }, async (error) => {
//     console.log(error.response.request.responseURL);
//     const isRefresh = error.response.request.responseURL.includes('auth/refresh');

//     if (error.response.status === 401 && error.config && !isRefresh) {

//         const originalRequest = error.config;

//         originalRequest._isRetry = true; // TODO: не работает как в видосе
//         try {
//             const res = await $api.post('/api/auth/refresh');
//             if (res.data.resultCode === EResultCode.SUCCESS) {

//                 return $api(originalRequest);
//             }

//         } catch (e) {
//             console.log('НЕ АВТОРИЗОВАН');
//         }

//     }
//     throw error;

// });



export const customAxios = async<T>({
    url,
    method,
    data,
    params,
    headers,
}: {
    url: string;
    method: Method;
    data?: any;
    params?: any;
    headers?: any;
}): Promise<T> => {
    // // Orval всегда ждёт, что mutator возвращает **данные**, а не { resultCode, data }
    console.log('customAxios SERVER_URL', SERVER_URL);
    const res = await $api.request<IBackResponse<T>>({
        url,
        method: method as Method,
        data,
        params, // 🔹 вот здесь axios сам превращает объект в query string
        headers,
    });
    console.log('customAxios res', res.data);
    if (res.data.resultCode !== EResultCode.SUCCESS) {
        throw new Error(res.data.message || `Backend error ${url}`);
    }

    return res.data.data as T;
};
