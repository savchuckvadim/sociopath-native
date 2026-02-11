import { MessageDto, CreateMessageDto, MessagesGetChatMessagesParams } from "@/api";
import { getMessages } from "@/api/generated/messages/messages";

const $api = getMessages();

export class MessageService {
    constructor() { }

    static async getChatMessages(chatId: string, params?: MessagesGetChatMessagesParams): Promise<MessageDto[]> {
        const defaultParams: MessagesGetChatMessagesParams = {
            limit: params?.limit || '50',
            offset: params?.offset || '0',
        };
        return await $api.messagesGetChatMessages(chatId, defaultParams) as MessageDto[];
    }

    static async getMessageById(messageId: string): Promise<MessageDto> {
        return await $api.messagesGetMessageById(messageId) as MessageDto;
    }

    static async createMessage(data: CreateMessageDto): Promise<MessageDto> {
        return await $api.messagesCreateMessage(data) as MessageDto;
    }

    static async updateMessage(messageId: string): Promise<MessageDto> {
        return await $api.messagesUpdateMessage(messageId) as MessageDto;
    }

    static async deleteMessage(messageId: string): Promise<MessageDto> {
        return await $api.messagesDeleteMessage(messageId) as MessageDto;
    }

    static async markAsRead(messageId: string): Promise<MessageDto> {
        return await $api.messagesMarkAsRead(messageId) as MessageDto;
    }

    static async markChatAsRead(chatId: string): Promise<MessageDto> {
        return await $api.messagesMarkChatAsRead(chatId) as MessageDto;
    }

    static async getUnreadCount(chatId: string): Promise<number> {
        return await $api.messagesGetUnreadCount(chatId) as number;
    }
}
