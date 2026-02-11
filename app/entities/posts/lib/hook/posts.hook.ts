import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PostService } from "../api/PostService";
import { PostDto, CreatePostDto } from "@/api";

export const usePostsByUserId = (userId: string) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['posts', userId],
        queryFn: () => PostService.getPostsByUserId(userId),
        enabled: !!userId,
    });

    return {
        posts: data?.posts || [],
        isLoading,
        error,
    };
};

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePostDto) => PostService.createPost(data),
        onSuccess: (_, variables) => {
            if (variables.wallUserId) {
                queryClient.invalidateQueries({ queryKey: ['posts', variables.wallUserId] });
            } else {
                queryClient.invalidateQueries({ queryKey: ['posts'] });
            }
        },
    });
};
