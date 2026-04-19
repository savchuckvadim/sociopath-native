/**
 * Глобальный сервис аутентификации
 * Позволяет interceptors и другим низкоуровневым модулям
 * вызывать logout и обновление состояния пользователя
 * без прямого доступа к React контексту
 *
 * Архитектурно правильное решение для FSD:
 * - processes/auth - бизнес-логика аутентификации
 * - api/lib/interceptors - низкоуровневая обработка HTTP
 * Этот сервис связывает их без нарушения слоев
 */

import { TypeUserState } from "../../interface/auth-provider.interface";
import { AuthService } from "../api/AuthService";

type SetUserCallback = (user: TypeUserState) => void;

class AuthGlobalService {
    private setUserCallback: SetUserCallback | null = null;
    private isLoggingOut = false; // Флаг для предотвращения множественных вызовов

    /**
     * Регистрирует callback для обновления состояния пользователя
     * Вызывается из AuthProvider при инициализации
     */
    registerSetUser(callback: SetUserCallback) {
        this.setUserCallback = callback;
        console.log('🔐 AuthGlobalService: setUser callback registered');
    }

    /**
     * Удаляет callback (при размонтировании)
     */
    unregisterSetUser() {
        this.setUserCallback = null;
        console.log('🔐 AuthGlobalService: setUser callback unregistered');
    }

    /**
     * Принудительный logout при ошибке аутентификации
     * Вызывается из interceptors при ошибке refresh token
     */
    async forceLogout(reason?: string) {
        // Предотвращаем множественные вызовы
        if (this.isLoggingOut) {
            console.log('🔐 AuthGlobalService: Logout already in progress, skipping...');
            return;
        }

        this.isLoggingOut = true;
        console.log('🔐 AuthGlobalService: Force logout called', reason ? `(reason: ${reason})` : '');

        try {
            // Очищаем хранилище (токены уже удалены в refresh.interceptor)
            const authService = new AuthService();
            try {
                await authService.logout();
            } catch (error) {
                // Игнорируем ошибки logout на сервере, если токены уже невалидны
                console.log('🔐 AuthGlobalService: Logout API call failed (expected if tokens invalid):', error);
            }

            // Обновляем состояние пользователя через callback
            if (this.setUserCallback) {
                this.setUserCallback(null);
                console.log('🔐 AuthGlobalService: User state cleared, redirect to login will happen automatically');
            } else {
                console.warn('🔐 AuthGlobalService: setUser callback not registered! User state will not be cleared.');
            }
        } catch (error) {
            console.error('🔐 AuthGlobalService: Error during force logout:', error);
        } finally {
            // Сбрасываем флаг через небольшую задержку, чтобы дать время на редирект
            setTimeout(() => {
                this.isLoggingOut = false;
            }, 1000);
        }
    }

    /**
     * Проверяет, идет ли процесс logout
     */
    getIsLoggingOut(): boolean {
        return this.isLoggingOut;
    }
}

// Экспортируем singleton
export const authGlobalService = new AuthGlobalService();
