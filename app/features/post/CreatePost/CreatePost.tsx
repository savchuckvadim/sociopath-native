import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import { useState } from "react";
import { useAuth } from "@/processes/auth";
import { Button, Loader } from "@/shared";
import { useCreatePost } from "@/entities/posts";
import { CreatePostDto } from "@/api";
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

interface CreatePostProps {
    wallUserId?: string;
}

export default function CreatePost({ wallUserId }: CreatePostProps = {}) {
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const createPostMutation = useCreatePost();

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleRemoveImage = () => {
        setImageUri(null);
    };

    const handleSubmit = async () => {
        if (!text.trim() && !imageUri) {
            return;
        }

        try {
            const postData: CreatePostDto = {
                text: text.trim() || undefined,
                image: imageUri || undefined,
                wallUserId: wallUserId,
            };

            await createPostMutation.mutateAsync(postData);
            setText('');
            setImageUri(null);
            setIsFocused(false);
        } catch (error) {
            console.error('Failed to create post:', error);
            Alert.alert('Error', 'Failed to create post');
        }
    };

    if (!user) {
        return null;
    }

    const isExpanded = isFocused || text.length > 0 || imageUri;

    return (
        <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            {isExpanded && (
                <View className="mb-3">
                    <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-2 min-h-[100px] text-base"
                        placeholder="What's on your mind?"
                        value={text}
                        onChangeText={setText}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => {
                            if (!text && !imageUri) {
                                setIsFocused(false);
                            }
                        }}
                        multiline
                        textAlignVertical="top"
                    />
                </View>
            )}

            {imageUri && (
                <View className="mb-3 relative">
                    <Image
                        source={{ uri: imageUri }}
                        className="w-full h-48 rounded-lg"
                        resizeMode="cover"
                    />
                    <TouchableOpacity
                        onPress={handleRemoveImage}
                        className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
                    >
                        <Feather name="x" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            <View className="flex-row items-center justify-between">
                <View className="flex-row gap-4">
                    <TouchableOpacity
                        onPress={handlePickImage}
                        className="flex-row items-center gap-2"
                    >
                        <Feather name="image" size={20} color="#666" />
                        {!isExpanded && <Text className="text-gray-600">Photo</Text>}
                    </TouchableOpacity>
                </View>

                {isExpanded && (
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => {
                                setText('');
                                setImageUri(null);
                                setIsFocused(false);
                            }}
                            className="bg-gray-200 rounded-lg px-4 py-2"
                        >
                            <Text className="text-gray-700">Cancel</Text>
                        </TouchableOpacity>
                        <Button
                            onPress={handleSubmit}
                            disabled={createPostMutation.isPending || (!text.trim() && !imageUri)}
                        >
                            {createPostMutation.isPending ? 'Posting...' : 'Post'}
                        </Button>
                    </View>
                )}
            </View>
        </View>
    );
}
