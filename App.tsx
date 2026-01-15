// import { ScreenContent } from 'components/ScreenContent';
// import { StatusBar } from 'expo-status-bar';

// import './global.css';

// export default function App() {
//   return (
//     <>
//       <ScreenContent title="Home" path="App.tsx"></ScreenContent>
//       <StatusBar style="auto" />
//     </>
//   );
// }
import { Navigation } from '@/processes/navigation/ui/Navigation';
import { StatusBar } from 'expo-status-bar';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import { AuthProvider } from '@/processes/auth/providers/AuthProvider';
// import Camera from '@/components/camera/Camera';
import { Text, View } from 'react-native';
import { Toast } from '@/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

        <AuthProvider>
            <SafeAreaProvider>

                {/* <Camera/> */}
                <Navigation />
                {/* <View className='bg-red-500 h-screen w-screen '>
                    <View className='w-9/12 h-9/12 bg-blue-500 m-10  '>
                        <Text className='text-white text-2xl font-bold'>Hello</Text>
                    </View>
                </View> */}

            </SafeAreaProvider>
        </AuthProvider>
        <StatusBar style="dark" />
        <Toast />
    </QueryClientProvider>;

}
