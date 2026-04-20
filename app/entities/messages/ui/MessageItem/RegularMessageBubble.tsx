import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { UserAvatar } from '@/shared';
import { useUser } from '@/entities/user';
import { Check, CheckCheck, AlertCircle } from 'lucide-react-native';
import { useMessageBubbleDisplay } from './useMessageBubbleDisplay';
import type { MessageItemProps } from './message-item.types';

export function RegularMessageBubble({
  message,
  isOwn,
  showAvatar = true,
  onRetryFailed,
}: MessageItemProps) {
  const { user } = useUser(message.sender?.id || '');
  const { hidden, displayContent, readByPeer, pending, failed, showDeliveryTicks } =
    useMessageBubbleDisplay(message, isOwn);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (hidden) {
    return null;
  }

  return (
    <View className={`flex-row gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {showAvatar && !isOwn && <UserAvatar user={user} />}
      <View
        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${showAvatar && !isOwn ? 'max-w-[75%]' : 'max-w-[70%]'}`}
      >
        {!isOwn && showAvatar && (
          <Text className="text-xs font-medium mb-1 text-gray-500 px-1">
            {message.sender?.name || 'Пользователь'}
          </Text>
        )}
        <View
          className={`rounded-lg px-4 py-2 ${isOwn ? 'bg-blue-500' : 'bg-gray-200'}`}
        >
          <Text className={`text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>{displayContent}</Text>
          <View className={`mt-1 flex-row flex-wrap items-center gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <Text className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatTime(message.createdAt)}
            </Text>
            {isOwn && (
              <View className="flex-row items-center gap-1">
                {failed && onRetryFailed ? (
                  <>
                    <AlertCircle size={14} color="#fef08a" />
                    <TouchableOpacity onPress={() => onRetryFailed(message.id)}>
                      <Text className="text-[11px] text-white underline">Повторить</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
                {pending ? <ActivityIndicator size="small" color="#e0e7ff" /> : null}
                {showDeliveryTicks ? (
                  readByPeer ? (
                    <CheckCheck size={14} color="#fff" />
                  ) : (
                    <Check size={14} color="#bfdbfe" />
                  )
                ) : null}
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
