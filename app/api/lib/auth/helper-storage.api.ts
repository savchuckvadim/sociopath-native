import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnumAsynStorage, EnumAuthType, IAuthResponse, ITokens } from './auth.type';
import { IUser } from '@/entities';
import { getItemAsync, setItemAsync, deleteItemAsync } from 'expo-secure-store';


export const getAccessToken = async (): Promise<string | null> => {
    return (await getItemAsync(EnumAuthType.ACCESS_TOKEN)) || null;
}

export const getRefreshToken = async (): Promise<string | null> => {
    return (await getItemAsync(EnumAuthType.REFRESH_TOKEN) )|| null;
}



export const saveTokensToStorage = async (tokens: ITokens) => {
    try {
        await setItemAsync(EnumAuthType.ACCESS_TOKEN, tokens.accessToken);
        await setItemAsync(EnumAuthType.REFRESH_TOKEN, tokens.refreshToken);
    } catch (error) {
        console.error('🗑️ saveTokensToStorage error:', error);
        return null;
    }
}


export const removeTokensFromStorage = async () => {
    try {
        console.log('🗑️ removeTokensFromStorage: Removing tokens from storage...');
        await deleteItemAsync(EnumAuthType.ACCESS_TOKEN);
        await deleteItemAsync(EnumAuthType.REFRESH_TOKEN);
        console.log('🗑️ removeTokensFromStorage: Tokens removed successfully');
    } catch (error) {
        console.error('🗑️ removeTokensFromStorage error:', error);
        return null;
    }
}



export const getUserFromStorage = async () => {
    try {
        const user = await AsyncStorage.getItem(EnumAsynStorage.USER);
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('🗑️ getUserFromStorage error:', error);
        return null;
    }
}

const setUserToStorage = async (user: IUser) => {

    await AsyncStorage.setItem(EnumAsynStorage.USER, JSON.stringify(user));

}
export const removeUserFromStorage = async () => {
    try {
        console.log('🗑️ removeUserFromStorage: Removing user from storage...');
        await AsyncStorage.removeItem(EnumAsynStorage.USER);
        console.log('🗑️ removeUserFromStorage: User removed successfully');
    } catch (error) {
        console.error('🗑️ removeUserFromStorage error:', error);
        return null;
    }
}

export const saveToStorage = async (data: IAuthResponse) => {
    await saveTokensToStorage(data);

    try {

        await setUserToStorage(data.user);
    } catch (error) {
        console.error('🗑️ saveToStorage error:', error);
        return null;
    }
}


export const clearStorage = async () => {
    await removeTokensFromStorage();
    await removeUserFromStorage();
}
