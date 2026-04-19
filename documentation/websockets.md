# WebSockets & Real-time

## Overview

The app uses **Socket.IO** for real-time communication. WebSockets enable:
- Real-time message delivery
- Online/offline status tracking (presence)
- Live notifications
- Call signaling

## WebSocket Architecture

### Connection Management

**Location**: `app/shared/lib/socket/websocket.ts`

```typescript
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/api/lib/auth/helper-storage.api';

let callsSocket: Socket | null = null;
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.sociopath-network.ru';

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

    return callsSocket;
};
```

### Key Features

- **Authentication**: Access token sent in `auth.token` and `Authorization` header
- **User ID**: Sent in query parameters
- **Transport**: WebSocket only (no polling fallback)
- **Reconnection**: Automatic reconnection handled by Socket.IO

## Messages Socket

### Purpose

Real-time message delivery for chats.

### Location

**Connection**: `app/shared/lib/socket/messages-socket.ts`
**Hook**: `app/entities/chats/lib/hooks/useGlobalMessagesSocket.ts`

### Implementation

```typescript
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/api/lib/auth/helper-storage.api';

export const connectMessagesSocket = async (userId: string): Promise<Socket> => {
    const accessToken = await getAccessToken();
    const socketUrl = `${SOCKET_URL}`;

    const socket = io(socketUrl, {
        query: { userId },
        auth: { token: accessToken || '' },
        transports: ['websocket'],
        extraHeaders: accessToken ? {
            Authorization: `Bearer ${accessToken}`,
        } : {},
    });

    return socket;
};
```

### Global Messages Hook

**Location**: `app/entities/chats/lib/hooks/useGlobalMessagesSocket.ts`

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectMessagesSocket } from '@/shared/lib/socket/messages-socket';
import { useAuth } from '@/processes/auth/lib/hooks/auth.hook';

export function useGlobalMessagesSocket() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) return;

        let messagesSocket: Socket | null = null;

        const initSocket = async () => {
            messagesSocket = await connectMessagesSocket(user.id);

            const handleNewMessage = (newMessage: Message) => {
                // Play notification sound
                if (newMessage.senderId !== user.id) {
                    playMessageSound();
                }

                // Invalidate chat list
                queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });

                // Invalidate messages for specific chat
                queryClient.invalidateQueries({
                    queryKey: ['messages', 'chat', newMessage.chatId]
                });
            };

            messagesSocket.on('message:new', handleNewMessage);

            messagesSocket.on('reconnect', () => {
                console.log('🔄 Messages socket reconnected');
            });
        };

        initSocket();

        return () => {
            if (messagesSocket) {
                messagesSocket.off('message:new');
                messagesSocket.disconnect();
            }
        };
    }, [user?.id, queryClient]);
}
```

### Events

- **`message:new`** - New message received
- **`reconnect`** - Socket reconnected

### Usage

Automatically initialized in `app/processes/navigation/ui/Navigation.tsx`:

```typescript
import { useGlobalMessagesSocket } from '@/entities/chats/lib/hooks/useGlobalMessagesSocket';

export const Navigation = () => {
    // Automatically listens for all messages
    useGlobalMessagesSocket();

    // ... rest of component
};
```

## Presence Socket

### Purpose

Track user online/offline status in real-time.

### Location

**Hook**: `app/entities/presence/lib/hooks/usePresenceSocket.hook.ts`

### Implementation

```typescript
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/api/lib/auth/helper-storage.api';
import { PRESENCE_EVENTS } from '../constants/presence.consts';

export const usePresenceSocket = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) return;

        let presenceSocket: Socket | null = null;

        const initSocket = async () => {
            const accessToken = await getAccessToken();
            const socketUrl = `${SOCKET_URL}`;

            presenceSocket = io(socketUrl, {
                query: { userId: user.id },
                auth: { token: accessToken || '' },
                transports: ['websocket'],
            });

            // Send ping every 25 seconds
            const pingInterval = setInterval(() => {
                if (presenceSocket?.connected) {
                    presenceSocket.emit(PRESENCE_EVENTS.PING);
                }
            }, 25000);

            // Handle online/offline events
            presenceSocket.on(PRESENCE_EVENTS.ONLINE, (userId: string) => {
                console.log('🟢 User online:', userId);
                // Update presence state
            });

            presenceSocket.on(PRESENCE_EVENTS.OFFLINE, (userId: string) => {
                console.log('🔴 User offline:', userId);
                // Update presence state
            });

            return () => {
                clearInterval(pingInterval);
                if (presenceSocket) {
                    presenceSocket.disconnect();
                }
            };
        };

        const cleanup = initSocket();

        return () => {
            cleanup.then((cleanupFn) => {
                if (cleanupFn) cleanupFn();
            });
        };
    }, [user?.id]);
};
```

### Presence Constants

**Location**: `app/entities/presence/lib/constants/presence.consts.ts`

```typescript
export const PRESENCE_EVENTS = {
    PING: 'presence:ping',
    ONLINE: 'presence:online',
    OFFLINE: 'presence:offline',
    BULK_ONLINE: 'presence:bulk-online',
} as const;
```

### How It Works

1. **Connection**: Socket connects when user is authenticated
2. **Ping**: Client sends `presence:ping` every 25 seconds
3. **TTL**: Server marks user as offline if no ping for 60 seconds
4. **Events**: Server broadcasts `presence:online` and `presence:offline` to all clients

### Events

- **`presence:ping`** - Keep-alive ping (sent by client)
- **`presence:online`** - User came online (received from server)
- **`presence:offline`** - User went offline (received from server)
- **`presence:bulk-online`** - List of all online users (received on connect)

### Usage

Automatically initialized in `app/processes/navigation/ui/Navigation.tsx`:

```typescript
import { usePresenceSocket } from '@/entities/presence';

export const Navigation = () => {
    // Automatically tracks current user's presence
    usePresenceSocket();

    // ... rest of component
};
```

## Presence Hook

### Location

`app/entities/presence/lib/hooks/usePresence.hook.ts`

### Purpose

Check if a specific user is online.

### Implementation

```typescript
import { useState, useEffect } from 'react';
import { usePresenceSocket } from './usePresenceSocket.hook';

export const usePresence = (userId: string) => {
    const [isOnline, setIsOnline] = useState(false);

    // Listen to presence events
    useEffect(() => {
        // Implementation to track user's online status
    }, [userId]);

    return { isOnline };
};
```

## Calls Socket

### Purpose

WebSocket connection for call signaling (LiveKit integration).

### Location

`app/shared/lib/socket/websocket.ts`

### Usage

Used by LiveKit for call management. See [Call Documentation](./calls.md) for details.

## WebSocket Best Practices

### 1. Connection Lifecycle

✅ **Do**:
```typescript
useEffect(() => {
    let socket: Socket | null = null;

    const initSocket = async () => {
        socket = await connectSocket(userId);
        // Setup event listeners
    };

    initSocket();

    return () => {
        if (socket) {
            socket.disconnect();
        }
    };
}, [userId]);
```

❌ **Don't**:
```typescript
// Don't create socket outside useEffect
const socket = connectSocket(userId); // ❌
```

### 2. Event Cleanup

✅ **Do**:
```typescript
useEffect(() => {
    const handleMessage = (message: Message) => {
        // Handle message
    };

    socket.on('message:new', handleMessage);

    return () => {
        socket.off('message:new', handleMessage);
    };
}, []);
```

### 3. Authentication

✅ **Do**:
```typescript
const accessToken = await getAccessToken();

const socket = io(socketUrl, {
    auth: { token: accessToken },
    extraHeaders: {
        Authorization: `Bearer ${accessToken}`,
    },
});
```

### 4. Reconnection Handling

Socket.IO handles reconnection automatically. Listen to events:

```typescript
socket.on('connect', () => {
    console.log('Connected');
});

socket.on('disconnect', () => {
    console.log('Disconnected');
});

socket.on('reconnect', () => {
    console.log('Reconnected');
});
```

## Troubleshooting

### Socket Not Connecting

**Check**:
- Access token is valid
- Backend WebSocket server is running
- Network connectivity
- CORS settings (if applicable)

### Events Not Received

**Check**:
- Event names match server
- Socket is connected
- Event listeners are set up correctly
- User has permissions

### Memory Leaks

**Ensure**:
- Cleanup in useEffect return
- Remove event listeners on unmount
- Disconnect socket on unmount

## Summary

WebSocket implementation provides:
- **Real-time messaging** - Instant message delivery
- **Presence tracking** - Online/offline status
- **Automatic reconnection** - Handled by Socket.IO
- **Authentication** - Token-based auth
- **Clean architecture** - Separate hooks for each feature

All WebSocket connections are managed through dedicated hooks following FSD architecture principles.
