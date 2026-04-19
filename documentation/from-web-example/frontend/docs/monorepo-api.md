# Монорепо и API - Кодогенерация с Orval

## Обзор монорепо

Проект организован как **монорепозиторий** с использованием:
- **pnpm workspaces** - управление зависимостями
- **Turbo** - сборка и кэширование
- **Workspace packages** - общие пакеты между приложениями

## Структура монорепо

```
auth-mono/
├── apps/
│   ├── api/          # Backend (NestJS)
│   └── front/        # Frontend (Next.js)
├── packages/
│   ├── nest-api/     # ⭐ Генерируемый API клиент
│   ├── ui/           # Общие UI компоненты
│   ├── theme/        # Тема приложения
│   ├── ws/           # WebSocket клиент
│   └── ...
```

## Пакет @workspace/nest-api

### Назначение

Пакет `@workspace/nest-api` содержит:
- **Генерируемый API клиент** - автоматически созданный из OpenAPI спецификации
- **Типы TypeScript** - типы для всех DTO и ответов API
- **Custom Axios** - настроенный axios с interceptors
- **Константы** - константы для работы с API

### Расположение

```
packages/nest-api/
├── src/
│   ├── generated/        # ⚠️ Генерируемый код (не редактировать!)
│   │   ├── auth/        # API для аутентификации
│   │   ├── posts/       # API для постов
│   │   ├── chats/       # API для чатов
│   │   ├── messages/    # API для сообщений
│   │   ├── calls/       # API для звонков
│   │   ├── model/       # TypeScript типы (DTO)
│   │   └── index.ts     # Экспорт всех API
│   ├── lib/
│   │   └── back-api.ts  # Custom Axios с interceptors
│   └── consts/
│       └── auth.consts.ts
├── orval.config.ts      # Конфигурация Orval
└── package.json
```

## Orval - Кодогенерация API

### Что такое Orval?

**Orval** - инструмент для автоматической генерации TypeScript клиента из OpenAPI/Swagger спецификации.

### Как это работает?

1. **Backend** (NestJS) генерирует OpenAPI спецификацию через Swagger
2. **Orval** читает спецификацию по адресу `http://localhost:3000/docs/api-json`
3. **Orval** генерирует TypeScript код с типами и функциями для всех endpoints
4. Генерируемый код попадает в `packages/nest-api/src/generated/`

### Конфигурация Orval

Файл `packages/nest-api/orval.config.ts`:

```typescript
export default {
    api: {
        // Откуда брать OpenAPI спецификацию
        input: 'http://localhost:3000/docs/api-json',

        output: {
            // Куда генерировать код
            target: 'src/generated/api.ts',

            // Какой HTTP клиент использовать
            client: 'axios',

            // Форматирование кода
            prettier: true,

            // Режим генерации (разделение по тегам)
            mode: 'tags-split',

            // Где хранить схемы (типы)
            schemas: 'src/generated/model',

            // Кастомный axios instance
            override: {
                mutator: {
                    path: './src/lib/back-api.ts',
                    name: 'customAxios',
                },
            },
        },
    },
};
```

### Запуск генерации

```bash
# Из корня монорепо
cd packages/nest-api
pnpm generate

# Или из корня проекта
pnpm --filter @workspace/nest-api generate
```

### Что генерируется?

#### 1. API функции

Для каждого endpoint создается функция:

```typescript
// packages/nest-api/src/generated/auth/auth.ts
export const getAuth = () => {
    const authLogin = (loginDto: LoginDto) => {
        return customAxios<AuthenticatedUserDto>({
            url: `/api/auth/login`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: loginDto,
        });
    };

    return {
        authLogin,
        authRegistration,
        authLogout,
        // ...
    };
};
```

#### 2. TypeScript типы

Для всех DTO создаются типы:

```typescript
// packages/nest-api/src/generated/model/userDto.ts
export interface UserDto {
    id: string;
    email: string;
    name: string;
    // ...
}
```

#### 3. Типы результатов

Для каждой функции создается тип результата:

```typescript
export type AuthLoginResult = NonNullable<
    Awaited<ReturnType<ReturnType<typeof getAuth>['authLogin']>>
>;
```

## Custom Axios - Interceptors

### Расположение

`packages/nest-api/src/lib/back-api.ts`

### Что делает?

1. **Создает axios instance** с базовыми настройками
2. **Настраивает interceptors** для автоматической обработки ошибок
3. **Обрабатывает refresh token** при 401 ошибке

### Код Custom Axios

```typescript
const $api = axios.create({
    baseURL: url, // 'https://api.sociopath-network.ru'
    withCredentials: true, // Отправка cookies
    headers: headers,
});

// Response Interceptor - обработка 401 ошибок
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

### Как работает refresh token?

1. **Пользователь делает запрос** → получает 401 (токен истек)
2. **Interceptor перехватывает ошибку** → проверяет, что это не запрос на refresh
3. **Делает запрос на `/api/auth/refresh`** → использует refresh token из cookie
4. **Если успешно** → повторяет оригинальный запрос с новым токеном
5. **Если не успешно** → выбрасывает ошибку (пользователь будет перенаправлен на логин)

### Формат ответа

Backend возвращает ответ в формате:

```typescript
interface IBackResponse<T> {
    resultCode: EResultCode; // 0 - успех, 1 - ошибка
    data?: T;                // данные ответа
    message?: string;        // сообщение ошибки
    errors?: string[];       // ошибки
}
```

`customAxios` автоматически:
- Проверяет `resultCode`
- Возвращает только `data` при успехе
- Выбрасывает ошибку при `resultCode !== 0`

## Использование в модулях

### Импорт API

```typescript
import { getAuth, getPosts, getCalls } from '@workspace/nest-api';
import type { UserDto, PostDto } from '@workspace/nest-api';
```

### Пример использования

```typescript
// 1. Получаем API клиент
const authApi = getAuth();

// 2. Вызываем метод
const response = await authApi.authLogin({
    email: 'user@example.com',
    password: 'password123'
});

// response имеет тип AuthenticatedUserDto
console.log(response.user);
console.log(response.tokens);
```

### В React компонентах

```typescript
import { useQuery } from '@tanstack/react-query';
import { getPosts } from '@workspace/nest-api';

export const usePosts = () => {
    const postsApi = getPosts();

    return useQuery({
        queryKey: ['posts'],
        queryFn: () => postsApi.postGetFeed({}),
    });
};
```

### В сервисах (FSD entities)

```typescript
// entities/post/lib/api/post.service.ts
import { getPosts } from '@workspace/nest-api';

export class PostService {
    private api = getPosts();

    async getFeed() {
        return await this.api.postGetFeed({});
    }

    async createPost(data: CreatePostDto) {
        return await this.api.postCreatePost(data);
    }
}
```

## Доступные API модули

После генерации доступны следующие API:

- `getAuth()` - аутентификация (login, register, logout, refresh)
- `getUser()` - пользователи
- `getPosts()` - посты (feed, create, like, repost)
- `getChats()` - чаты (list, create, update)
- `getMessages()` - сообщения (send, get chat messages)
- `getFollowers()` - подписки (follow, unfollow, get followers)
- `getProfile()` - профили
- `getCalls()` - звонки (get LiveKit token)
- `getTelegram()` - интеграция с Telegram

## Обновление API

### Когда обновлять?

После изменений в backend API:
1. Запустить backend сервер
2. Убедиться, что Swagger доступен по адресу `http://localhost:3000/docs/api-json`
3. Запустить генерацию: `pnpm --filter @workspace/nest-api generate`
4. Проверить изменения в `packages/nest-api/src/generated/`

### Важно

⚠️ **НЕ редактировать файлы в `src/generated/`** - они будут перезаписаны при следующей генерации!

Если нужно изменить поведение:
- Измените `customAxios` в `src/lib/back-api.ts`
- Измените конфигурацию в `orval.config.ts`

## Преимущества подхода

1. **Типобезопасность** - все типы генерируются автоматически
2. **Актуальность** - API всегда синхронизирован с backend
3. **Автодополнение** - IDE знает все доступные методы и типы
4. **Обработка ошибок** - единая точка обработки через interceptors
5. **Refresh token** - автоматическое обновление токенов
