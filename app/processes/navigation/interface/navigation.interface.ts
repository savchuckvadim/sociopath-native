

import { ComponentType } from "react";

export type TypeRootStackParamList = {
    Auth: undefined;
    Home: undefined;
    Profile: undefined;
    Settings: undefined;
    Notifications: undefined;
    Messages: undefined;
    Chat: {
        chatId: string;
    };
    Call: {
        roomName: string;
        callType: 'audio' | 'video';
    };
    People: undefined;
    Me: undefined;
    UserProfile: {
        userId: string;
    };
    Product: {
        slug: string;
    };
}
export interface IRoute {
    name: keyof TypeRootStackParamList;
    component: ComponentType;
}
