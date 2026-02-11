import { MessageDto } from "@/api";

export const NO_MESSAGES_MESSAGE = 'Thanks damn! No messages yet';

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    FILE = 'FILE',
    SYSTEM = 'SYSTEM',
}

export interface Message extends MessageDto {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    type: MessageType;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
    editedAt?: string;
    deletedAt?: string;
    createdAt: string;
    updatedAt: string;
    sender?: {
        id: string;
        name: string;
        email: string;
    };
    replyTo?: Message;
}

export interface CreateMessage {
    chatId: string;
    content: string;
    type?: MessageType;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
}
