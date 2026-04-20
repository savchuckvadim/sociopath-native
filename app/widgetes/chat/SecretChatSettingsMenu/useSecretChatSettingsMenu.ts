import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useChatById, useDeleteChat, useUpdateChat } from '@/entities/chats/lib/hooks/useChats';
import { TypeRootStackParamList } from '@/processes/navigation/interface/navigation.interface';
import { ChatDtoEncryptionMode } from '@/api';
import {
  disappearingMessageSecondsUpdate,
  isoScheduledDeletionAfterHours,
} from '@/entities/chats/lib/utils/secret-chat-settings.util';

export function useSecretChatSettingsMenu(chatId: string) {
  const { data: chat } = useChatById(chatId);
  const deleteChat = useDeleteChat();
  const updateChat = useUpdateChat();
  const navigation = useNavigation<NavigationProp<TypeRootStackParamList>>();
  const [open, setOpen] = useState(false);

  const shouldShow =
    chat !== undefined && chat.encryptionMode === ChatDtoEncryptionMode.SIGNAL;

  const confirmDeleteNow = useCallback(() => {
    Alert.alert('Удалить чат', 'Весь защищённый диалог будет удалён без восстановления.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteChat.mutateAsync(chatId);
            navigation.navigate('Messages');
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  }, [chatId, deleteChat, navigation]);

  const scheduleChatDeletionHours = useCallback(
    (hours: number) => {
      const when = isoScheduledDeletionAfterHours(hours);
      void updateChat.mutateAsync({ id: chatId, data: { scheduledDeletionAt: when } });
      setOpen(false);
    },
    [chatId, updateChat],
  );

  const clearScheduledDeletion = useCallback(() => {
    void updateChat.mutateAsync({ id: chatId, data: { scheduledDeletionAt: null } });
    setOpen(false);
  }, [chatId, updateChat]);

  const setDisappearing = useCallback(
    (seconds: number) => {
      void updateChat.mutateAsync({
        id: chatId,
        data: { disappearingMessageSeconds: disappearingMessageSecondsUpdate(seconds) },
      });
      setOpen(false);
    },
    [chatId, updateChat],
  );

  return {
    shouldShow,
    open,
    setOpen,
    confirmDeleteNow,
    scheduleChatDeletionHours,
    clearScheduledDeletion,
    setDisappearing,
  };
}
