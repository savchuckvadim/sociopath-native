import { View } from "react-native";
import { Users } from "@/entities/user";
import { useAuth } from "@/processes/auth";
import { Loader } from "@/shared";

export default function People() {
    const { user } = useAuth();

    if (!user || !user.id) {
        return (
            <View className="flex-1 items-center justify-center">
                <Loader />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Users userId={user.id} />
        </View>
    );
}
