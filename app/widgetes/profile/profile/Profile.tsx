import { View, ScrollView } from "react-native";
import { ProfileInformation, ProfilePosts } from "@/widgetes/profile";

import { Loader } from "@/shared";
import { FC } from "react";
import { useAuth } from "@/processes/auth/lib/hooks/auth.hook";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface IProfileProps {
    userId: string;
}
export const Profile: FC<IProfileProps> = ({ userId }) => {
    const { user: currentUser } = useAuth();
    const isOwnProfile = currentUser?.id === userId;
    const insets = useSafeAreaInsets();
    if (!userId) {
        return (
            <View className="flex-1 items-center justify-center">
                <Loader />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
            <View className="w-full flex-col gap-4 p-4">
                <ProfileInformation userId={userId}  isOwnProfile={isOwnProfile} />
                <ProfilePosts userId={userId} />
            </View>
        </ScrollView>
    );
}

