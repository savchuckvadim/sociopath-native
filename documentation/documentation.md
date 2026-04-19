# Sociopath Network Mobile - Documentation

This document provides an overview of the project architecture, principles, and links to detailed documentation.

## 📚 Table of Contents

1. [Architecture](#architecture)
2. [Authentication](#authentication)
3. [API & Code Generation](#api--code-generation)
4. [State Management](#state-management)
5. [WebSockets & Real-time](#websockets--real-time)
6. [Hooks](#hooks)
7. [Project Structure](#project-structure)

## 🏗️ Architecture

The project uses **Feature-Sliced Design (FSD)** - a methodology for organizing code by layers of abstraction and isolation.

### FSD Layers

The project is organized into the following layers (from low to high abstraction):

```
app/
├── shared/      # Reusable components and utilities (lowest level)
├── entities/    # Business entities (data and their representation)
├── features/    # Functional capabilities (use-cases)
├── widgets/     # Large UI blocks, composition of features and entities
├── processes/   # Global business processes (routing, authentication)
└── screens/     # Screen components (composition of all layers)
```

### Key Principles

1. **Layer Isolation** - Lower layers cannot import from higher layers
2. **Public API** - Each module exports only public API through `index.ts`
3. **Single Responsibility** - Each module solves one task
4. **Features Manage Entities** - Features are use-cases that use entities
5. **Processes Manage Global State** - Processes are more global than features

### Detailed Documentation

For a comprehensive guide to FSD architecture, rules, and conventions, see:
- **[FSD Architecture Guide](./arcitecture/fsd.md)** - Detailed description of layers, import rules, naming conventions, and best practices

## 🔐 Authentication

The authentication system uses JWT tokens (access token + refresh token) stored in secure storage.

### Token Storage

- **Access Token** - Stored in AsyncStorage/SecureStore, short-lived (15 minutes)
- **Refresh Token** - Stored in AsyncStorage/SecureStore, long-lived (7 days)

### Authentication Flow

1. **Login/Registration** → Tokens received and stored
2. **API Requests** → Access token automatically attached via interceptor
3. **Token Refresh** → On 401 error, refresh token used to get new access token
4. **Logout** → Tokens removed, user redirected to login

### Key Components

- **AuthProvider** (`app/processes/auth/providers/AuthProvider.tsx`) - React Context for user state
- **Auth Global Service** (`app/processes/auth/lib/services/auth-global.service.ts`) - Centralized logout logic
- **Interceptors** (`app/api/lib/interceptors/`) - Automatic token attachment and refresh

### Interceptors

1. **Token Interceptor** (`with-token.interceptor.ts`) - Adds access token to requests
2. **Refresh Interceptor** (`refresh.interceptor.ts`) - Handles 401 errors and token refresh
3. **Error Toast Interceptor** (`error-toast.interceptor.ts`) - Shows error messages

### Detailed Documentation

For detailed authentication documentation, see:
- **[Authentication Guide](./auth.md)** - Complete authentication flow, interceptors, and error handling

## 🔌 API & Code Generation

The app uses **Orval** to automatically generate TypeScript API client from the backend OpenAPI specification.

### How It Works

1. **Backend** generates OpenAPI specification (Swagger)
2. **Orval** reads specification from `https://api.sociopath-network.ru/docs/api-json`
3. **Orval** generates TypeScript code with types and functions for all endpoints
4. Generated code is placed in `app/api/generated/`

### Configuration

- **Config File**: `orval.config.ts`
- **Generated Code**: `app/api/generated/`
- **Custom Axios**: `app/api/lib/back-api.ts`

### Usage

```typescript
import { getAuth, getPosts } from '@/api';
import type { UserDto, PostDto } from '@/api';

// Use generated API
const authApi = getAuth();
const user = await authApi.authLogin({ email, password });
```

### Generating API Client

```bash
npm run api:generate
```

### Detailed Documentation

For detailed API documentation, see:
- **[API & Code Generation Guide](./api.md)** - Complete guide to Orval, API usage, and custom axios

## 📊 State Management

The app uses a combination of state management solutions:

### TanStack Query (React Query)

**Purpose**: Server state management, API data caching, and synchronization

**Configuration**: `App.tsx`
```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        }
    }
})
```

**Usage**: Throughout the app in hooks
```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => UserService.getUser(userId),
});
```

**Location**: Used in `app/entities/*/lib/hook/*.hook.ts` files

### React Context API

**Purpose**: Client-side state (authentication, global app state)

**Usage**:
- **AuthContext** (`app/processes/auth/providers/AuthProvider.tsx`) - User authentication state
- **GlobalCallProvider** (`app/entities/call/`) - Call state management

**Note**: Unlike the web version, the mobile app does **not** use Redux. All state is managed through React Context and TanStack Query.

## 📡 WebSockets & Real-time

The app uses **Socket.IO** for real-time features.

### WebSocket Connections

1. **Messages Socket** - Real-time message delivery
   - Location: `app/shared/lib/socket/messages-socket.ts`
   - Hook: `app/entities/chats/lib/hooks/useGlobalMessagesSocket.ts`
   - Events: `message:new`

2. **Presence Socket** - Online/offline status tracking
   - Location: `app/entities/presence/lib/hooks/usePresenceSocket.hook.ts`
   - Events: `presence:online`, `presence:offline`, `presence:ping`

3. **Calls Socket** - Call management
   - Location: `app/shared/lib/socket/websocket.ts`
   - Used for call signaling

### Presence System

The presence system tracks user online/offline status:

- **Ping Interval**: Every 25 seconds
- **TTL**: 60 seconds (if no ping, user marked offline)
- **Events**:
  - `presence:online` - User came online
  - `presence:offline` - User went offline
  - `presence:ping` - Keep-alive ping

**Usage**:
```typescript
import { usePresenceSocket } from '@/entities/presence';

// Automatically tracks current user's presence
usePresenceSocket();
```

### Global Messages Socket

The global messages socket listens for all incoming messages:

- **Location**: `app/entities/chats/lib/hooks/useGlobalMessagesSocket.ts`
- **Features**:
  - Plays notification sound for new messages
  - Invalidates chat list cache
  - Updates message cache for active chats

**Usage**: Automatically initialized in `app/processes/navigation/ui/Navigation.tsx`

### Detailed Documentation

For detailed WebSocket documentation, see:
- **[WebSockets & Real-time Guide](./websockets.md)** - Complete guide to WebSocket connections, presence, and notifications

## 🪝 Hooks

The project follows a naming convention for React hooks: **all hooks must have the `.hook.ts` suffix**.

### Hook Naming Convention

```typescript
// ✅ Correct
// entities/user/lib/hook/user.hook.ts
// features/post/lib/hook/posts.hook.ts
// processes/auth/lib/hooks/auth.hook.ts

// ❌ Incorrect
// entities/user/lib/hook/user.ts
// features/post/lib/hook/usePosts.ts
```

### Hook Locations

- **Entity Hooks**: `app/entities/*/lib/hook/*.hook.ts`
- **Feature Hooks**: `app/features/*/lib/hook/*.hook.ts`
- **Process Hooks**: `app/processes/*/lib/hooks/*.hook.ts`
- **Shared Hooks**: `app/shared/hooks/*.ts`

### Common Hooks

- `useAuth()` - Authentication state and methods
- `useUser(userId)` - User data fetching
- `useProfile(userId)` - Profile data fetching
- `usePresenceSocket()` - Presence tracking
- `useGlobalMessagesSocket()` - Global message listening

### Detailed Documentation

For detailed hooks documentation, see:
- **[Hooks Guide](./hooks.md)** - Complete guide to hooks, naming conventions, and best practices

## 📁 Project Structure

### Main Directories

```
app/
├── api/              # API client and interceptors
│   ├── generated/    # Auto-generated API code (Orval)
│   └── lib/          # API configuration, interceptors, utilities
├── config/           # App configuration (API URLs, etc.)
├── entities/          # Business entities
│   ├── call/         # Call entity
│   ├── chats/        # Chat entity
│   ├── messages/     # Message entity
│   ├── posts/        # Post entity
│   ├── presence/     # Presence entity
│   ├── profile/      # Profile entity
│   └── user/         # User entity
├── features/          # Feature use-cases
│   └── post/          # Post features (CreatePost, etc.)
├── processes/         # Business processes
│   ├── auth/         # Authentication process
│   └── navigation/   # Navigation process
├── screens/           # Screen components
│   ├── auth/         # Auth screen
│   ├── chats/        # Chat screens
│   ├── home/         # Home screen
│   ├── me/           # Profile screen
│   ├── people/       # People screen
│   └── settings/     # Settings screen
├── shared/            # Shared resources
│   ├── hooks/         # Shared hooks
│   ├── lib/           # Shared utilities (socket, notifications)
│   ├── style/         # Styles and colors
│   └── ui/            # Shared UI components
└── widgets/           # Complex UI widgets
    ├── bottom-menu/   # Bottom navigation menu
    ├── call/          # Call widget
    ├── chat/          # Chat widget
    └── profile/       # Profile widget
```

### File Naming Conventions

- **Hooks**: `*.hook.ts` (e.g., `user.hook.ts`, `auth.hook.ts`)
- **Components**: `*.tsx` (e.g., `User.tsx`, `AuthForm.tsx`)
- **Services**: `*.service.ts` (e.g., `UserService.ts`, `AuthService.ts`)
- **Types**: `*.types.ts` or `*.interface.ts` (e.g., `user.types.ts`)
- **Constants**: `*.consts.ts` or `*.const.ts` (e.g., `auth.consts.ts`)

### Index Files (Public API)

Each module should have an `index.ts` file that exports only the public API:

```typescript
// entities/user/index.ts
export * from './lib/hook/user.hook';
export * from './ui/UserAvatar';
export * from './type/user.types';
```

**Rule**: All imports should go through `index.ts`:
```typescript
// ✅ Correct
import { useUser } from '@/entities/user';

// ❌ Incorrect
import { useUser } from '@/entities/user/lib/hook/user.hook';
```

## 🔗 Links to Detailed Documentation

- **[FSD Architecture](./arcitecture/fsd.md)** - Complete Feature-Sliced Design guide
- **[Authentication](./auth.md)** - Authentication system, tokens, interceptors
- **[API & Code Generation](./api.md)** - API client generation with Orval
- **[State Management](./state-management.md)** - TanStack Query and React Context
- **[WebSockets & Real-time](./websockets.md)** - WebSocket connections, presence, notifications
- **[Hooks](./hooks.md)** - Hooks guide, naming conventions, patterns
- **[Project Structure](./project-structure.md)** - Complete project structure and organization

## 📝 Additional Resources

- **Main README**: [../README.md](../README.md)
- **Backend API**: [https://api.sociopath-network.ru](https://api.sociopath-network.ru)
- **API Documentation**: [https://api.sociopath-network.ru/docs/api](https://api.sociopath-network.ru/docs/api)
