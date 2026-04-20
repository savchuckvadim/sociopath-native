import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/api/lib/auth/helper-storage.api';
import { SOCKET_URL } from '@/config/api.config';

let callsSocket: Socket | null = null;

export const connectWebSocket = async (userId: string): Promise<Socket> => {
    if (callsSocket?.connected) {
        return callsSocket;
    }

    const accessToken = await getAccessToken();
    const socketUrl = `${SOCKET_URL}`;

    callsSocket = io(socketUrl, {
        query: {
            userId,
        },
        auth: {
            token: accessToken || '',
        },
        transports: ['websocket'],
        extraHeaders: accessToken ? {
            Authorization: `Bearer ${accessToken}`,
        } : {},
    });

    callsSocket.on('connect', () => {
        console.log('🔌 Calls WebSocket connected');
    });

    callsSocket.on('disconnect', () => {
        console.log('🔌 Calls WebSocket disconnected');
    });

    callsSocket.on('connect_error', (error) => {
        console.error('❌ Calls WebSocket connection error:', error);
    });

    return callsSocket;
};

export const disconnectCallsSocket = () => {
    if (callsSocket) {
        callsSocket.disconnect();
        callsSocket = null;
    }
};

export const getCallsSocket = (): Socket | null => {
    return callsSocket;
};
