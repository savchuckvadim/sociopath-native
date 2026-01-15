import { EResultCode } from "@workspace/nest-api";

export const getApiErrorMessage = (error: any) => {
    if (error.response?.data?.resultCode === EResultCode.ERROR) {
        return error.response?.data?.errors ? Array.isArray(error.response?.data?.errors) ? error.response?.data?.errors.join(', ') : error.response?.data?.errors : error.response?.data?.message || 'Неизвестная ошибка';
    }
    return error.message || 'Неизвестная ошибка';
}
