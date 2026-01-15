import { getAccessToken } from "@/api/lib/auth/helper-storage.api";
import { $api } from "../back-api";



//mobile interceptor
$api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
