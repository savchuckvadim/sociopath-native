import { IUser } from "@/entities";

export enum EnumAuthType {
    ACCESS_TOKEN = 'accessToken',
    REFRESH_TOKEN = 'refreshToken',
}


export enum EnumAsynStorage{
    USER = 'user',
}


export interface ITokens {
    accessToken: string;
    refreshToken: string;
}

export interface IAuthResponse extends ITokens {
    user: IUser;

}
