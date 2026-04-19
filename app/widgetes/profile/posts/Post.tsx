import { View, Text,  Image, StyleSheet } from "react-native";
import { UserAvatar } from "@/shared";
import { Video, ResizeMode } from "expo-av";
import { PostDto } from "@/api";
import { useUser } from "@/entities/user";


interface IPostProps {
    post: PostDto;
}

export default function Post({ post }: IPostProps) {
    const { user } = useUser(post.author?.id || '');


    return (

        <View key={post.id} className="mb-4 p-4 bg-white rounded-2xl border border-gray-200">
            <View className="flex-row gap-2">
                <UserAvatar
                    user={user}
                    size="sm"
                />
                <Text className="text-gray-900 font-bold text-md">{user?.name}</Text>
            </View>
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
