import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/api/lib/auth/helper-storage.api';

let socket: Socket | null = null;
const SOCKET_URL = 'https://api.sociopath-network.ru'; // process.env.SERVER_URL ||
console.log('SOCKET_URL', SOCKET_URL)
export const connectMessagesSocket = async (userId: string): Promise<Socket> => {
    if (socket?.connected) {
        return socket;
    }

    const accessToken = await getAccessToken();
    const socketUrl = `${SOCKET_URL}/messages`;

    socket = io(socketUrl, {
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

    socket.on('connect', () => {
        console.log('🔌 Messages WebSocket connected');
    });

    socket.on('disconnect', () => {
        console.log('🔌 Messages WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Messages WebSocket connection error:', error);
    });

    return socket;
};

export const disconnectMessagesSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getMessagesSocket = (): Socket | null => {
    return socket;
};
