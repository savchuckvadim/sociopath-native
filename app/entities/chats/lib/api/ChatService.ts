import { ChatDto, CreateChatDto, UpdateChatDto, AddMemberDto } from "@/api";
import { getChats } from "@/api/generated/chats/chats";

const $api = getChats();

export class ChatService {
    constructor() { }

    static async getUserChats(): Promise<ChatDto[]> {
        return await $api.chatsGetUserChats() as ChatDto[];
    }

    static async getChatById(chatId: string): Promise<ChatDto> {
        return await $api.chatsGetChatById(chatId) as ChatDto;
    }

    static async createChat(data: CreateChatDto): Promise<ChatDto> {
        return await $api.chatsCreateChat(data) as ChatDto;
    }

    static async updateChat(chatId: string, data: UpdateChatDto): Promise<ChatDto> {
        return await $api.chatsUpdateChat(chatId, data) as ChatDto;
    }

    static async deleteChat(chatId: string): Promise<ChatDto> {
        return await $api.chatsDeleteChat(chatId) as ChatDto;
    }

    static async addMember(chatId: string, data: AddMemberDto): Promise<ChatDto> {
        return await $api.chatsAddMember(chatId, data) as ChatDto;
    }

    static async removeMember(chatId: string, memberId: string): Promise<ChatDto> {
        return await $api.chatsRemoveMember(chatId, memberId) as ChatDto;
    }

    static async markAsRead(chatId: string): Promise<ChatDto> {
        return await $api.chatsMarkAsRead(chatId) as ChatDto;
    }
}
