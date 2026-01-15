import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios"
import { errorCatch } from "./error.util"
import Toast from "react-native-toast-message"
import { $api } from "../back-api"


export const request = async <T>(config: AxiosRequestConfig) => {
    const onSuccess = (response: AxiosResponse<T>) => response.data
    const onError = (error: AxiosError<T>) => {
        Toast.show({
            type: "error",
            text1: 'Ошибка',
            text2: errorCatch(error)
        })
        return Promise.reject(error)
    }
    return $api.request<T>(config).then(onSuccess).catch(onError);
}
