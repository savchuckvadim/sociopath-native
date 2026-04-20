import { NavigationContainer, NavigationProp, useNavigationContainerRef } from "@react-navigation/native";
import { TypeRootStackParamList } from "../interface/navigation.interface";
import { PrivateNavigator } from "./components/PrivateNavigator";

import { useAuth } from "@/processes/auth/lib/hooks/auth.hook";
import { useEffect, useState } from "react";
import { useAuthCheck } from "@/processes/auth/lib/hooks/auth-check.hook";
import { useGlobalMessagesSocket } from "@/entities/chats/lib/hooks/useGlobalMessagesSocket";
import { usePresenceSocket } from "@/entities/presence";
import { CallWrapperWidget } from "@/widgetes/call/CallWrapper";
import { BottomMenu } from "@/widgetes/bottom-menu";
import { useNavigation } from "../lib/hooks/navigation.hook";



export const Navigation = () => {

    const { user, currentRoute, navRef } = useNavigation();
    // // Глобальный WebSocket слушатель для уведомлений о сообщениях
    useGlobalMessagesSocket();

    // // Глобальный WebSocket слушатель для presence (онлайн/оффлайн статус)
    usePresenceSocket();

    return (
        <CallWrapperWidget>
            <NavigationContainer ref={navRef}>
                <PrivateNavigator />

            </NavigationContainer>
            {
                user && currentRoute &&
                <BottomMenu
                    navigate={navRef.navigate}
                    currentPath={currentRoute}
                />
            }
        </CallWrapperWidget>
    );
}
