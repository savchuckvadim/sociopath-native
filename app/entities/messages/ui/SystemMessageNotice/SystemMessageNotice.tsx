import { View, Text } from 'react-native';

interface SystemMessageNoticeProps {
  content: string;
}

export const SystemMessageNotice = ({ content }: SystemMessageNoticeProps) => {
  return (
    <View className="mb-4 items-center px-6">
      <Text className="text-xs text-center text-gray-500">{content}</Text>
    </View>
  );
};
