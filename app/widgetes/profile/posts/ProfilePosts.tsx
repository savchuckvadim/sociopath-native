import { View, Text, ScrollView, Image, StyleSheet } from "react-native";
import { usePostsByUserId } from "@/entities/posts";
import { useAuth } from "@/processes/auth/lib/hooks/auth.hook";
import { Loader, Empty, LoadingComponent } from "@/shared";
import CreatePost from "@/features/post/CreatePost/CreatePost";
import Post from "./Post";

interface ProfilePostsProps {
    userId: string;
}

const NO_POST_MESSAGE = "No posts yet";

export default function ProfilePosts({ userId }: ProfilePostsProps) {
    const { user: currentUser } = useAuth();
    const { posts, isLoading, error } = usePostsByUserId(userId);
    const isOwnProfile = currentUser?.id === userId;

    if (isLoading) {
        return null

    }
    if (error) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-red-500">Error loading posts</Text>
            </View>
        );
    }

    return (
        <View className="mt-1">
            {isOwnProfile && <CreatePost />}
            <ScrollView className="flex-1">
                {posts.length === 0 ? (
                    <Empty text={NO_POST_MESSAGE} />
                ) : (
                    posts.map((post) => (
                        <Post key={post.id} post={post} />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    mediaContainer: {
        width: '100%',
        marginBottom: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 192, // h-48 в Tailwind = 192px
        borderRadius: 8,
    },
    video: {
        width: '100%',
        height: 192,
        borderRadius: 8,
    },
});
