import { customAxios } from '@/api/lib/back-api';
import { DeviceEventEmitter, Platform } from 'react-native';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

type PushProvider = 'FCM' | 'APNS' | 'APNS_VOIP';
type PushPlatform = 'IOS' | 'ANDROID' | 'WEB';

/**
 * Запрос разрешения на уведомления (iOS: системный диалог + появление приложения в «Настройки → Уведомления»).
 * На Android для FCM это no-op с успешным статусом.
 * Вызывайте при старте приложения, не только после логина.
 */
export const requestMessagingPermission = async (): Promise<FirebaseMessagingTypes.AuthorizationStatus> => {
    const messaging = (await import('@react-native-firebase/messaging')).default;
    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL ||
        authStatus === messaging.AuthorizationStatus.EPHEMERAL;
    if (__DEV__) {
        console.log('[push] requestPermission status:', authStatus, 'enabled:', enabled);
    }
    return authStatus;
};

type IncomingCallPushPayload = {
    type?: string;
    callId?: string;
    chatId?: string;
    fromUserId?: string;
    from?: string;
    callType?: 'VIDEO' | 'AUDIO';
};

const CALLKEEP_SETUP_OPTIONS = {
    ios: { appName: 'sociopath' },
    android: {
        alertTitle: 'Permissions required',
        alertDescription: 'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'ok',
        additionalPermissions: [],
        foregroundService: {
            channelId: 'com.sociopath.app.call',
            channelName: 'Incoming Calls',
            notificationTitle: 'Sociopath call in progress',
        },
    },
};

const registerDeviceToken = async (
    token: string,
    provider: PushProvider,
    platform: PushPlatform,
) => {
    await customAxios({
        url: '/api/notifications/devices/register',
        method: 'POST',
        data: { token, provider, platform },
    });
};

const parseIncomingCallPayload = (
    payload: IncomingCallPushPayload,
): IncomingCallPushPayload | null => {
    if (payload.type !== 'incoming_call' || !payload.callId || !payload.chatId) {
        return null;
    }
    return payload;
};

const emitIncomingCallEvent = (payload: IncomingCallPushPayload) => {
    DeviceEventEmitter.emit('call:incoming:push', {
        from: payload.from || payload.fromUserId || 'push',
        fromUserId: payload.fromUserId || '',
        callId: payload.callId || '',
        chatId: payload.chatId || '',
        type: payload.callType || 'AUDIO',
    });
};

export const setupPushNotifications = async (userId: string) => {
    try {
        const messaging = (await import('@react-native-firebase/messaging')).default;
        const RNCallKeep = (await import('react-native-callkeep')).default;

        await RNCallKeep.setup(CALLKEEP_SETUP_OPTIONS);
        await messaging().requestPermission();

        const token = await messaging().getToken();
        const platform: PushPlatform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
        const provider: PushProvider = Platform.OS === 'ios' ? 'APNS' : 'FCM';
        if (token) {
            await registerDeviceToken(token, provider, platform);
        }

        messaging().onTokenRefresh(async nextToken => {
            await registerDeviceToken(nextToken, provider, platform);
        });

        messaging().onMessage(async remoteMessage => {
            const payload = parseIncomingCallPayload(
                (remoteMessage.data || {}) as IncomingCallPushPayload,
            );
            if (!payload) return;
            RNCallKeep.displayIncomingCall(
                payload.callId || `${Date.now()}`,
                payload.fromUserId || 'Unknown',
                'Incoming call',
            );
            emitIncomingCallEvent(payload);
        });

        messaging().setBackgroundMessageHandler(async remoteMessage => {
            const payload = parseIncomingCallPayload(
                (remoteMessage.data || {}) as IncomingCallPushPayload,
            );
            if (!payload) return;
            RNCallKeep.displayIncomingCall(
                payload.callId || `${Date.now()}`,
                payload.fromUserId || 'Unknown',
                'Incoming call',
            );
            emitIncomingCallEvent(payload);
        });

        void userId;
    } catch (_error) {
        // Native push stack is optional in dev builds.
    }
};
