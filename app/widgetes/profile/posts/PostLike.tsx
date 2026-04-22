
import { Icon } from "@/shared/ui/icons";
import { Text, View } from "react-native";

export interface IPostLikeProps {
    isLiked: boolean;
    likesCount: number;
    onLike: () => void;
}
export default function PostLike({ isLiked, likesCount, onLike }: IPostLikeProps) {
    return (
        <View className="flex-row items-center gap-2 relative">
            <Icon
                name={'like'}
                size={24}
                color={isLiked ? 'red' : '#6B7280'}
                strokeWidth={2}
            />
            <Text className="absolute top-0 right-0 text-sm text-gray-500">{likesCount}</Text>
        </View>
    )
}
