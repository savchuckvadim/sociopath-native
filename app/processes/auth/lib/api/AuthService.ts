import { CreateUserDto } from "@/api";
import { clearStorage, removeTokensFromStorage, saveToStorage } from "@/api/lib/auth/helper-storage.api";
import { getAuth } from "@/api/generated/auth/auth";


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

    async refreshToken() {
        return await this.api.authRefreshToken();
    }
}
