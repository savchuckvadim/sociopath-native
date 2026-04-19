# Сущности (Entities)

## Обзор

Entities - это бизнес-сущности приложения согласно FSD архитектуре. Каждая сущность содержит данные, их представление и логику работы с ними.

## Доступные сущности

### 1. `entities/user` - Пользователь

**Назначение**: Работа с пользователями системы

**Структура**:
```
entities/user/
├── index.ts          # Public API
├── lib/
│   └── ...           # Логика работы с пользователями
└── ui/
    └── ...           # UI компоненты (UserCard, UserAvatar и т.д.)
```

**Функционал**:
- Получение информации о пользователе
- Отображение пользователей
- Компоненты для отображения пользователя

**Использование**:
```typescript
import { Users, UserCard } from '@/modules/entities/user';
```

---

### 2. `entities/post` - Пост

**Назначение**: Работа с постами в социальной сети

**Структура**:
```
entities/post/
├── index.ts
├── lib/
│   ├── api/
│   │   └── post.service.ts    # API сервис для постов
│   ├── hook/
│   │   ├── post.hook.ts      # Хук для одного поста
│   │   ├── posts.hook.ts     # Хук для списка постов
│   │   └── post-socket.hook.ts # WebSocket для real-time обновлений
│   └── util/
│       └── encrypt.util.ts   # Утилиты шифрования
├── type/
│   └── consts.ts              # Константы
└── ui/
    └── Post/
        ├── Post.tsx           # Основной компонент поста
        ├── RepostedPost.tsx   # Компонент репоста
        └── components/        # Подкомпоненты
            ├── PostHeader.tsx
            ├── PostContent.tsx
            ├── PostFooter.tsx
            ├── PostLike.tsx
            ├── PostRepost.tsx
            ├── PostViews.tsx
            └── PostManage.tsx
```

**Функционал**:
- Отображение постов
- Лайки постов
- Репосты
- Просмотры
- Real-time обновления через WebSocket

**Хуки**:
- `usePost(postId)` - получение одного поста
- `usePosts(params)` - получение списка постов
- `usePostSocket()` - WebSocket для обновлений

**Использование**:
```typescript
import { Post, usePost, usePosts } from '@/modules/entities/post';
```

---

### 3. `entities/chats` - Чаты

**Назначение**: Работа с чатами

**Структура**:
```
entities/chats/
├── index.ts
├── lib/
│   └── ...           # Логика работы с чатами
└── ui/
    └── ...           # UI компоненты чатов
```

**Функционал**:
- Получение списка чатов
- Создание чата
- Обновление чата
- Отметка чата как прочитанного
- WebSocket для real-time обновлений

**Хуки**:
- `useUserChats()` - получение чатов пользователя
- `useCreateChat()` - создание чата
- `useChatSocket()` - WebSocket для чатов
- `useMarkChatAsRead()` - отметка как прочитанного

**Использование**:
```typescript
import { useUserChats, useCreateChat, Chat } from '@/modules/entities/chats';
```

---

### 4. `entities/messages` - Сообщения

**Назначение**: Работа с сообщениями в чатах

**Структура**:
```
entities/messages/
├── index.ts
├── lib/
│   └── ...           # Логика работы с сообщениями
└── ui/
    └── ...           # UI компоненты сообщений
```

**Функционал**:
- Получение сообщений чата
- Отправка сообщений
- Real-time обновления через WebSocket
- Утилиты для работы с сообщениями (скролл, форматирование)

**Хуки**:
- `useChatMessages(chatId)` - получение сообщений чата
- `useSendMessage()` - отправка сообщения

**Использование**:
```typescript
import { useChatMessages, useSendMessage } from '@/modules/entities/messages';
```

---

### 5. `entities/followers` - Подписки

**Назначение**: Работа с подписками на пользователей

**Структура**:
```
entities/followers/
├── index.ts
└── lib/
    └── ...           # Логика работы с подписками
```

**Функционал**:
- Подписка на пользователя
- Отписка от пользователя
- Получение списка подписчиков
- Получение списка подписок
- Получение всех пользователей

**Хуки**:
- `useFollow(userId)` - подписка
- `useUnfollow(userId)` - отписка
- `useAllUsers()` - получение всех пользователей

**Использование**:
```typescript
import { useFollow, useUnfollow, useAllUsers } from '@/modules/entities/followers';
```

---

### 6. `entities/presence` - Статус онлайн

**Назначение**: Отслеживание статуса онлайн/офлайн пользователей

**Структура**:
```
entities/presence/
├── index.ts
├── lib/
│   └── ...           # Логика работы с presence
├── model/
│   └── ...           # Redux модель (если нужно)
└── type/
    └── ...           # Типы
```

**Функционал**:
- Отслеживание статуса онлайн
- Обновление статуса в реальном времени через WebSocket
- Отображение статуса пользователя

**Использование**:
```typescript
import { usePresence } from '@/modules/entities/presence';
```

---

### 7. `entities/profile` - Профиль

**Назначение**: Работа с профилями пользователей

**Структура**:
```
entities/profile/
├── index.ts
└── lib/
    └── ...           # Логика работы с профилями
```

**Функционал**:
- Получение профиля пользователя
- Обновление профиля
- Работа с аватаром

**Использование**:
```typescript
import { useProfile, useUpdateProfile } from '@/modules/entities/profile';
```

---

## Общие принципы работы с entities

### 1. Public API через index.ts

Каждая entity экспортирует только публичный API:

```typescript
// entities/post/index.ts
export * from './ui/Post/Post';
export * from './lib/hook/post.hook';
export * from './type/consts';
```

### 2. Использование в других слоях

Entities могут использоваться в:
- ✅ `features` - для реализации функциональности
- ✅ `widgets` - для композиции UI
- ✅ `processes` - для глобальных процессов
- ✅ `pages` - для отображения на страницах

### 3. API сервисы

Каждая entity может иметь API сервис для работы с backend:

```typescript
// entities/post/lib/api/post.service.ts
import { getPosts } from '@workspace/nest-api';

export class PostService {
    private api = getPosts();

    async getFeed() {
        return await this.api.postGetFeed({});
    }
}
```

### 4. React хуки

Entities предоставляют хуки для удобной работы с данными. **Важно**: **ВСЕ** хуки в проекте должны иметь суффикс `.hook.ts`, без исключений.

```typescript
// entities/post/lib/hook/posts.hook.ts
export const usePosts = (params) => {
    return useQuery({
        queryKey: ['posts', params],
        queryFn: () => postService.getFeed(params),
    });
};
```

**Соглашение об именовании**: `*.hook.ts` (например: `post.hook.ts`, `posts.hook.ts`, `call-controls.hook.ts`, `useCreatePostForm.hook.ts`)

### 5. UI компоненты

Entities предоставляют переиспользуемые UI компоненты:

```typescript
// entities/post/ui/Post/Post.tsx
export const Post = ({ post }: { post: PostDto }) => {
    return (
        <div>
            <PostHeader post={post} />
            <PostContent post={post} />
            <PostFooter post={post} />
        </div>
    );
};
```

## Правила импортов

Entities могут импортировать:
- ✅ `shared` - общие ресурсы
- ✅ Другие `entities` - для композиции

Entities НЕ могут импортировать:
- ❌ `features` - это нарушение архитектуры
- ❌ `widgets`, `processes`, `pages` - это вышележащие слои

## Примеры использования

### Использование в feature

```typescript
// features/post/CreatePost/CreatePost.tsx
import { Post } from '@/modules/entities/post';
import { User } from '@/modules/entities/user';

export const CreatePost = () => {
    // Используем entities для отображения
    return (
        <div>
            <User user={currentUser} />
            <Post post={createdPost} />
        </div>
    );
};
```

### Использование в widget

```typescript
// widgetes/chat/ChatListWidget/ChatListWidget.tsx
import { useUserChats, Chat } from '@/modules/entities/chats';

export const ChatListWidget = () => {
    const { data: chats } = useUserChats();

    return (
        <div>
            {chats?.map(chat => (
                <ChatItem key={chat.id} chat={chat} />
            ))}
        </div>
    );
};
```

## Соглашения об именовании

### Хуки (Hooks)

**ВСЕ** React хуки в проекте должны иметь суффикс `.hook.ts`, без исключений (независимо от того, публичные они или внутренние):

```typescript
// ✅ Правильно
// entities/post/lib/hook/post.hook.ts
// entities/post/lib/hook/posts.hook.ts
// entities/post/lib/hook/post-socket.hook.ts
// features/call/lib/hook/call-controls.hook.ts
// features/post/CreatePost/lib/useCreatePostForm.hook.ts
// processes/auth/lib/hooks/auth.hook.ts

// ❌ Неправильно
// entities/post/lib/hook/post.ts
// entities/post/lib/hook/usePost.ts
// features/post/CreatePost/lib/useCreatePostForm.ts
```

**Примеры из проекта**:
- `post.hook.ts` - хук для работы с одним постом
- `posts.hook.ts` - хук для работы со списком постов
- `post-socket.hook.ts` - хук для WebSocket обновлений постов
- `call-controls.hook.ts` - хуки для управления звонками
- `auth.hook.ts` - хук для аутентификации
