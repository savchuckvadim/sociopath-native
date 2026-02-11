import { View, Text, ScrollView, Image, StyleSheet } from "react-native";
import { usePostsByUserId } from "@/entities/posts";
import { useAuth } from "@/processes/auth";
import { Loader, Empty, LoadingComponent } from "@/shared";
import { Video, ResizeMode } from "expo-av";
import CreatePost from "@/features/post/CreatePost/CreatePost";

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
                        <View key={post.id} className="mb-4 p-4 bg-white rounded-2xl border border-gray-200">
                            {post.originalPostId && (
                                <View className="mb-2">
                                    <Text className="text-xs text-gray-500">Reposted</Text>
                                </View>
                            )}
                            {post.text && (
                                <Text className="text-gray-900 mb-2">{post.text}</Text>
                            )}
                            {post.image && typeof post.image === 'string' && post.image.trim() !== '' && (
                                <View className="mb-2" style={styles.mediaContainer}>
                                    <Image
                                        source={{ uri: post.image }}
                                        style={styles.image}
                                        resizeMode="cover"
                                        onError={(error) => {
                                            console.error('Image load error:', error.nativeEvent.error);
                                            console.error('Image URL:', post.image);
                                        }}
                                        onLoad={() => {
                                            console.log('Image loaded successfully:', post.image);
                                        }}
                                    />
                                </View>
                            )}
                            {post.video && typeof post.video === 'string' && post.video.trim() !== '' && (
                                <View className="mb-2" style={styles.mediaContainer}>
                                    <Video
                                        source={{ uri: post.video }}
                                        style={styles.video}
                                        useNativeControls
                                        resizeMode={ResizeMode.CONTAIN}
                                        isLooping={false}
                                    />
                                </View>
                            )}
                            <View className="flex-row gap-4 mt-2">
                                <Text className="text-gray-500 text-sm">❤️ {post.likesCount}</Text>
                                <Text className="text-gray-500 text-sm">💬 {post.repostsCount}</Text>
                            </View>
                        </View>
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
