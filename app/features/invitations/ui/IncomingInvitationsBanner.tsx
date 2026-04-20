import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useIncomingInvitationsBanner } from './useIncomingInvitationsBanner';

export function IncomingInvitationsBanner() {
  const { shouldShow, incoming, accept, reject, isAcceptPending, isRejectPending } =
    useIncomingInvitationsBanner();

  if (!shouldShow) {
    return null;
  }

  return (
    <View className="px-3 pb-2 gap-2">
      {incoming.map((inv) => (
        <View
          key={inv.id}
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex-row items-center gap-2"
        >
          <Feather name="lock" size={18} color="#d97706" />
          <View className="flex-1 min-w-0">
            <Text className="text-sm font-medium text-gray-900">Защищённый чат (Signal)</Text>
            <Text className="text-xs text-gray-600" numberOfLines={2}>
              {inv.counterpartyName ?? 'Пользователь'} приглашает вас в E2EE-диалог
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200"
              onPress={() => reject(inv.id)}
              disabled={isRejectPending}
            >
              <Text className="text-xs">Отклонить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-1.5 rounded-lg bg-blue-500"
              onPress={() => accept(inv.id)}
              disabled={isAcceptPending}
            >
              <Text className="text-xs text-white">Принять</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
