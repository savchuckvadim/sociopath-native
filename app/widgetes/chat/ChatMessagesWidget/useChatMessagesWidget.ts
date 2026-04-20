import { useEffect, useMemo, useRef } from 'react';
import { ScrollView } from 'react-native';
import type { RefObject } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useChatMessages } from '@/entities/messages/lib/hooks/useMessages';
import type { Message } from '@/entities/messages/lib/types/messages.types';
import type { Chat } from '@/entities/chats/lib/types/chats.types';
import {
  findPeerMember,
  isSignalChatEncryption,
  resolveChatHeaderDisplayName,
} from '@/entities/chats/lib/utils/chat-messages-header.util';

interface UseChatMessagesWidgetArgs {
  chatId: string | null;
  currentUserId: string;
  selectedChat: Chat | undefined;
  messagesEndRef: RefObject<ScrollView | null>;
}

export function useChatMessagesWidget({
  chatId,
  currentUserId,
  selectedChat,
  messagesEndRef,
}: UseChatMessagesWidgetArgs) {
  const navigation = useNavigation();
  const { data: messages, isLoading: messagesLoading } = useChatMessages(chatId || '', 50, 0);
  const hasScrolledToBottomRef = useRef(false);

  const sortedMessages = useMemo(
    () => (messages ? (messages as unknown as Message[]) : []),
    [messages],
  );

  useEffect(() => {
    hasScrolledToBottomRef.current = false;
  }, [chatId]);

  useEffect(() => {
    if (
      !messagesLoading &&
      sortedMessages.length > 0 &&
      !hasScrolledToBottomRef.current &&
      messagesEndRef.current
    ) {
      hasScrolledToBottomRef.current = true;
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: false });
      }, 100);
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [messagesLoading, sortedMessages.length, chatId, messagesEndRef]);

  const peerMember = findPeerMember(selectedChat?.members, currentUserId);
  const chatName = resolveChatHeaderDisplayName(selectedChat, peerMember);
  const isSignal = isSignalChatEncryption(selectedChat);

  return {
    navigation,
    sortedMessages,
    messagesLoading,
    hasScrolledToBottomRef,
    chatName,
    isSignal,
  };
}
