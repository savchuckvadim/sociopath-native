import type { MessageDto, UserDto } from "@/api";

export const NO_MESSAGES_MESSAGE = 'Thanks damn! No messages yet';

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    FILE = 'FILE',
    SYSTEM = 'SYSTEM',
}

export type ClientOutgoingStatus = 'sending' | 'failed';

export interface Message extends Omit<MessageDto, 'sender' | 'type' | 'replyTo'> {
    type: MessageType;
    sender?: UserDto;
    replyTo?: Message;
    /** Локальный статус исходящего (оптимистичная отправка). */
    _clientStatus?: ClientOutgoingStatus;
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
