import { createContext, FC, PropsWithChildren, useEffect, useState } from "react"
import { IAuthContext, TypeUserState } from "../interface/auth-provider.interface";
import * as SplashScreen from 'expo-splash-screen';
import { IUser } from "@/entities/user";
import { getAccessToken, getUserFromStorage } from "@/api/lib/auth/helper-storage.api";

// Set the animation options. This is optional.
// SplashScreen.setOptions({
//   duration: 1000,
//   fade: true,
// });

let ignore = SplashScreen.preventAutoHideAsync();

export const AuthContext = createContext<IAuthContext>({} as IAuthContext);
export const AuthProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {

    const [user, setUser] = useState<TypeUserState>(null);

    useEffect(
        () => {
            let isMonted = true;
            const checkAccessToken = async () => {
                try {
                    const accessToken = await getAccessToken();
                    if (accessToken) {
                        const user = await getUserFromStorage();
                        if (isMonted) {
                            setUser(user);
                        }
                    }
                } catch {

                } finally {
                    await SplashScreen.hideAsync();
                }
            }
            let ignore = checkAccessToken();

            return () => {
                isMonted = false;
            }
        },
        []
    )
    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}
