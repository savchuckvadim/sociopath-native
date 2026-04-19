# Authentication

## Overview

The authentication system uses JWT tokens (access token + refresh token) stored in secure storage (AsyncStorage/SecureStore). Unlike the web version which uses HttpOnly cookies, the mobile app stores tokens in local storage for better mobile compatibility.

## Architecture

Authentication is implemented in the `processes/auth/` layer according to FSD architecture:

```
app/processes/auth/
├── index.ts              # Public API
├── lib/
│   ├── api/
│   │   └── AuthService.ts        # Service for working with API
│   ├── hooks/
│   │   ├── auth.hook.ts          # React hook useAuth()
│   │   ├── auth-check.hook.tsx   # Authentication check hook
│   │   ├── auth-logout.hook.ts   # Logout hook
│   │   └── auth-mutations.hook.ts # Auth mutations hook
│   ├── services/
│   │   └── auth-global.service.ts # Global auth service for interceptors
│   └── utils/
│       └── api-error.util.ts      # API error handling
├── providers/
│   └── AuthProvider.tsx          # React Context provider
├── type/
│   └── auth.type.ts              # TypeScript types
└── ui/
    ├── LoginForm/                # Login form
    ├── RegisterForm/             # Registration form
    └── Logout/                   # Logout component
```

## Tokens

### Access Token

- **Purpose**: Authorization for API requests
- **Lifetime**: Short (typically 15 minutes)
- **Storage**: AsyncStorage (key: `accessToken`)
- **Usage**: Automatically attached to requests via interceptor

### Refresh Token

- **Purpose**: Refresh access token when it expires
- **Lifetime**: Long (typically 7 days)
- **Storage**: AsyncStorage (key: `refreshToken`)
- **Usage**: Used to get new access token when current one expires

### Why AsyncStorage?

Unlike the web version which uses HttpOnly cookies:
1. **Mobile Compatibility**: AsyncStorage works consistently across iOS and Android
2. **Expo Support**: Works seamlessly with Expo
3. **Secure Storage Option**: Can use Expo SecureStore for sensitive data (tokens are stored in AsyncStorage for simplicity)

## Token Storage

### Storage Functions

Located in `app/api/lib/auth/helper-storage.api.ts`:

```typescript
// Get access token
export const getAccessToken = async (): Promise<string | null>

// Save tokens
export const saveTokensToStorage = async (tokens: ITokens): Promise<void>

// Remove tokens
export const removeTokensFromStorage = async (): Promise<void>

// Get user from storage
export const getUserFromStorage = async (): Promise<IUser | null>

// Save user to storage
export const saveToStorage = async (data: IAuthResponse): Promise<void>

// Clear all storage
export const clearStorage = async (): Promise<void>
```

### Storage Keys

Defined in `app/api/lib/auth/auth.type.ts`:

```typescript
export enum EnumAuthType {
    ACCESS_TOKEN = 'accessToken',
    REFRESH_TOKEN = 'refreshToken',
}

export enum EnumAsynStorage {
    USER = 'user',
}
```

## Authentication Flow

### Registration

```
1. User fills registration form
2. AuthService.registration() called
3. Backend creates user and sends email with activation link
4. Tokens received and saved to AsyncStorage
5. User data saved to AsyncStorage
6. User state updated in AuthContext
7. User redirected to home screen
```

### Login

```
1. User fills login form
2. AuthService.login() called
3. Backend validates credentials
4. Tokens received and saved to AsyncStorage
5. User data saved to AsyncStorage
6. User state updated in AuthContext
7. User redirected to home screen
```

### Automatic Token Refresh

```
1. User makes API request
2. Access token expired → receives 401
3. Refresh interceptor intercepts error
4. Checks that it's not a refresh request
5. Calls getNewTokens() with refresh token
6. If successful → new tokens saved, original request retried
7. If failed → tokens removed, user redirected to login
```

### Logout

```
1. User clicks logout
2. AuthService.logout() called
3. Backend invalidates refresh token
4. All tokens and user data removed from AsyncStorage
5. User state cleared in AuthContext (setUser(null))
6. User redirected to login screen
```

## AuthService

### Location

`app/processes/auth/lib/api/AuthService.ts`

### Methods

```typescript
class AuthService {
    // Login with email and password
    async login(email: string, password: string): Promise<IUser>

    // Register new user
    async registration(user: CreateUserDto): Promise<IUser>

    // Activate account via email link
    async activate(link: string): Promise<any>

    // Logout (invalidates refresh token on server)
    async logout(): Promise<boolean>

    // Refresh access token
    async refreshToken(): Promise<any>
}
```

### Usage

```typescript
import { AuthService } from '@/processes/auth/lib/api/AuthService';

const authService = new AuthService();

// Login
const user = await authService.login('user@example.com', 'password123');

// Registration
const newUser = await authService.registration({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe',
});

// Logout
await authService.logout();
```

## React Context - AuthProvider

### Location

`app/processes/auth/providers/AuthProvider.tsx`

### Purpose

Provides authentication state to the entire application through React Context.

### Implementation

```typescript
export const AuthContext = createContext<IAuthContext>({} as IAuthContext);

export const AuthProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
    const [user, setUser] = useState<TypeUserState>(null);

    useEffect(() => {
        // Check for existing access token on mount
        const checkAccessToken = async () => {
            const accessToken = await getAccessToken();
            if (accessToken) {
                const user = await getUserFromStorage();
                setUser(user);
            }
        };
        checkAccessToken();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
```

### Usage

```typescript
import { AuthProvider } from '@/processes/auth/providers/AuthProvider';

// In App.tsx
<AuthProvider>
    <Navigation />
</AuthProvider>
```

## React Hook - useAuth

### Location

`app/processes/auth/lib/hooks/auth.hook.ts`

### Usage

```typescript
import { useAuth } from '@/processes/auth';

function MyComponent() {
    const { user, setUser } = useAuth();

    return (
        <div>
            {user ? (
                <p>Hello, {user.name}!</p>
            ) : (
                <p>Please login</p>
            )}
        </div>
    );
}
```

### Return Value

```typescript
{
    user: IUser | null;      // Current user object or null
    setUser: (user: IUser | null) => void; // Function to update user state
}
```

## Axios Interceptors

### 1. Token Interceptor

**Location**: `app/api/lib/interceptors/with-token.interceptor.ts`

**Purpose**: Automatically adds access token to all API requests.

**Implementation**:

```typescript
export const setupTokenInterceptor = (api: AxiosInstance) => {
    api.interceptors.request.use(async (config) => {
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
};
```

**How it works**:
1. Intercepts all outgoing requests
2. Gets access token from AsyncStorage
3. Adds `Authorization: Bearer <token>` header
4. Continues with request

### 2. Refresh Interceptor

**Location**: `app/api/lib/interceptors/refresh.interceptor.ts`

**Purpose**: Handles 401 errors and automatically refreshes access token.

**Implementation**:

```typescript
export const setupRefreshInterceptor = (api: AxiosInstance) => {
    api.interceptors.response.use(
        (config) => config,
        async (error) => {
            // Only handle 401 errors
            if (error.response?.status === 401 && !originalRequest._isRetry) {
                originalRequest._isRetry = true;

                try {
                    // Try to refresh token
                    await getNewTokens();
                    // Retry original request
                    return api.request(originalRequest);
                } catch (refreshError) {
                    // Refresh failed - check if it's a token error
                    if (isTokenError(refreshError)) {
                        // Remove tokens and trigger logout
                        await removeTokensFromStorage();
                        await authGlobalService.forceLogout('Refresh token invalid/expired');
                    }
                    throw refreshError;
                }
            }
            throw error;
        }
    );
};
```

**How it works**:
1. Intercepts 401 (Unauthorized) responses
2. Checks that it's not already a retry
3. Calls `getNewTokens()` to refresh access token
4. If successful → retries original request
5. If failed → removes tokens and triggers logout

### 3. Error Toast Interceptor

**Location**: `app/api/lib/interceptors/error-toast.interceptor.ts`

**Purpose**: Shows error messages to users via Toast notifications.

**Implementation**:

```typescript
export const setupErrorToastInterceptor = (api: AxiosInstance) => {
    api.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            // Skip errors that are already handled
            const isAlreadyHandled = (error.config as any)?._skipErrorToast;

            if (!isAlreadyHandled && error.response) {
                const errorMessage = errorCatch(error);
                Toast.show({
                    type: 'error',
                    text1: 'Ошибка',
                    text2: errorMessage,
                });
            }
            return Promise.reject(error);
        }
    );
};
```

**How it works**:
1. Intercepts all error responses
2. Checks if error should be shown (not already handled)
3. Extracts error message
4. Shows Toast notification
5. Re-throws error for component handling

## Global Auth Service

### Location

`app/processes/auth/lib/services/auth-global.service.ts`

### Purpose

Allows low-level modules (like interceptors) to trigger logout and update user state without direct access to React Context. This bridges the gap between interceptors (which are not React components) and React Context.

### Implementation

```typescript
class AuthGlobalService {
    private setUserCallback: SetUserCallback | null = null;
    private isLoggingOut = false;

    // Register setUser callback from AuthProvider
    registerSetUser(callback: SetUserCallback): void

    // Unregister callback
    unregisterSetUser(): void

    // Force logout (called from interceptors)
    async forceLogout(reason?: string): Promise<void>

    // Check if logout is in progress
    getIsLoggingOut(): boolean
}
```

### Usage

**In AuthProvider**:
```typescript
useEffect(() => {
    // Register setUser callback
    authGlobalService.registerSetUser(setUser);

    return () => {
        // Unregister on unmount
        authGlobalService.unregisterSetUser();
    };
}, []);
```

**In Refresh Interceptor**:
```typescript
if (isRefreshTokenError) {
    await removeTokensFromStorage();
    await authGlobalService.forceLogout('Refresh token invalid/expired');
}
```

## Token Refresh Function

### Location

`app/api/lib/auth/helper-auth.api.ts`

### Implementation

```typescript
export const getNewTokens = async () => {
    const refreshToken = await AsyncStorage.getItem(EnumAuthType.REFRESH_TOKEN);

    if (!refreshToken) {
        throw new Error('No refresh token');
    }

    // Use mobile-specific endpoint
    const response = await axios.post(
        API_URL + '/auth-mobile/refresh',
        { refreshToken }, // Token in body for mobile
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (response.data?.tokens?.accessToken && response.data?.tokens?.refreshToken) {
        // Save new tokens
        await saveTokensToStorage({
            accessToken: response.data.tokens.accessToken,
            refreshToken: response.data.tokens.refreshToken,
        });

        return {
            accessToken: response.data.tokens.accessToken,
            refreshToken: response.data.tokens.refreshToken,
            user: response.data.user,
        };
    }

    throw new Error('Invalid response from refresh endpoint');
};
```

### Key Points

- Uses mobile-specific endpoint `/auth-mobile/refresh`
- Sends refresh token in request body (not cookies)
- Returns new tokens and user data
- Saves tokens to AsyncStorage

## Authentication Check Hook

### Location

`app/processes/auth/lib/hooks/auth-check.hook.tsx`

### Purpose

Performs authentication checks on app startup and route changes.

### Implementation

```typescript
export const useAuthCheck = (
    routeName?: string,
    navigationRef?: React.RefObject<NavigationContainerRef<TypeRootStackParamList>>
) => {
    const { user, setUser } = useAuth();

    // Check auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = await getAccessToken();
            if (!accessToken) return;

            try {
                await getNewTokens();
            } catch (error) {
                if (isTokenError(error)) {
                    await authService.logout();
                    setUser(null);
                }
            }
        };
        checkAuth();
    }, []);

    // Check refresh token on route change
    useEffect(() => {
        const checkRefreshToken = async () => {
            const refreshToken = await AsyncStorage.getItem(EnumAuthType.REFRESH_TOKEN);

            if (!refreshToken && user) {
                await authService.logout();
                setUser(null);
            } else if (!refreshToken && !user) {
                // Redirect to login
                if (navigationRef?.current?.isReady()) {
                    navigationRef.current.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'Auth' }],
                        })
                    );
                }
            }
        };
        checkRefreshToken();
    }, [routeName]);
};
```

## Protected Routes

### Implementation

Routes are protected at the navigation level in `app/processes/navigation/ui/components/PrivateNavigator.tsx`:

```typescript
export const PrivateNavigator = () => {
    const { user } = useAuth();

    return (
        <Stack.Navigator>
            {user ? (
                // Show private routes
                routes.map((route) => (
                    <Stack.Screen key={route.name} {...route} />
                ))
            ) : (
                // Show auth screen
                <Stack.Screen name="Auth" component={Auth} />
            )}
        </Stack.Navigator>
    );
};
```

### How it works

- If `user` exists → show private routes
- If `user` is null → show Auth screen
- Automatically updates when `user` state changes

## Error Handling

### Token Errors

Defined in `app/api/lib/auth/auth-errors.const.ts`:

```typescript
export const AUTH_ERRORS = {
    INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
    EXPIRED_REFRESH_TOKEN: 'EXPIRED_REFRESH_TOKEN',
    NO_REFRESH_TOKEN: 'No refresh token',
    // ... other errors
};

export const isTokenError = (message: string): boolean => {
    return Object.values(AUTH_ERRORS).some(error =>
        message.includes(error)
    );
};
```

### Error Flow

1. **401 Error** → Refresh interceptor tries to refresh token
2. **Refresh Success** → Request retried
3. **Refresh Failure (Token Error)** → Tokens removed, logout triggered
4. **Refresh Failure (Other Error)** → Error thrown, Toast shown

## Security Considerations

### Token Storage

- Tokens stored in AsyncStorage (not encrypted by default)
- Consider using Expo SecureStore for production
- Tokens are cleared on logout

### Token Lifetime

- Access token: 15 minutes (short-lived for security)
- Refresh token: 7 days (long-lived for convenience)
- Automatic refresh prevents user interruption

### Network Security

- All API requests use HTTPS in production
- Tokens sent in `Authorization` header (not cookies)
- Refresh token sent in request body for mobile endpoint

## Debugging

### Check Tokens in Storage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnumAuthType } from '@/api/lib/auth/auth.type';

const accessToken = await AsyncStorage.getItem(EnumAuthType.ACCESS_TOKEN);
const refreshToken = await AsyncStorage.getItem(EnumAuthType.REFRESH_TOKEN);
console.log('Access Token:', accessToken);
console.log('Refresh Token:', refreshToken);
```

### Check User State

```typescript
import { useAuth } from '@/processes/auth';

const { user } = useAuth();
console.log('Current User:', user);
```

### Log Interceptor Activity

Interceptors log their activity to console:
- `🔄 Refresh interceptor: Attempting to refresh token...`
- `🔄 Refresh interceptor: Token refreshed, retrying request...`
- `🔐 AuthGlobalService: Force logout called`

## Summary

The authentication system provides:
- Secure token storage
- Automatic token refresh
- Seamless user experience
- Proper error handling
- Global logout capability

All authentication logic is centralized in `processes/auth/` following FSD architecture principles.
