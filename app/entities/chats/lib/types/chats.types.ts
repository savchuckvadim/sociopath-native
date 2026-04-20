import type { ChatDto, ChatMemberDto, CreateChatDto } from "@/api";

export type { ChatMemberDto };

export enum ChatType {
    PRIVATE = 'PRIVATE',
    GROUP = 'GROUP',
}

export enum ChatMemberRole {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
}

export interface Chat extends Omit<ChatDto, 'type'> {
    type: ChatType;
}

export interface CreateChat extends Omit<CreateChatDto, 'type'> {
    type: ChatType;
}
