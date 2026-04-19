import { View, ScrollView, Text } from "react-native";
import { ProfileInformation, ProfilePosts } from "@/widgetes/profile";
import { useAuth } from "@/processes/auth/lib/hooks/auth.hook";
import { LoadingComponent } from "@/shared";

export default function Me() {
    const { user } = useAuth();

    if (!user || !user.id) {
        return (
            <View className="flex-1 items-center justify-center">
                <LoadingComponent />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50 m-0 p-0">
            <View className="w-full flex-col gap-4">
                <ProfileInformation userId={user.id} isOwnProfile={true} />
                <ProfilePosts userId={user.id} />
            </View>
        </ScrollView>
    );
}
