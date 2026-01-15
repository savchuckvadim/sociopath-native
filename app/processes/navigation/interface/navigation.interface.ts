

import { ComponentType } from "react";

export type TypeRootStackParamList = {
    Auth: undefined;
    Home: undefined;
    Profile: undefined;
    Settings: undefined;
    Notifications: undefined;
    Messages: undefined;
    Product: {
        slug: string;
    };
}
export interface IRoute {
    name: keyof TypeRootStackParamList;
    component: ComponentType;
}
