import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateMessage } from '@/entities/messages/lib/hooks/useMessages';
import type { Message } from '@/entities/messages/lib/types/messages.types';
import { MessageType } from '@/entities/messages/lib/types/messages.types';
import { MAX_CHAT_MESSAGE_LENGTH } from '@/entities/messages/lib/const/message-limits';
import {
  loadOutboxMessagesForChat,
  removeFailedMessageFromOutbox,
  saveFailedMessageToOutbox,
} from '@/entities/messages/lib/utils/failed-message-outbox';
import { scrollToBottom } from '@/entities/messages/lib/utils/scroll-to-bottom.util';
import {
  encryptOutgoingForSignalChat,
  ensureLocalSignalDeviceRegistered,
} from '@/entities/encryption/lib/messenger-e2ee';
import { rememberSentPlaintext } from '@/entities/encryption/lib/signal-sent-plaintext-cache';
import type { Chat } from '../types/chats.types';
import type { IUser } from '@/entities/user';
import { ChatDtoEncryptionMode, ChatDtoType, type UserDto } from '@/api';
import { RefObject } from 'react';
import { ScrollView } from 'react-native';

interface UseSendMessageProps {
  chatId: string | null;
  currentUser: IUser | null;
  messagesEndRef: RefObject<ScrollView | null>;
  chat?: Chat | null;
}

const messagesQueryKey = (id: string) => ['messages', 'chat', id, 50, 0] as const;

export const useSendMessage = ({
  chatId,
  currentUser,
  messagesEndRef,
  chat,
}: UseSendMessageProps) => {
  const queryClient = useQueryClient();
  const createMessageMutation = useCreateMessage();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!chatId || !currentUser?.id) return;
    void (async () => {
      const restored = await loadOutboxMessagesForChat(chatId, {
        id: currentUser.id!,
        name: currentUser.name ?? '',
        email: currentUser.email ?? '',
      });
      if (restored.length === 0) return;
      queryClient.setQueryData(
        messagesQueryKey(chatId),
        (oldData: Message[] | undefined) => {
          const base = oldData ?? [];
          const ids = new Set(base.map((m) => m.id));
          const add = restored.filter((m) => !ids.has(m.id));
          if (add.length === 0) return base;
          return [...base, ...add];
        },
      );
    })();
  }, [chatId, currentUser?.id, currentUser?.name, currentUser?.email, queryClient]);

  const sendMessageBody = useCallback(
    async (content: string) => {
      if (!chatId || !content.trim() || !currentUser?.id) return;

      const messageText = content.trim();
      if (messageText.length > MAX_CHAT_MESSAGE_LENGTH) {
        return;
      }

      const encryptionMode = chat?.encryptionMode ?? ChatDtoEncryptionMode.NONE;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const tempMessage: Message = {
        id: tempId,
        chatId,
        senderId: currentUser.id,
        content: messageText,
        type: MessageType.TEXT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name || '',
          email: currentUser.email || '',
        } as UserDto,
        isEncrypted: false,
        _clientStatus: 'sending',
      };

      queryClient.setQueryData(
        messagesQueryKey(chatId),
        (oldData: Message[] | undefined) => {
          if (!oldData) return [tempMessage];
          return [...oldData, tempMessage];
        },
      );
      setTimeout(() => {
        scrollToBottom(messagesEndRef);
      }, 50);

      setIsSending(true);
      try {
        if (encryptionMode === ChatDtoEncryptionMode.SIGNAL) {
          if (chat?.type !== ChatDtoType.PRIVATE) {
            throw new Error('Групповые чаты с E2EE пока не поддерживаются (только 1:1 SIGNAL)');
          }
          const recipientUserId = chat.members?.find((m) => m.userId !== currentUser.id)?.userId;
          if (!recipientUserId) {
            throw new Error('Не найден получатель для E2EE');
          }
          const { serverDeviceId } = await ensureLocalSignalDeviceRegistered();
          const payloads = await encryptOutgoingForSignalChat(
            recipientUserId,
            messageText,
            serverDeviceId,
          );
          const sent: Message[] = [];
          for (const p of payloads) {
            const m = await createMessageMutation.mutateAsync({
              chatId,
              content: p.content,
              type: MessageType.TEXT,
              isEncrypted: true,
              toDeviceId: p.toDeviceId,
              senderDeviceId: p.senderDeviceId,
              signalMessageType: p.signalMessageType,
              registrationId: p.registrationId,
            });
            const row = m as Message;
            sent.push(row);
            if (row?.id) {
              rememberSentPlaintext(row.id, messageText);
            }
          }
          queryClient.setQueryData(
            messagesQueryKey(chatId),
            (oldData: Message[] | undefined) => {
              const base = (oldData ?? []).filter((msg: Message) => msg.id !== tempId);
              const next = [...base, ...sent];
              const seen = new Set<string>();
              return next.filter((m) => {
                if (seen.has(m.id)) return false;
                seen.add(m.id);
                return true;
              });
            },
          );
        } else {
          const sentMessage = await createMessageMutation.mutateAsync({
            chatId,
            content: messageText,
          });
          const messageData = sentMessage as Message;
          queryClient.setQueryData(
            messagesQueryKey(chatId),
            (oldData: Message[] | undefined) => {
              if (!oldData) {
                return [messageData];
              }
              const filtered = oldData.filter((msg: Message) => msg.id !== tempId);
              const exists = filtered.some((msg: Message) => msg.id === messageData.id);
              if (exists) return filtered;
              return [...filtered, messageData];
            },
          );
        }

        await removeFailedMessageFromOutbox(tempId);
        queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });

        setTimeout(() => {
          scrollToBottom(messagesEndRef);
        }, 100);
      } catch (error) {
        console.error('Failed to send message:', error);
        await saveFailedMessageToOutbox(tempId, chatId, messageText);
        queryClient.setQueryData(
          messagesQueryKey(chatId),
          (oldData: Message[] | undefined) => {
            if (!oldData) return [];
            return oldData.map((msg: Message) =>
              msg.id === tempId ? { ...msg, _clientStatus: 'failed' as const } : msg,
            );
          },
        );
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [chatId, chat, currentUser, createMessageMutation, messagesEndRef, queryClient],
  );

  const sendMessage = sendMessageBody;

  const retryFailedMessage = useCallback(
    (failedTempId: string) => {
      if (!chatId || !currentUser) return;
      const data = queryClient.getQueryData(messagesQueryKey(chatId)) as Message[] | undefined;
      const msg = data?.find((m) => m.id === failedTempId);
      if (!msg || msg._clientStatus !== 'failed') return;
      const text = msg.content;
      void removeFailedMessageFromOutbox(failedTempId);
      queryClient.setQueryData(
        messagesQueryKey(chatId),
        (oldData: Message[] | undefined) => (oldData ?? []).filter((m) => m.id !== failedTempId),
      );
      void sendMessage(text);
    },
    [chatId, currentUser, queryClient, sendMessage],
  );

  return {
    sendMessage,
    retryFailedMessage,
    isPending: isSending || createMessageMutation.isPending,
  };
};
