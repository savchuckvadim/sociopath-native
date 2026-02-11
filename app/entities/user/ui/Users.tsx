import { View, Text, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { useUser } from "../lib/hook/user.hook";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { UserCard } from "./UserCard";
import { Loader } from "@/shared";

interface UsersProps {
    userId: string;
}

export const Users = ({ userId }: UsersProps) => {
    const { users, isLoadingUsers } = useUser(userId);
    const [search, setSearch] = useState('');
    const navigation = useNavigation();

    const filteredUsers = users?.filter((user) =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoadingUsers) {
        return (
            <View className="flex-1 items-center justify-center">
                <Loader />
            </View>
        );
    }

    return (
        <View className="flex-1 px-4 pt-4">
            <Text className="text-2xl font-bold mb-4">Пользователи</Text>
            
            <View className="flex-row items-center gap-2 mb-4">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text className="text-blue-500">← Назад</Text>
                </TouchableOpacity>
                <TextInput
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Поиск"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <ScrollView className="flex-1">
                <View className="flex-row flex-wrap gap-4">
                    {filteredUsers?.map((user) => (
                        <View key={user.id} className="w-[48%]">
                            <UserCard user={user} />
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};
