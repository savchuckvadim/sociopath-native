import '@/polyfills/installTextEncoding';

// eas build --platform ios
// eas submit --platform ios
import { Buffer } from 'buffer';
if (!(globalThis as { Buffer?: typeof Buffer }).Buffer) {
    (globalThis as { Buffer: typeof Buffer }).Buffer = Buffer;
}

import { Navigation } from '@/processes/navigation/ui/Navigation';
import { StatusBar } from 'expo-status-bar';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import './global.css';
import { AuthProvider } from '@/processes/auth/providers/AuthProvider';
import { GlobalCallProvider } from '@/entities/call';

import { Toast } from '@/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


// В самом верху твоего основного файла (App.tsx или index.ts)
import { registerGlobals } from '@livekit/react-native';
import { LogBox } from 'react-native';

registerGlobals();
// LiveKit иногда кидает ворнинги из-за таймеров WebRTC, их можно скрыть
LogBox.ignoreLogs(['Setting a timer']);


// Configure NativeWind to use class-based dark mode
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        }
    }
})
export default function App() {

    return <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
            <AuthProvider>
                <GlobalCallProvider>
                    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
                        <StatusBar style="dark" />
                        <Navigation />
                    </SafeAreaView>
                    <Toast />
                </GlobalCallProvider>
            </AuthProvider>
        </SafeAreaProvider>
    </QueryClientProvider>;

}
