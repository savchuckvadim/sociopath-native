import { createContext, FC, PropsWithChildren, useEffect, useState } from "react"
import { IAuthContext, TypeUserState } from "../interface/auth-provider.interface";
import * as SplashScreen from 'expo-splash-screen';
import { getAccessToken, getUserFromStorage } from "@/api/lib/auth/helper-storage.api";
import { hydrateMessengerDeviceMeta } from "@/entities/encryption/lib/messenger-device-meta";
import { hydrateSentPlaintextCache } from "@/entities/encryption/lib/signal-sent-plaintext-cache";
import { hydrateIncomingPlaintextCache } from "@/entities/encryption/lib/signal-incoming-plaintext-cache";
// import { authGlobalService } from "../lib/services/auth-global.service";

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

            // Регистрируем setUser в глобальном сервисе для доступа из interceptors
            // authGlobalService.registerSetUser(setUser);

            const checkAccessToken = async () => {
                try {
                    const accessToken = await getAccessToken();
                    if (accessToken) {
                        const user = await getUserFromStorage();
                        if (isMonted) {
                            setUser(user);
                            await hydrateMessengerDeviceMeta()
                            await hydrateSentPlaintextCache()
                            await hydrateIncomingPlaintextCache()
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
                // Удаляем регистрацию при размонтировании
                // authGlobalService.unregisterSetUser();
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
