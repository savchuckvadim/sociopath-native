export enum PresenceStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
}

export interface IPresence {
    userId: string;
    status: PresenceStatus;
    lastSeenAt: string; // Отформатированная строка типа "1 minute ago"
}

export interface PresenceState {
    presence: Record<string, IPresence>; // Объект {userId: IPresence} для быстрого доступа
}
