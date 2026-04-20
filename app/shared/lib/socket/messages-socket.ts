import type { Socket } from 'socket.io-client';
import { connectWebSocket, disconnectCallsSocket, getCallsSocket } from './websocket';

/** Default-namespace socket shared across calls/presence/messages (web parity). */
export const connectMessagesSocket = async (userId: string): Promise<Socket> => {
    return connectWebSocket(userId);
};

export const disconnectMessagesSocket = () => {
    disconnectCallsSocket();
};

export const getMessagesSocket = (): Socket | null => {
    return getCallsSocket();
};
