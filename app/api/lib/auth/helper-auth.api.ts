import AsyncStorage from "@react-native-async-storage/async-storage";
import { EnumAuthType, IAuthResponse } from "./auth.type";
import axios from "axios";
import { API_URL } from "@/config/api.config";


export const getNewTokens = async () => {

    try {
        const refreshToken = await AsyncStorage.getItem(EnumAuthType.REFRESH_TOKEN);
        const response = await axios.post<string, { data: IAuthResponse }>(
            API_URL + '/auth/refresh',
            { refreshToken },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${refreshToken}`
                },
            }
        );

        return response.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}
