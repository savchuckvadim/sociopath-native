import { useAuth } from "@/processes/auth/lib/hooks/auth.hook";
import { useEffect, useState } from "react";
import { TypeRootStackParamList } from "../../interface/navigation.interface";
import { NavigationProp, useNavigationContainerRef } from "@react-navigation/native";
import { useAuthCheck } from "@/processes/auth";

export const useNavigation = () => {
    const { user } = useAuth();
    const [currentRoute, setCurrentRoute] = useState<keyof TypeRootStackParamList | undefined>(undefined);
    const navRef = useNavigationContainerRef<NavigationProp<TypeRootStackParamList>>();

    const normalizeRouteForBottomMenu = (
        routeName: keyof TypeRootStackParamList | undefined,
    ): keyof TypeRootStackParamList | undefined => {
        // Keep "Messages" tab highlighted while user is inside a concrete chat.
        if (routeName === 'Chat') return 'Messages';
        return routeName;
    };

    useEffect(() => {
        setCurrentRoute(
            normalizeRouteForBottomMenu(
                navRef.getCurrentRoute()?.name as keyof TypeRootStackParamList,
            ),
        );


        const listener = navRef.addListener('state', () => {
            setCurrentRoute(
                normalizeRouteForBottomMenu(
                    navRef.getCurrentRoute()?.name as keyof TypeRootStackParamList,
                ),
            );
        });
        return () => navRef.removeListener('state', listener);
    }, [navRef]);
    useAuthCheck(currentRoute, navRef);



    return {
        user,
        currentRoute,
        navRef,
    }
}
