import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { IRoute, TypeRootStackParamList } from "../../interface/navigation.interface";
import { routes } from "../routes";
import { useAuth } from "@/processes/auth/lib/hooks/auth.hook";
import Auth from "@/screens/auth/Auth";


const Stack = createNativeStackNavigator<TypeRootStackParamList>();
export const PrivateNavigator = () => {
    const { user } = useAuth();
    console.log('🔐 PrivateNavigator - user:', user);
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: 'white',
                },
            }}
        >
            {user ? routes.map((route: IRoute) => (<Stack.Screen
                key={route.name}
                {...route}
            />
            )) : <Stack.Screen name="Auth" component={Auth} />}

        </Stack.Navigator>
    )
}
