# Аутентификация (Auth)

## Обзор

Система аутентификации использует JWT токены (access token + refresh token) с хранением в HttpOnly cookies для безопасности.

## Архитектура

Аутентификация реализована в слое `processes/auth/` согласно FSD архитектуре:

```
modules/processes/auth/
├── index.ts              # Public API
├── lib/
│   ├── api/
│   │   └── AuthService.ts    # Сервис для работы с API
│   ├── hooks/
│   │   └── auth.hook.ts      # React хук useAuth()
│   └── utils/
│       └── api-error.util.ts # Обработка ошибок API
├── model/
│   ├── AuthSlice.ts          # Redux slice
│   └── AuthThunk.ts          # Redux thunks (async actions)
├── type/
│   └── auth.type.ts          # TypeScript типы
└── ui/
    ├── LoginForm/            # Форма входа
    ├── RegistredForm/         # Форма регистрации
    └── Logout/               # Компонент выхода
```

## Токены

### Access Token

- **Назначение**: Авторизация запросов к API
- **Время жизни**: Короткое (обычно 15 минут)
- **Хранение**: HttpOnly cookie (безопасно, недоступен из JavaScript)
- **Имя cookie**: `accessToken`

### Refresh Token

- **Назначение**: Обновление access token при истечении
- **Время жизни**: Длинное (обычно 7 дней)
- **Хранение**: HttpOnly cookie (безопасно, недоступен из JavaScript)
- **Имя cookie**: `refreshToken`

### Почему HttpOnly cookies?

1. **Безопасность**: JavaScript не может получить доступ к токенам (защита от XSS)
2. **Автоматическая отправка**: Браузер автоматически отправляет cookies с каждым запросом
3. **Защита от CSRF**: Используется SameSite атрибут (настраивается на backend)

## Next.js Middleware

### Расположение

`apps/front/middleware.ts`

### Назначение

Middleware выполняется на сервере **перед рендерингом страницы** и:
- Проверяет наличие токенов в cookies
- Редиректит пользователя на нужную страницу
- Защищает роуты от неавторизованного доступа

### Код Middleware

```typescript
import { AUTH_ACCESS_TOKEN_NAME_PUBLIC, AUTH_REFRESH_TOKEN_NAME_PUBLIC } from '@workspace/nest-api';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    // Получаем токены из cookies
    const accessToken = await req.cookies.get(AUTH_ACCESS_TOKEN_NAME_PUBLIC);
    const refreshToken = await req.cookies.get(AUTH_REFRESH_TOKEN_NAME_PUBLIC);

    const hasToken = accessToken || refreshToken;
    const url = req.nextUrl;

    // Определяем тип страницы
    const isConfirmPage = url.pathname.startsWith('/auth/confirm');
    const isAuthPage = url.pathname.startsWith('/auth') && !isConfirmPage;
    const isProtected = url.pathname.startsWith('/network');
    const isUndefinedPath = !isAuthPage && !isProtected && !isConfirmPage;

    // Если нет токена и пытается зайти на защищенную страницу → редирект на логин
    if (!hasToken && (isProtected || isUndefinedPath)) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Если есть токен и на странице авторизации → редирект на профиль
    if (hasToken && (isAuthPage || isUndefinedPath)) {
        return NextResponse.redirect(new URL('/network/me', req.url));
    }

    // Если нет токена и на странице авторизации → пропускаем
    if (!hasToken && isAuthPage || isConfirmPage) {
        return NextResponse.next();
    }

    // Если есть токен → пропускаем
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
        '/network/:path*',
        '/auth/:path*',
    ],
};
```

### Логика редиректов

| Условие | Токен | Страница | Действие |
|---------|-------|----------|----------|
| Нет токена | ❌ | `/network/*` | → `/auth/login` |
| Нет токена | ❌ | `/` (undefined) | → `/auth/login` |
| Есть токен | ✅ | `/auth/login` | → `/network/me` |
| Есть токен | ✅ | `/` (undefined) | → `/network/me` |
| Нет токена | ❌ | `/auth/*` | ✅ Пропустить |
| Есть токен | ✅ | `/network/*` | ✅ Пропустить |

## Axios Interceptor - Автоматическое обновление токена

### Расположение

`packages/nest-api/src/lib/back-api.ts`

### Как работает?

1. **Пользователь делает запрос** к API
2. **Получает 401 Unauthorized** (access token истек)
3. **Response interceptor перехватывает ошибку**
4. **Проверяет**, что это не запрос на `/auth/refresh`
5. **Делает запрос на `/api/auth/refresh`** (использует refresh token из cookie)
6. **Если успешно** → повторяет оригинальный запрос
7. **Если не успешно** → выбрасывает ошибку

### Код Interceptor

```typescript
$api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const isRefresh = error.response.request.responseURL.includes('auth/refresh');

        // Если получили 401 и это не запрос на refresh
        if (error.response.status === 401 && error.config && !isRefresh) {
            const originalRequest = error.config;

            try {
                // Пытаемся обновить токен
                const res = await $api.post('/api/auth/refresh');

                if (res.data.resultCode === EResultCode.SUCCESS) {
                    // Повторяем оригинальный запрос
                    return $api(originalRequest);
                }
            } catch (e) {
                console.log('НЕ АВТОРИЗОВАН');
                // Если refresh не удался, пользователь будет перенаправлен
            }
        }

        throw error;
    }
);
```

### Важные моменты

1. **Проверка на цикл**: Interceptor проверяет, что это не запрос на refresh, чтобы избежать бесконечного цикла
2. **Автоматический retry**: После успешного refresh оригинальный запрос повторяется автоматически
3. **Прозрачность**: Пользователь не замечает обновление токена

## Redux State Management

### Auth Slice

Расположение: `modules/processes/auth/model/AuthSlice.ts`

```typescript
interface IAuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    currentUser: UserDto | null;
}
```

### Auth Thunks

Расположение: `modules/processes/auth/model/AuthThunk.ts`

Доступные thunks:
- `loginThunk(form)` - вход в систему
- `registerThunk(form)` - регистрация
- `logoutThunk()` - выход из системы
- `checkAuthThunk()` - проверка авторизации (refresh token)

### Автоматические редиректы после действий

После успешных действий происходят автоматические редиректы:

```typescript
// После успешного логина
builder.addCase(loginThunk.fulfilled, (state, action) => {
    state.isAuthenticated = true;
    state.currentUser = action.payload;
    if (action.payload) {
        window.location.href = '/network/me'; // → Профиль
    } else {
        window.location.href = '/auth/confirm'; // → Подтверждение email
    }
});

// После успешной регистрации
builder.addCase(registerThunk.fulfilled, (state, action) => {
    state.isAuthenticated = true;
    state.currentUser = action.payload;
    window.location.href = '/auth/confirm'; // → Подтверждение email
});

// После выхода
builder.addCase(logoutThunk.fulfilled, (state) => {
    state.isAuthenticated = false;
    state.currentUser = null;
    window.location.href = '/auth/login'; // → Страница входа
});
```

## React Hook - useAuth

### Расположение

`modules/processes/auth/lib/hooks/auth.hook.ts`

**Примечание**: В проекте используется соглашение об именовании хуков с суффиксом `.hook.ts`.

### Использование

```typescript
import { useAuth } from '@/modules/processes/auth';

function MyComponent() {
    const {
        currentUser,      // Текущий пользователь
        isAuthenticated,  // Статус авторизации
        isLoading,        // Загрузка
        error,            // Ошибка
        login,            // Функция входа
        register,         // Функция регистрации
        logout,           // Функция выхода
        clearError        // Очистка ошибки
    } = useAuth();

    return (
        <div>
            {isAuthenticated ? (
                <p>Привет, {currentUser?.name}!</p>
            ) : (
                <button onClick={() => login({ email, password })}>Войти</button>
            )}
        </div>
    );
}
```

## Auth Service

### Расположение

`modules/processes/auth/lib/api/AuthService.ts`

### Методы

```typescript
class AuthService {
    async login(email: string, password: string)
    async registration(user: CreateUserDto)
    async activate(link: string)
    async logout()
    async refreshToken()
}
```

### Использование

```typescript
const authService = new AuthService();
const response = await authService.login('user@example.com', 'password');
// response содержит { user, tokens }
// tokens автоматически сохраняются в cookies на backend
```

## Страницы аутентификации

### `/auth/login` - Вход

- **Компонент**: `app/auth/login/page.tsx`
- **Форма**: `modules/processes/auth/ui/LoginForm/LoginForm.tsx`
- **Действие**: Вызывает `loginThunk` → редирект на `/network/me` или `/auth/confirm`

### `/auth/register` - Регистрация

- **Компонент**: `app/auth/register/page.tsx`
- **Форма**: `modules/processes/auth/ui/RegistredForm/RegistredForm.tsx`
- **Действие**: Вызывает `registerThunk` → редирект на `/auth/confirm`

### `/auth/confirm` - Подтверждение email

- **Компонент**: `app/auth/confirm/page.tsx`
- **Действие**: Активация аккаунта по ссылке из email

## Поток аутентификации

### Регистрация

```
1. Пользователь заполняет форму регистрации
2. Вызывается registerThunk
3. Backend создает пользователя и отправляет email с ссылкой активации
4. Токены сохраняются в HttpOnly cookies
5. Редирект на /auth/confirm
6. Пользователь переходит по ссылке из email
7. Backend активирует аккаунт
8. Пользователь может войти
```

### Вход

```
1. Пользователь заполняет форму входа
2. Вызывается loginThunk
3. Backend проверяет credentials
4. Токены сохраняются в HttpOnly cookies
5. Редирект на /network/me (или /auth/confirm если не активирован)
```

### Автоматическое обновление токена

```
1. Пользователь делает запрос к API
2. Access token истек → получаем 401
3. Axios interceptor перехватывает ошибку
4. Делаем запрос на /api/auth/refresh (refresh token в cookie)
5. Получаем новые токены (сохраняются в cookies)
6. Повторяем оригинальный запрос
7. Пользователь не замечает обновление
```

### Выход

```
1. Пользователь нажимает "Выйти"
2. Вызывается logoutThunk
3. Backend удаляет refresh token из БД
4. Cookies очищаются
5. Редирект на /auth/login
```

## Защита роутов

### На уровне Middleware

Middleware автоматически защищает все роуты `/network/*`:
- Если нет токена → редирект на `/auth/login`
- Если есть токен → пропускает

### На уровне компонентов

Для дополнительной защиты можно использовать проверку в компонентах:

```typescript
import { useAuth } from '@/modules/processes/auth';

export default function ProtectedPage() {
    const { isAuthenticated, currentUser } = useAuth();

    if (!isAuthenticated) {
        return <LoadingScreen />;
    }

    return <div>Защищенный контент</div>;
}
```

## Безопасность

### Защита от XSS

- Токены хранятся в HttpOnly cookies → JavaScript не может получить к ним доступ
- Даже если злоумышленник внедрит вредоносный код, он не сможет украсть токены

### Защита от CSRF

- Backend настраивает SameSite атрибут для cookies
- Cookies отправляются только с запросами к тому же домену

### Короткое время жизни access token

- Access token живет 15 минут
- При истечении автоматически обновляется через refresh token
- Если refresh token истек → пользователь должен войти заново

## Отладка

### Проверка токенов в браузере

1. Откройте DevTools → Application → Cookies
2. Найдите cookies `accessToken` и `refreshToken`
3. Проверьте их наличие и срок действия

### Проверка состояния в Redux

1. Откройте Redux DevTools
2. Найдите slice `auth`
3. Проверьте состояние: `isAuthenticated`, `currentUser`, `error`

### Логирование

Axios interceptor логирует ошибки в консоль:
- `console.log('НЕ АВТОРИЗОВАН')` - если refresh token недействителен
