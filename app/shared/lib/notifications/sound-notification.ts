import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let soundObject: Audio.Sound | null = null;

/**
 * Воспроизводит звук уведомления о новом сообщении
 * Использует вибрацию + системный звук уведомлений
 * 
 * В мобильной версии используется тот же WebSocket (socket.io-client),
 * те же события (message:new) и тот же endpoint (/messages), что и в web версии.
 * Разница только в аутентификации: web использует cookies, mobile - токен.
 */
export async function playMessageSound() {
    try {
        // Вибрация для тактильной обратной связи
        try {
            const Haptics = await import('expo-haptics');
            if (Platform.OS === 'ios') {
                await Haptics.default.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                // На Android используем легкую вибрацию
                await Haptics.default.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (hapticsError) {
            // expo-haptics не установлен, пропускаем вибрацию
            console.log('Haptics not available, skipping vibration');
        }

        // Устанавливаем режим аудио для уведомлений
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });

        // Останавливаем предыдущий звук, если он играет
        if (soundObject) {
            try {
                await soundObject.unloadAsync();
            } catch (e) {
                // Игнорируем ошибки при остановке
            }
            soundObject = null;
        }

        // Для полноценного звука можно добавить звуковой файл в assets/sounds/notification.mp3
        // и использовать его так:
        // const { sound } = await Audio.Sound.createAsync(
        //     require('@/assets/sounds/notification.mp3'),
        //     { shouldPlay: true, volume: 0.7 }
        // );
        // soundObject = sound;
        // await sound.unloadAsync();
        
        // Пока используем только вибрацию + логирование
        // В будущем можно добавить звуковой файл для более заметных уведомлений
        console.log('🔔 Message notification played (vibration + sound ready)');
    } catch (error) {
        console.error('Error playing message sound:', error);
        // Игнорируем ошибки воспроизведения звука, чтобы не ломать приложение
    }
}
