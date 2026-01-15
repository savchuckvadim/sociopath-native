import { getNewTokens } from "@/api/lib/auth/helper-auth.api";
import { $api } from "../back-api";
import { errorCatch } from "@/api/lib/utils/error.util";
import { removeTokensFromStorage } from "@/api/lib/auth/helper-storage.api";

$api.interceptors.response.use((config) => {
    return config;
}, async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._isRetry) {
        originalRequest._isRetry = true;


        try {
            await getNewTokens();
            return $api.request(originalRequest);
        } catch (error) {
            console.log(errorCatch(error));
            if (errorCatch(error) === 'Token expired') {
                await removeTokensFromStorage();
                return $api.request(originalRequest);
            }
            throw error;
        }
    }
    throw error;
});
