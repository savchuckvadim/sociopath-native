# API & Code Generation

## Overview

The app uses **Orval** to automatically generate TypeScript API client from the backend OpenAPI specification. This ensures type safety, automatic synchronization with backend changes, and eliminates manual API client maintenance.

## How It Works

1. **Backend** generates OpenAPI specification (Swagger) at `https://api.sociopath-network.ru/docs/api-json`
2. **Orval** reads the specification
3. **Orval** generates TypeScript code with types and functions for all endpoints
4. Generated code is placed in `app/api/generated/`

## Configuration

### Orval Config

**Location**: `orval.config.ts`

```typescript
export default {
    api: {
        // Source: OpenAPI specification URL
        input: 'https://api.sociopath-network.ru/docs/api-json',

        output: {
            // Target: where to generate code
            target: 'app/api/generated/api.ts',

            // HTTP client to use
            client: 'axios',

            // Code formatting
            prettier: true,

            // Generation mode: split by tags
            mode: 'tags-split',

            // Where to store TypeScript types (schemas)
            schemas: 'app/api/generated/model',

            // Custom axios instance
            override: {
                mutator: {
                    path: './app/api/lib/back-api.ts',
                    name: 'customAxios',
                },
            },
        },
    },
};
```

### Key Configuration Options

- **`input`**: URL to OpenAPI JSON specification
- **`target`**: Main generated API file
- **`client`**: HTTP client library (`axios`)
- **`mode`**: `tags-split` - generates separate files per API tag
- **`schemas`**: Directory for TypeScript types
- **`mutator`**: Custom axios instance for all requests

## Generating API Client

### Command

```bash
npm run api:generate
```

This runs Orval and generates/updates all API code.

### When to Generate

Generate API client after:
- Backend API changes
- New endpoints added
- DTOs modified
- Starting new development session

### Generated Files

After generation, the following structure is created:

```
app/api/generated/
├── auth/
│   └── auth.ts          # Authentication API
├── calls/
│   └── calls.ts         # Calls API
├── chats/
│   └── chats.ts         # Chats API
├── messages/
│   └── messages.ts      # Messages API
├── posts/
│   └── posts.ts         # Posts API
├── profile/
│   └── profile.ts       # Profile API
├── user/
│   └── user.ts          # User API
├── model/               # TypeScript types (DTOs)
│   ├── userDto.ts
│   ├── postDto.ts
│   ├── chatDto.ts
│   └── ...
└── index.ts             # Main export file
```

## Custom Axios Instance

### Location

`app/api/lib/back-api.ts`

### Purpose

Provides a configured axios instance with:
- Base URL configuration
- Request/response interceptors
- Error handling
- Custom response format handling

### Implementation

```typescript
import axios from 'axios';
import { SERVER_URL } from '@/config/api.config';

// Get base URL (handles Android emulator)
const getBaseUrl = () => {
    return SERVER_URL || "http://10.0.2.2:3000";
};

export const $api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true,
    headers: {
        'content-type': 'application/json',
        'X-BACK-API-KEY': '',
    },
});

// Setup interceptors
import { setupTokenInterceptor } from './interceptors/with-token.interceptor';
import { setupRefreshInterceptor } from './interceptors/refresh.interceptor';
import { setupErrorToastInterceptor } from './interceptors/error-toast.interceptor';

setupTokenInterceptor($api);
setupRefreshInterceptor($api);
setupErrorToastInterceptor($api);
```

### Custom Axios Function

```typescript
export const customAxios = async <T>({
    url,
    method,
    data,
    params,
    headers,
}: {
    url: string;
    method: Method;
    data?: any;
    params?: any;
    headers?: any;
}): Promise<T> => {
    const res = await $api.request<IBackResponse<T>>({
        url,
        method: method as Method,
        data,
        params,
        headers,
    });

    // Check result code
    if (res.data.resultCode !== EResultCode.SUCCESS) {
        throw new Error(res.data.message || `Backend error ${url}`);
    }

    // Return only data (not the wrapper)
    return res.data.data as T;
};
```

### Response Format

Backend returns responses in this format:

```typescript
interface IBackResponse<T> {
    resultCode: EResultCode; // 0 - success, 1 - error
    data?: T;                // Response data (on success)
    message?: string;        // Error message (on error)
    errors?: string[];       // Error details (on error)
}

enum EResultCode {
    SUCCESS = 0,
    ERROR = 1,
}
```

`customAxios` automatically:
- Checks `resultCode`
- Returns only `data` on success
- Throws error with `message` on failure

## Generated API Structure

### API Functions

Each API module exports functions for all endpoints:

```typescript
// app/api/generated/auth/auth.ts
export const getAuth = () => {
    const authMobileLogin = (loginDto: LoginDto) => {
        return customAxios<AuthenticatedUserDto>({
            url: `/api/auth-mobile/login`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: loginDto,
        });
    };

    const authRegistration = (createUserDto: CreateUserDto) => {
        return customAxios<AuthenticatedUserDto>({
            url: `/api/auth/registration`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: createUserDto,
        });
    };

    return {
        authMobileLogin,
        authRegistration,
        authLogout,
        authRefreshToken,
        authActivate,
        // ... other methods
    };
};
```

### TypeScript Types

All DTOs are generated as TypeScript interfaces:

```typescript
// app/api/generated/model/userDto.ts
export interface UserDto {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    // ... other fields
}

export interface CreateUserDto {
    email: string;
    password: string;
    name: string;
}

export interface AuthenticatedUserDto {
    user: UserDto;
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}
```

### Result Types

For each function, a result type is generated:

```typescript
export type AuthMobileLoginResult = NonNullable<
    Awaited<ReturnType<ReturnType<typeof getAuth>['authMobileLogin']>>
>;
```

## Usage in Code

### Importing API

```typescript
// Import API functions
import { getAuth, getPosts, getChats } from '@/api';

// Import types
import type { UserDto, PostDto, ChatDto } from '@/api';
```

### Using API in Services

```typescript
// app/processes/auth/lib/api/AuthService.ts
import { getAuth } from '@/api/generated/auth/auth';
import type { CreateUserDto } from '@/api';

export class AuthService {
    private api = getAuth();

    async login(email: string, password: string) {
        const response = await this.api.authMobileLogin({ email, password });
        // response is of type AuthenticatedUserDto
        return response.user;
    }

    async registration(user: CreateUserDto) {
        const response = await this.api.authRegistration(user);
        return response.user;
    }
}
```

### Using API in Hooks (with TanStack Query)

```typescript
// app/entities/user/lib/hook/user.hook.ts
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

### Using API in Components

```typescript
import { useMutation } from '@tanstack/react-query';
import { getAuth } from '@/api';

function LoginForm() {
    const authApi = getAuth();

    const loginMutation = useMutation({
        mutationFn: (data: { email: string; password: string }) =>
            authApi.authMobileLogin(data),
        onSuccess: (response) => {
            // Handle success
            console.log('Logged in:', response.user);
        },
    });

    const handleSubmit = (email: string, password: string) => {
        loginMutation.mutate({ email, password });
    };

    return (
        // Form JSX
    );
}
```

## Available API Modules

After generation, the following API modules are available:

- **`getAuth()`** - Authentication (login, register, logout, refresh, activate)
- **`getUser()`** - User management
- **`getPosts()`** - Posts (feed, create, like, repost)
- **`getChats()`** - Chats (list, create, update)
- **`getMessages()`** - Messages (send, get chat messages)
- **`getFollowers()`** - Followers (follow, unfollow, get followers)
- **`getProfile()`** - Profiles
- **`getCalls()`** - Calls (get LiveKit token)
- **`getTelegram()`** - Telegram integration

## API Configuration

### Base URL Configuration

**Location**: `app/config/api.config.ts`

```typescript
import { isDev } from "@/shared/lib/utils/is-dev.util";

export const SERVER_URL = isDev()
    ? process.env.DEV_API_URL
    : process.env.PROD_API_URL;

export const API_URL = `${SERVER_URL}/api`;
export const SOCKET_URL = SERVER_URL;
export const LIVEKIT_URL = process.env.LIVEKIT_URL || 'undefined';
```

### Environment Variables

Create `.env` file:

```env
DEV_API_URL=http://10.0.2.2:3000
PROD_API_URL=https://api.sociopath-network.ru
LIVEKIT_URL=https://ws.sociopath-network.ru
EXPO_PUBLIC_API_URL=https://api.sociopath-network.ru
```

**Note for Android Emulator**: Use `10.0.2.2` instead of `localhost` to access local development server.

## Mobile-Specific Endpoints

The mobile app uses special endpoints that differ from web:

### Authentication

- **Web**: `/api/auth/login` (uses cookies)
- **Mobile**: `/api/auth-mobile/login` (uses body)

### Token Refresh

- **Web**: `/api/auth/refresh` (uses cookies)
- **Mobile**: `/api/auth-mobile/refresh` (uses body with refreshToken)

### Why Different Endpoints?

- Mobile apps cannot use HttpOnly cookies
- Tokens are stored in AsyncStorage
- Tokens are sent in request body or headers

## Interceptors Integration

The generated API uses `customAxios`, which has interceptors configured:

1. **Token Interceptor** - Adds access token to requests
2. **Refresh Interceptor** - Handles 401 and refreshes token
3. **Error Toast Interceptor** - Shows error messages

All generated API calls automatically benefit from these interceptors.

## Type Safety

### Benefits

1. **Compile-time checking** - TypeScript catches errors before runtime
2. **Autocomplete** - IDE knows all available methods and types
3. **Refactoring safety** - Changes propagate automatically
4. **Documentation** - Types serve as inline documentation

### Example

```typescript
import { getAuth } from '@/api';
import type { LoginDto } from '@/api';

const authApi = getAuth();

// ✅ TypeScript knows the exact type
const response = await authApi.authMobileLogin({
    email: 'user@example.com',
    password: 'password123',
});
// response is AuthenticatedUserDto

// ❌ TypeScript error - wrong type
await authApi.authMobileLogin({
    email: 123, // Error: expected string
    password: 'password',
});
```

## Updating API

### Workflow

1. **Backend changes** - Developer modifies API
2. **Swagger updates** - Backend regenerates OpenAPI spec
3. **Generate client** - Run `npm run api:generate`
4. **Review changes** - Check generated files
5. **Update code** - Fix any breaking changes in app code
6. **Test** - Verify everything works

### Important Notes

⚠️ **DO NOT edit files in `app/api/generated/`** - They will be overwritten on next generation!

If you need to customize behavior:
- Modify `customAxios` in `app/api/lib/back-api.ts`
- Modify interceptors in `app/api/lib/interceptors/`
- Change Orval config in `orval.config.ts`

## Troubleshooting

### Generation Fails

**Problem**: Orval cannot connect to OpenAPI endpoint

**Solution**:
- Check that backend is running
- Verify OpenAPI URL is accessible
- Check network connectivity

### Types Are Outdated

**Problem**: Generated types don't match backend

**Solution**:
- Run `npm run api:generate` again
- Clear cache if needed: `npm run clean`

### Import Errors

**Problem**: Cannot import from `@/api`

**Solution**:
- Check `app/api/index.ts` exports
- Verify path aliases in `tsconfig.json`
- Ensure generation completed successfully

## Best Practices

1. **Always generate after backend changes** - Keep API in sync
2. **Use types from generated code** - Don't redefine types manually
3. **Use services layer** - Wrap API calls in services (FSD entities)
4. **Handle errors properly** - Use try-catch or TanStack Query error handling
5. **Don't modify generated code** - Use interceptors or services for customization

## Summary

The API code generation system provides:
- **Type safety** - All types generated automatically
- **Synchronization** - Always in sync with backend
- **Developer experience** - Autocomplete and compile-time checking
- **Maintainability** - No manual API client code to maintain

All API code is generated from the backend OpenAPI specification, ensuring consistency and reducing errors.
