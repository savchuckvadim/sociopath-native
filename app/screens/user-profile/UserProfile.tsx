import { View, ScrollView } from "react-native";
import { ProfileInformation, ProfilePosts } from "@/widgetes/profile";
import { useRoute } from "@react-navigation/native";
import { Loader } from "@/shared";

export default function UserProfile() {
    const route = useRoute();

    const params: { userId: string } = route.params as { userId: string };
    const userId = params.userId;
    if (!userId) {
        return (
            <View className="flex-1 items-center justify-center">
                <Loader />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="w-full flex-col gap-4">
                <ProfileInformation userId={userId} isOwnProfile={false} />
                <ProfilePosts userId={userId} />
            </View>
        </ScrollView>
    );
}
