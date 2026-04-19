import { CreateUserDto } from "@/api";
import { clearStorage, removeTokensFromStorage, saveToStorage } from "@/api/lib/auth/helper-storage.api";
import { getAuth } from "@/api/generated/auth/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EnumAuthType } from "@/api/lib/auth/auth.type";
import axios from "axios";
import { API_URL } from "@/config/api.config";


export class AuthService {
    api = getAuth();
    constructor() { }

    async login(email: string, password: string) {
        console.log('email', email);
        console.log('password', password);
        const response = await this.api.authMobileLogin({ email, password });
        console.log('authLogin response', response);
        await saveToStorage({
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            user: response.user,
        });
        return response.user;
    }

    async registration(user: CreateUserDto) {
        const response = await this.api.authRegistration(user);
        await saveToStorage({
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            user: response.user,
        });
        return response.user;
    }

    async activate(link: string) {
        const response = await this.api.authActivate(link);
        return response;
    }

    async logout() {
        await this.api.authLogout();
        await clearStorage();
        return true;
    }
    // async logout() {
    //     try {
    //         // Для мобильного приложения используем /auth-mobile/logout с refreshToken в body
    //         const refreshToken = await AsyncStorage.getItem(EnumAuthType.REFRESH_TOKEN);

    //         if (refreshToken) {
    //             await axios.post(
    //                 API_URL + '/auth-mobile/logout',
    //                 { refreshToken },
    //                 {
    //                     headers: {
    //                         'Content-Type': 'application/json',
    //                     },
    //                 }
    //             );
    //         }
    //     } catch (error) {
    //         console.error('Logout error:', error);
    //         // Продолжаем очистку локального хранилища даже если запрос на сервер не удался
    //     }
    //     await clearStorage();
    //     return true;
    // }
    async refreshToken() {
        return await this.api.authRefreshToken();
    }
}
