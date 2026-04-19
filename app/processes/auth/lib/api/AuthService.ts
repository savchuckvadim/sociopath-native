import { CreateUserDto, RefreshTokenDto } from "@/api";
import { clearStorage, getRefreshToken, saveToStorage } from "@/api/lib/auth/helper-storage.api";
import { getAuthMobile } from "@/api/generated/auth-mobile/auth-mobile";



export class AuthService {
    api = getAuthMobile();

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
        const response = await this.api.authMobileRegistration(user);
        await saveToStorage({
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            user: response.user,
        });
        return response.user;
    }

    async activate(link: string) {
        const response = await this.api.authMobileActivate(link);
        return response;
    }

    async logout() {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
            throw new Error('Refresh token not found');
        }
        await this.api.authMobileLogout({ refreshToken: refreshToken } as RefreshTokenDto);
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
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
            throw new Error('Refresh token not found');
        }
        return await this.api.authMobileRefreshToken({ refreshToken } as RefreshTokenDto);
    }
}
