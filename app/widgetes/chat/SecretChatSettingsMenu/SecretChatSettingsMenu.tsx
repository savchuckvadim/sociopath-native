import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSecretChatSettingsMenu } from './useSecretChatSettingsMenu';

interface SecretChatSettingsMenuProps {
  chatId: string;
}

export function SecretChatSettingsMenu({ chatId }: SecretChatSettingsMenuProps) {
  const {
    shouldShow,
    open,
    setOpen,
    confirmDeleteNow,
    scheduleChatDeletionHours,
    clearScheduledDeletion,
    setDisappearing,
  } = useSecretChatSettingsMenu(chatId);

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} className="p-2" accessibilityLabel="Настройки защищённого чата">
        <Feather name="more-vertical" size={22} color="#666" />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-white rounded-t-2xl p-4 max-h-[70%]">
            <Text className="text-lg font-semibold mb-3">Защищённый чат</Text>
            <ScrollView>
              <TouchableOpacity className="py-3 border-b border-gray-100" onPress={confirmDeleteNow}>
                <Text className="text-red-600">Удалить чат сейчас</Text>
              </TouchableOpacity>
              <Text className="text-xs text-gray-500 mt-3 mb-1">Автоудаление чата</Text>
              <TouchableOpacity className="py-2" onPress={() => scheduleChatDeletionHours(1)}>
                <Text>Через 1 час</Text>
              </TouchableOpacity>
              <TouchableOpacity className="py-2" onPress={() => scheduleChatDeletionHours(24)}>
                <Text>Через 24 часа</Text>
              </TouchableOpacity>
              <TouchableOpacity className="py-2 mb-2" onPress={clearScheduledDeletion}>
                <Text className="text-gray-600">Отключить таймер удаления чата</Text>
              </TouchableOpacity>
              <Text className="text-xs text-gray-500 mt-2 mb-1">Исчезающие сообщения</Text>
              <TouchableOpacity className="py-2" onPress={() => setDisappearing(60)}>
                <Text>Через 1 минуту</Text>
              </TouchableOpacity>
              <TouchableOpacity className="py-2" onPress={() => setDisappearing(300)}>
                <Text>Через 5 минут</Text>
              </TouchableOpacity>
              <TouchableOpacity className="py-2" onPress={() => setDisappearing(0)}>
                <Text>Выключить</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity className="mt-4 py-3 bg-gray-100 rounded-lg items-center" onPress={() => setOpen(false)}>
              <Text>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
