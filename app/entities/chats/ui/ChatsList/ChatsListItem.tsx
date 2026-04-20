import { View, Text, TouchableOpacity } from 'react-native';
import { ChatMemberDto } from '../../lib/types/chats.types';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { ChatDto, UserDto, ChatDtoEncryptionMode, ChatDtoType } from '@/api';
import { TypeRootStackParamList } from '@/processes/navigation/interface/navigation.interface';
import { UserAvatar } from '@/shared';
import { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { findPrivateChatWithPeer } from '../../lib/utils/find-private-chat-with-peer';

interface ChatsListItemProps {
  chat: ChatDto;
  currentUserId: string;
  allChats?: ChatDto[];
}

export const ChatsListItem = ({ chat, currentUserId, allChats }: ChatsListItemProps) => {
  const [otherMember, setOtherMember] = useState<UserDto | undefined>(undefined);
  const navigation = useNavigation<NavigationProp<TypeRootStackParamList>>();

  const handleChatSelect = (chatId: string) => {
    navigation.navigate('Chat', { chatId });
  };

  const otherMembers = chat.members?.filter((m: ChatMemberDto) => m.userId !== currentUserId) || [];
  useEffect(() => {
    if (otherMembers.length > 0) {
      setOtherMember(otherMembers[0]?.user);
    }
  }, [otherMembers]);

  const chatName =
    chat.type === ChatDtoType.PRIVATE
      ? otherMembers[0]?.user?.name || 'Пользователь'
      : chat.name || 'Групповой чат';

  const peerId = otherMembers[0]?.userId;
  const hasParallelSignal =
    chat.encryptionMode === ChatDtoEncryptionMode.NONE &&
    peerId &&
    allChats &&
    findPrivateChatWithPeer(allChats, currentUserId, peerId, ChatDtoEncryptionMode.SIGNAL);

  const hasParallelPlain =
    chat.encryptionMode === ChatDtoEncryptionMode.SIGNAL &&
    peerId &&
    allChats &&
    findPrivateChatWithPeer(allChats, currentUserId, peerId, ChatDtoEncryptionMode.NONE);

  const last = chat.lastMessage;
  let lastMessageContent: string | null = null;
  if (last?.isEncrypted) {
    lastMessageContent = 'Защищённое сообщение';
  } else if (last?.content) {
    lastMessageContent = String(last.content);
  }

  const unread = chat.unreadCount || 0;

  return (
    <TouchableOpacity
      onPress={() => handleChatSelect(chat.id)}
      className="bg-white flex-row items-center gap-3 p-4 rounded-xl mb-2"
    >
      <View className="relative">
        <UserAvatar user={otherMember} size="sm" />
      </View>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1">
          <Text className="font-medium text-sm flex-shrink" numberOfLines={1}>
            {chatName}
          </Text>
          {chat.encryptionMode === ChatDtoEncryptionMode.SIGNAL ? (
            <Feather name="lock" size={14} color="#2563eb" />
          ) : null}
        </View>
        {(hasParallelSignal || hasParallelPlain) && (
          <Text className="text-[10px] text-gray-400 mt-0.5">Есть второй канал с этим контактом</Text>
        )}
        {lastMessageContent && (
          <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
            {lastMessageContent}
          </Text>
        )}
      </View>
      {unread > 0 && (
        <View className="min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 items-center justify-center">
          <Text className="text-white text-xs font-bold">{unread > 99 ? '99+' : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
