import { PaginatedPostsDto, PostDto, CreatePostDto } from "@/api";
import { getPosts } from "@/api/generated/posts/posts";
import { PostGetPostsByUserIdParams } from "@/api/generated/model/postGetPostsByUserIdParams";

const $api = getPosts();

export class PostService {
    constructor() { }

    static async getPostsByUserId(userId: string, params?: PostGetPostsByUserIdParams): Promise<PaginatedPostsDto> {
        return await $api.postGetPostsByUserId(userId, params) as PaginatedPostsDto;
    }

    static async getPostById(id: string): Promise<PostDto> {
        return await $api.postGetPostById(id) as PostDto;
    }

    static async createPost(data: CreatePostDto): Promise<PostDto> {
        return await $api.postCreatePost(data) as PostDto;
    }

    static async uploadMedia(file: File): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await $api.postUploadMedia();
        // Note: This might need adjustment based on actual API implementation
        return response as { url: string };
    }
}
