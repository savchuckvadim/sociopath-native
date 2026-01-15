import { NavigationContainer, NavigationProp, useNavigationContainerRef } from "@react-navigation/native";
import { TypeRootStackParamList } from "../interface/navigation.interface";
import { PrivateNavigator } from "./components/PrivateNavigator";
import { BottomMenu } from "@/shared";
import { useAuth } from "@/processes/auth";
import { useEffect, useState } from "react";
import { useAuthCheck } from "@/processes/auth/lib/hooks/auth-check.hook";


export const Navigation = () => {
    const { user } = useAuth();
    const [currentRoute, setCurrentRoute] = useState<keyof TypeRootStackParamList | undefined>(undefined);
    const navRef = useNavigationContainerRef<NavigationProp<TypeRootStackParamList>>();

    useEffect(() => {
        setCurrentRoute(navRef.getCurrentRoute()?.name as keyof TypeRootStackParamList);


        const listener = navRef.addListener('state', () => {
            setCurrentRoute(navRef.getCurrentRoute()?.name as keyof TypeRootStackParamList);
        });
        return () => navRef.removeListener('state', listener);
    }, []);
    useAuthCheck(currentRoute);
    return (
        <>
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
        </>
    );
}
