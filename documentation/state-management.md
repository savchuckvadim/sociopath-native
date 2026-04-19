# State Management

## Overview

The mobile app uses a combination of state management solutions optimized for React Native:

- **TanStack Query (React Query)** - Server state management, API data caching
- **React Context API** - Client-side state (authentication, global app state)

**Note**: Unlike the web version, the mobile app does **not** use Redux. All state is managed through React Context and TanStack Query.

## TanStack Query (React Query)

### Purpose

TanStack Query is used for:
- Server state management (API data)
- Automatic caching and synchronization
- Background refetching
- Optimistic updates
- Request deduplication

### Configuration

**Location**: `App.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Disable refetch on focus (mobile)
        }
    }
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            {/* App components */}
        </QueryClientProvider>
    );
}
```

### Key Configuration Options

- **`refetchOnWindowFocus: false`** - Prevents refetching when app comes to foreground (mobile-specific)

### Usage in Hooks

**Location**: `app/entities/*/lib/hook/*.hook.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { UserService } from '../api/UserService';

export const useUser = (userId: string) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => UserService.getUser(userId),
    });

    return { user: data, isLoading, error };
};
```

### Query Keys

Query keys are used to identify and cache queries:

```typescript
// Single entity
['user', userId]

// List
['users']

// Nested
['chats', 'user']
['messages', 'chat', chatId]
```

### Mutations

For write operations (create, update, delete):

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PostService } from '../api/PostService';

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePostDto) => PostService.createPost(data),
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });
};
```

### Cache Invalidation

Invalidate cache to trigger refetch:

```typescript
// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['user', userId] });

// Invalidate all queries with prefix
queryClient.invalidateQueries({ queryKey: ['posts'] });

// Invalidate and refetch immediately
queryClient.invalidateQueries({
    queryKey: ['chats'],
    refetchType: 'active'
});
```

### Real Example: Global Messages Socket

**Location**: `app/entities/chats/lib/hooks/useGlobalMessagesSocket.ts`

```typescript
import { useQueryClient } from '@tanstack/react-query';

export function useGlobalMessagesSocket() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleNewMessage = (newMessage: Message) => {
            // Invalidate chat list
            queryClient.invalidateQueries({ queryKey: ['chats', 'user'] });

            // Invalidate messages for specific chat
            queryClient.invalidateQueries({
                queryKey: ['messages', 'chat', newMessage.chatId]
            });
        };

        messagesSocket.on('message:new', handleNewMessage);
    }, [queryClient]);
}
```

## React Context API

### Purpose

React Context is used for:
- Authentication state (user)
- Global app state
- Theme (if needed)
- Other client-side state

### AuthContext

**Location**: `app/processes/auth/providers/AuthProvider.tsx`

```typescript
import { createContext, useState } from 'react';

export const AuthContext = createContext<IAuthContext>({} as IAuthContext);

export const AuthProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
    const [user, setUser] = useState<TypeUserState>(null);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
```

### Using AuthContext

**Location**: `app/processes/auth/lib/hooks/auth.hook.ts`

```typescript
import { useContext } from 'react';
import { AuthContext } from '../../providers/AuthProvider';

export const useAuth = () => {
    const { user, setUser } = useContext(AuthContext);
    return { user, setUser };
};
```

### Usage in Components

```typescript
import { useAuth } from '@/processes/auth';

function MyComponent() {
    const { user, setUser } = useAuth();

    if (!user) {
        return <LoginScreen />;
    }

    return <div>Hello, {user.name}!</div>;
}
```

### Global Call Provider

**Location**: `app/entities/call/`

Manages call state globally:

```typescript
import { GlobalCallProvider } from '@/entities/call';

<GlobalCallProvider>
    <Navigation />
</GlobalCallProvider>
```

## State Management Patterns

### Server State (TanStack Query)

**Use for**:
- API data
- Lists (users, posts, chats)
- Entity details
- Any data from backend

**Example**:
```typescript
const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => PostService.getPosts(),
});
```

### Client State (React Context)

**Use for**:
- Authentication state
- UI state (modals, drawers)
- Theme preferences
- Global app settings

**Example**:
```typescript
const { user, setUser } = useAuth();
```

### Local Component State (useState)

**Use for**:
- Form inputs
- Toggle states
- Component-specific UI state

**Example**:
```typescript
const [isOpen, setIsOpen] = useState(false);
```

## Best Practices

### 1. Use TanStack Query for Server State

✅ **Do**:
```typescript
const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => UserService.getUser(userId),
});
```

❌ **Don't**:
```typescript
const [user, setUser] = useState(null);

useEffect(() => {
    UserService.getUser(userId).then(setUser);
}, [userId]);
```

### 2. Use React Context for Global Client State

✅ **Do**:
```typescript
// In provider
const [user, setUser] = useState(null);

// In component
const { user } = useAuth();
```

❌ **Don't**:
```typescript
// Don't use TanStack Query for client state
const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getUserFromStorage(), // This is client state!
});
```

### 3. Invalidate Cache After Mutations

✅ **Do**:
```typescript
const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
});
```

### 4. Use Consistent Query Keys

✅ **Do**:
```typescript
// Single entity
['user', userId]

// List
['users']

// Filtered list
['posts', { userId, status: 'published' }]
```

❌ **Don't**:
```typescript
// Inconsistent keys
['user']
['getUser']
['userData']
```

## Common Patterns

### Fetching Single Entity

```typescript
export const useUser = (userId: string) => {
    return useQuery({
        queryKey: ['user', userId],
        queryFn: () => UserService.getUser(userId),
        enabled: !!userId, // Only fetch if userId exists
    });
};
```

### Fetching List

```typescript
export const usePosts = () => {
    return useQuery({
        queryKey: ['posts'],
        queryFn: () => PostService.getPosts(),
    });
};
```

### Creating Entity

```typescript
export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePostDto) => PostService.createPost(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });
};
```

### Updating Entity

```typescript
export const useUpdatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdatePostDto }) =>
            PostService.updatePost(id, data),
        onSuccess: (_, { id }) => {
            // Invalidate both list and single entity
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', id] });
        },
    });
};
```

### Optimistic Updates

```typescript
export const useLikePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => PostService.likePost(postId),
        onMutate: async (postId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['post', postId] });

            // Snapshot previous value
            const previousPost = queryClient.getQueryData(['post', postId]);

            // Optimistically update
            queryClient.setQueryData(['post', postId], (old: PostDto) => ({
                ...old,
                likesCount: old.likesCount + 1,
                isLiked: true,
            }));

            return { previousPost };
        },
        onError: (err, postId, context) => {
            // Rollback on error
            queryClient.setQueryData(['post', postId], context.previousPost);
        },
        onSettled: (postId) => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
        },
    });
};
```

## Comparison with Web Version

| Aspect | Web Version | Mobile Version |
|--------|-------------|----------------|
| Server State | TanStack Query | TanStack Query ✅ |
| Client State | Redux Toolkit | React Context ✅ |
| Auth State | Redux | React Context ✅ |
| Global State | Redux | React Context ✅ |

**Why no Redux in mobile?**
- React Context is simpler for mobile apps
- Less boilerplate
- Sufficient for mobile app needs
- Better performance for smaller state

## Summary

The state management approach:
- **TanStack Query** for all server state (API data)
- **React Context** for global client state (auth, theme)
- **useState** for local component state
- No Redux (unlike web version)

This provides a clean, maintainable state management solution optimized for React Native.
