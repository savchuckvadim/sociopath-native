export const errorCatch = (error: any): string => {
    return error.response?.data?.message || error.message || 'Неизвестная ошибка';
}
