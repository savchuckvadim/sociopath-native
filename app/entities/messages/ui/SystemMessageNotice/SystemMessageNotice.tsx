import { View, Text } from 'react-native';

interface SystemMessageNoticeProps {
  content: string;
}

export const SystemMessageNotice = ({ content }: SystemMessageNoticeProps) => {
  const isCallHistoryEvent = /звонок|недозвонились|пропущенный/i.test(content);

  return (
    <View className="mb-4 items-center px-6">
      <Text className={`text-xs text-center text-gray-500 ${isCallHistoryEvent ? 'bg-gray-100 px-3 py-1 rounded-full' : ''}`}>
        {isCallHistoryEvent ? `Звонок: ${content}` : content}
      </Text>
    </View>
  );
};
