# Hooks

## Overview

React hooks are used throughout the application for data fetching, state management, and side effects. The project follows strict naming conventions and organizational patterns.

## Naming Convention

### ⚠️ CRITICAL RULE

**ALL React hooks in the project MUST have the `.hook.ts` suffix, without exception.**

### Correct Examples

```typescript
// ✅ Correct
// entities/user/lib/hook/user.hook.ts
// entities/post/lib/hook/posts.hook.ts
// features/call/lib/hook/call-controls.hook.ts
// processes/auth/lib/hooks/auth.hook.ts
```

### Incorrect Examples

```typescript
// ❌ Incorrect
// entities/user/lib/hook/user.ts
// entities/post/lib/hook/usePost.ts
// features/post/CreatePost/lib/useCreatePostForm.ts
```

## Hook Locations

### Entity Hooks

**Location**: `app/entities/*/lib/hook/*.hook.ts`

**Purpose**: Hooks for working with business entities (data fetching, mutations).

**Examples**:
- `app/entities/user/lib/hook/user.hook.ts` - User data
- `app/entities/posts/lib/hook/posts.hook.ts` - Posts list
- `app/entities/profile/lib/hook/profile.hook.ts` - Profile data

### Feature Hooks

**Location**: `app/features/*/lib/hook/*.hook.ts`

**Purpose**: Hooks for feature-specific logic.

**Examples**:
- `app/features/post/CreatePost/lib/useCreatePostForm.hook.ts` - Post creation form

### Process Hooks

**Location**: `app/processes/*/lib/hooks/*.hook.ts`

**Purpose**: Hooks for business processes.

**Examples**:
- `app/processes/auth/lib/hooks/auth.hook.ts` - Authentication
- `app/processes/auth/lib/hooks/auth-check.hook.tsx` - Auth check

### Shared Hooks

**Location**: `app/shared/hooks/*.ts`

**Purpose**: Reusable hooks not tied to business logic.

**Examples**:
- `app/shared/hooks/usePermissions.ts` - Permissions

## Common Hook Patterns

### Data Fetching Hook

**Pattern**: Use TanStack Query for server data.

```typescript
// app/entities/user/lib/hook/user.hook.ts
import { useQuery } from '@tanstack/react-query';
import { UserService } from '../api/UserService';

export const useUser = (userId: string) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => UserService.getUser(userId),
        enabled: !!userId, // Only fetch if userId exists
    });

    return {
        user: data,
        isLoading,
        error
    };
};
```

### List Fetching Hook

```typescript
// app/entities/posts/lib/hook/posts.hook.ts
import { useQuery } from '@tanstack/react-query';
import { PostService } from '../api/PostService';

export const usePosts = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['posts'],
        queryFn: () => PostService.getPosts(),
    });

    return {
        posts: data,
        isLoading,
        error
    };
};
```

### Mutation Hook

```typescript
// app/entities/posts/lib/hook/posts.hook.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PostService } from '../api/PostService';

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePostDto) => PostService.createPost(data),
        onSuccess: () => {
            // Invalidate cache to refetch
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });
};
```

### Context Hook

```typescript
// app/processes/auth/lib/hooks/auth.hook.ts
import { useContext } from 'react';
import { AuthContext } from '../../providers/AuthProvider';

export const useAuth = () => {
    const { user, setUser } = useContext(AuthContext);
    return { user, setUser };
};
```

### WebSocket Hook

```typescript
// app/entities/presence/lib/hooks/usePresenceSocket.hook.ts
import { useEffect } from 'react';
import { connectPresenceSocket } from '@/shared/lib/socket/presence-socket';

export const usePresenceSocket = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) return;

        let socket: Socket | null = null;

        const initSocket = async () => {
            socket = await connectPresenceSocket(user.id);
            // Setup event listeners
        };

        initSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [user?.id]);
};
```

## Real Examples from Project

### User Hook

**Location**: `app/entities/user/lib/hook/user.hook.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { UserService } from "../api/UserService";

export const useUser = (userId: string) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => UserService.getUser(userId),
    });

    const { data: users, isLoading: isLoadingUsers, error: errorUsers } = useQuery({
        queryKey: ['users'],
        queryFn: () => UserService.getAllUsers(),
    });

    return {
        user: data,
        isLoading,
        error,
        users,
        isLoadingUsers,
        errorUsers
    };
};
```

### Posts Hook

**Location**: `app/entities/posts/lib/hook/posts.hook.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { PostService } from "../api/PostService";

export const usePosts = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['posts'],
        queryFn: () => PostService.getPosts(),
    });

    return { posts: data, isLoading, error };
};
```

### Profile Hook

**Location**: `app/entities/profile/lib/hook/profile.hook.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { ProfileService } from "../api/ProfileService";
import { ProfileDto } from "@/api";

export const useProfile = (userId: string) => {
    const { data: profile, isLoading, error } = useQuery<ProfileDto>({
        queryKey: ['profile', userId],
        queryFn: () => ProfileService.getProfileByUserId(userId),
        enabled: !!userId,
    });

    return {
        profile,
        isLoading,
        error,
        posts: profile?.postsCount || 0,
        followers: profile?.followersCount || 0,
        following: profile?.followingCount || 0,
        slogan: profile?.about || '',
    };
};
```

### Auth Hook

**Location**: `app/processes/auth/lib/hooks/auth.hook.ts`

```typescript
import { useContext } from "react";
import { AuthContext } from "../../providers/AuthProvider";

export const useAuth = () => {
    const { user, setUser } = useContext(AuthContext);
    return { user, setUser };
};
```

## Hook Best Practices

### 1. Always Use `.hook.ts` Suffix

✅ **Do**:
```typescript
// user.hook.ts
export const useUser = () => { /* ... */ };
```

❌ **Don't**:
```typescript
// user.ts
export const useUser = () => { /* ... */ };
```

### 2. Return Consistent Structure

✅ **Do**:
```typescript
export const useUser = (userId: string) => {
    const { data, isLoading, error } = useQuery({ /* ... */ });

    return {
        user: data,
        isLoading,
        error
    };
};
```

### 3. Handle Loading and Error States

✅ **Do**:
```typescript
export const useUser = (userId: string) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => UserService.getUser(userId),
    });

    return { user: data, isLoading, error };
};
```

### 4. Use `enabled` for Conditional Fetching

✅ **Do**:
```typescript
export const useUser = (userId: string) => {
    return useQuery({
        queryKey: ['user', userId],
        queryFn: () => UserService.getUser(userId),
        enabled: !!userId, // Only fetch if userId exists
    });
};
```

### 5. Clean Up Side Effects

✅ **Do**:
```typescript
export const usePresenceSocket = () => {
    useEffect(() => {
        let socket: Socket | null = null;

        const initSocket = async () => {
            socket = await connectSocket();
        };

        initSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);
};
```

### 6. Use Query Keys Consistently

✅ **Do**:
```typescript
// Single entity
['user', userId]

// List
['posts']

// Nested
['messages', 'chat', chatId]
```

## Hook Organization

### By Layer (FSD)

```
app/
├── entities/
│   └── user/
│       └── lib/
│           └── hook/
│               └── user.hook.ts        # Entity hook
├── features/
│   └── post/
│       └── CreatePost/
│           └── lib/
│               └── useCreatePostForm.hook.ts  # Feature hook
├── processes/
│   └── auth/
│       └── lib/
│           └── hooks/
│               └── auth.hook.ts       # Process hook
└── shared/
    └── hooks/
        └── usePermissions.ts          # Shared hook
```

### Export Pattern

Each hook should be exported from the module's `index.ts`:

```typescript
// app/entities/user/index.ts
export * from './lib/hook/user.hook';
```

## Common Hooks Reference

### Authentication

- `useAuth()` - Get current user and setUser function
- `useAuthCheck()` - Check authentication on mount/route change

### Entities

- `useUser(userId)` - Get user data
- `usePosts()` - Get posts list
- `useProfile(userId)` - Get profile data
- `useMessages(chatId)` - Get chat messages

### WebSockets

- `usePresenceSocket()` - Track user presence
- `useGlobalMessagesSocket()` - Listen for all messages

### Shared

- `usePermissions()` - Check device permissions

## TypeScript Types

### Hook Return Types

```typescript
// Data fetching hook
type UseUserReturn = {
    user: UserDto | undefined;
    isLoading: boolean;
    error: Error | null;
};

// Mutation hook
type UseCreatePostReturn = {
    mutate: (data: CreatePostDto) => void;
    isLoading: boolean;
    error: Error | null;
    isSuccess: boolean;
};
```

## Testing Hooks

### Using React Testing Library

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useUser } from './user.hook';

test('fetches user data', async () => {
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useUser('123'), {
        wrapper: ({ children }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        ),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeDefined();
});
```

## Summary

Hooks in the project:
- **Follow strict naming** - All hooks use `.hook.ts` suffix
- **Organized by FSD layers** - Entity, feature, process, shared hooks
- **Use TanStack Query** - For server state management
- **Consistent patterns** - Similar structure across hooks
- **Proper cleanup** - Side effects cleaned up in useEffect

This ensures maintainable, predictable, and testable hook implementations throughout the application.
