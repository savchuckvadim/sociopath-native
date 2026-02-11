import { View, Text, TouchableOpacity } from "react-native";
import { UserDto } from "@/api";
import { Button } from "@/shared";
import { useNavigation } from "@react-navigation/native";

interface UserCardProps {
    user: UserDto;
}

export const UserCard = ({ user }: UserCardProps) => {
    const navigation = useNavigation();

    return (
        <View className="w-full p-4 bg-white rounded-lg border border-gray-200 mb-4">
            <Text className="text-xl font-bold mb-2">{user.name}</Text>
            <Text className="text-sm text-gray-500 mb-4">{user.email}</Text>
            <TouchableOpacity
                onPress={() => {
                    // @ts-ignore
                    navigation.navigate('UserProfile', { userId: user.id });
                }}
            >
                <View className="bg-red-500 rounded-lg py-2 px-4">
                    <Text className="text-white text-center font-medium">View Profile</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};
