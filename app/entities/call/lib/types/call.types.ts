/**
 * Типы для звонков через LiveKit
 * WebRTC поля (offer/ans) больше не используются
 */

export interface IncomingCallData {
    from: string; // socketId инициатора
    fromUserId: string; // userId инициатора
    callId: string; // ID звонка в БД
    chatId: string; // ID чата
    type: 'VIDEO' | 'AUDIO';
    // offer больше не используется (было для WebRTC)
}

export interface CallAcceptedData {
    from: string;
    // ans больше не используется (было для WebRTC)
}

export interface CallEndData {
    from: string;
    duration?: number; // Длительность звонка в секундах
}

export interface CallInitiateData {
    toUserId: string;
    chatId: string;
    type: 'VIDEO' | 'AUDIO';
    // offer больше не используется (было для WebRTC)
}
