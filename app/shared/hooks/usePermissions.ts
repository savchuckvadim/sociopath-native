import { useState, useEffect } from 'react';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export function usePermissions() {
    const [cameraPermission, setCameraPermission] = useState<PermissionStatus | null>(null);
    const [mediaLibraryPermission, setMediaLibraryPermission] = useState<PermissionStatus | null>(null);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            const [camera, media] = await Promise.all([
                Camera.getCameraPermissionsAsync(),
                ImagePicker.getMediaLibraryPermissionsAsync(),
            ]);

            setCameraPermission(camera.status as PermissionStatus);
            setMediaLibraryPermission(media.status as PermissionStatus);
        } catch (error) {
            console.error('Error checking permissions:', error);
        }
    };

    const requestCamera = async (): Promise<boolean> => {
        try {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setCameraPermission(status as PermissionStatus);

            if (status !== 'granted') {
                Alert.alert(
                    'Разрешение отклонено',
                    'Для использования камеры необходимо разрешение. Открыть настройки?',
                    [
                        { text: 'Отмена', style: 'cancel' },
                        {
                            text: 'Настройки',
                            onPress: () => Linking.openSettings()
                        }
                    ]
                );
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            return false;
        }
    };

    const requestMediaLibrary = async (): Promise<boolean> => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            setMediaLibraryPermission(status as PermissionStatus);

            if (status !== 'granted') {
                Alert.alert(
                    'Разрешение отклонено',
                    'Для выбора фото/видео необходимо разрешение. Открыть настройки?',
                    [
                        { text: 'Отмена', style: 'cancel' },
                        {
                            text: 'Настройки',
                            onPress: () => Linking.openSettings()
                        }
                    ]
                );
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error requesting media library permission:', error);
            return false;
        }
    };

    return {
        cameraPermission,
        mediaLibraryPermission,
        requestCamera,
        requestMediaLibrary,
        checkPermissions,
    };
}
