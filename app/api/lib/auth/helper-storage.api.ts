import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnumAsynStorage, EnumAuthType, IAuthResponse, ITokens } from './auth.type';
import { IUser } from '@/entities';



export const getAccessToken = async () => {
    return (await AsyncStorage.getItem(EnumAuthType.ACCESS_TOKEN)) || null;
}

// export const getRefreshToken = async () => {
//     return (await AsyncStorage.getItem(EnumAuthType.REFRESH_TOKEN) )|| null;
// }



export const saveTokensToStorage = async (tokens: ITokens) => {
    try {
        await AsyncStorage.setItem(EnumAuthType.ACCESS_TOKEN, tokens.accessToken);
        await AsyncStorage.setItem(EnumAuthType.REFRESH_TOKEN, tokens.refreshToken);
    } catch (error) {
        return null;
    }
}


export const removeTokensFromStorage = async () => {
    try {
        await AsyncStorage.removeItem(EnumAuthType.ACCESS_TOKEN);
        await AsyncStorage.removeItem(EnumAuthType.REFRESH_TOKEN);
    } catch (error) {
        return null;
    }
}



export const getUserFromStorage = async () => {
    try {
        const user = await AsyncStorage.getItem(EnumAsynStorage.USER);
        return user ? JSON.parse(user) : null;
    } catch (error) {
        return null;
    }
}

const setUserToStorage = async (user: IUser) => {

    await AsyncStorage.setItem(EnumAsynStorage.USER, JSON.stringify(user));

}
export const removeUserFromStorage = async () => {
    try {
        await AsyncStorage.removeItem(EnumAsynStorage.USER);
    } catch (error) {
        return null;
    }
}

export const saveToStorage = async (data: IAuthResponse) => {
    await saveTokensToStorage(data);

    try {

        await setUserToStorage(data.user);
    } catch (error) {
        return null;
    }
}


export const clearStorage = async () => {
    await removeTokensFromStorage();
    await removeUserFromStorage();
}
