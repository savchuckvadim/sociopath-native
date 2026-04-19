/**
 * Константы ошибок аутентификации
 * Используются для проверки типов ошибок при работе с токенами
 */
export const AUTH_ERRORS = {
    /** Access token истек */
    ACCESS_TOKEN_EXPIRED: 'ACCESS_TOKEN_EXPIRED',
    /** Refresh token не найден (истек, удален или невалиден) */
    REFRESH_TOKEN_NOT_FOUND: 'Refresh token not found',
    /** Токен истек (общая ошибка) */
    TOKEN_EXPIRED: 'Token expired',
    /** Refresh token отсутствует в запросе */
    NO_REFRESH_TOKEN: 'No refresh token',

    INVALID_REFRESH_TOKEN: 'Invalid refresh token',
} as const;

/**
 * Тип для значений констант ошибок
 */
export type AuthErrorType = typeof AUTH_ERRORS[keyof typeof AUTH_ERRORS];

/**
 * Проверяет, является ли ошибка ошибкой токена (требует перелогина)
 */
export const isTokenError = (errorMessage: string): boolean => {
    return (
        errorMessage === AUTH_ERRORS.ACCESS_TOKEN_EXPIRED ||
        errorMessage === AUTH_ERRORS.REFRESH_TOKEN_NOT_FOUND ||
        errorMessage === AUTH_ERRORS.TOKEN_EXPIRED ||
        errorMessage === AUTH_ERRORS.NO_REFRESH_TOKEN ||
        errorMessage === AUTH_ERRORS.INVALID_REFRESH_TOKEN
    );
};
