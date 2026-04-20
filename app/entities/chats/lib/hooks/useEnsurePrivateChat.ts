import { useCallback } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import {
  ChatDtoEncryptionMode,
  CreateChatDtoType,
  type CreateChatDto,
} from '@/api';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';
import { TypeRootStackParamList } from '@/processes/navigation/interface/navigation.interface';
import { useCreateChat, useUserChats } from './useChats';
import { findPrivateChatWithPeer, type PrivateChatLookup } from '../utils/find-private-chat-with-peer';

function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
    if (typeof res === 'string') return res;
    if (Array.isArray(res)) return res.join(', ');
  }
  if (error instanceof Error) return error.message;
  return 'Не удалось открыть чат';
}

export function useEnsurePrivateChat() {
  const navigation = useNavigation<NavigationProp<TypeRootStackParamList>>();
  const { user } = useAuth();
  const { data: chats } = useUserChats();
  const createChatMutation = useCreateChat();

  const navigateToPrivateChat = useCallback(
    async (peerUserId: string, encryptionMode: ChatDtoEncryptionMode): Promise<void> => {
      if (!user?.id) return;
      const list = chats as PrivateChatLookup[] | undefined;
      const existing = findPrivateChatWithPeer(list, user.id, peerUserId, encryptionMode);
      if (existing) {
        navigation.navigate('Chat', { chatId: existing.id });
        return;
      }
      const body: CreateChatDto = {
        type: CreateChatDtoType.PRIVATE,
        memberIds: [user.id, peerUserId],
        name: '',
        description: '',
        encryptionMode,
      };
      try {
        const chat = await createChatMutation.mutateAsync(body);
        navigation.navigate('Chat', { chatId: chat.id });
      } catch (error) {
        console.warn(getApiErrorMessage(error));
        throw error;
      }
    },
    [chats, createChatMutation, navigation, user?.id],
  );

  return {
    navigateToPrivateChat,
    isPending: createChatMutation.isPending,
  };
}
