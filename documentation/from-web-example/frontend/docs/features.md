# Features (Функциональные возможности)

## Обзор

Features - это функциональные возможности приложения (use-cases) согласно FSD архитектуре. Features управляют entities для реализации конкретных действий пользователя.

## Доступные features

### 1. `features/post` - Создание поста

**Назначение**: Создание нового поста в социальной сети

**Структура**:
```
features/post/
└── CreatePost/
    ├── index.ts
    ├── CreatePost.tsx        # Основной компонент
    ├── lib/
    │   ├── useCreatePostForm.hook.ts  # Хук для формы
    │   ├── useMediaUpload.hook.ts     # Хук для загрузки медиа
    │   └── useCamera.hook.ts          # Хук для работы с камерой
    ├── model/
    │   └── slice/
    │       └── CreatePostSlice.ts # Redux slice
    └── ui/
        ├── MediaPreview.tsx      # Превью медиа
        ├── CameraView.tsx         # Вид камеры
        └── AudioPlayer.tsx        # Плеер аудио
```

**Важно**: Все хуки в проекте должны иметь суффикс `.hook.ts`, независимо от того, публичные они или внутренние.

**Функционал**:
- Создание текстового поста
- Загрузка изображений
- Запись и загрузка аудио
- Запись видео с камеры
- Превью медиа перед публикацией

**Использование**:
```typescript
import { CreatePost } from '@/modules/features/post';
```

---

### 2. `features/call` - Звонки

**Назначение**: Управление видеозвонками и аудиозвонками

**Структура**:
```
features/call/
├── index.ts
├── lib/
│   ├── context/
│   │   └── global-call-provider.tsx  # Глобальный провайдер звонков
│   ├── hook/                         # Хуки для звонков (название: *.hook.ts)
│   │   ├── call-controls.hook.ts
│   │   ├── call-engine.hook.ts
│   │   ├── call-media.hook.ts
│   │   └── call.hook.ts
│   └── type/
│       └── webrtc.types.ts           # Типы WebRTC
├── model/
│   └── ...                           # Redux модель
└── ui/
    ├── LiveKitTest.tsx               # Тестовый компонент LiveKit
    └── ...                           # UI компоненты звонков
```

**Функционал**:
- Инициация видеозвонка
- Инициация аудиозвонка
- Принятие/отклонение звонка
- Управление звонком (включить/выключить микрофон, камеру)
- Интеграция с LiveKit

**Использование**:
```typescript
import { GlobalCallProvider } from '@/modules/features/call';
```

---

### 3. `features/video-call` - Видеозвонки

**Назначение**: Специфичная функциональность видеозвонков

**Структура**:
```
features/video-call/
├── index.ts
├── VideoCallInitButton.tsx    # Кнопка инициации видеозвонка
└── VideoPlayer.tsx            # Плеер видео
```

**Функционал**:
- Кнопка для начала видеозвонка
- Отображение видео потока

---

### 4. `features/audio-call` - Аудиозвонки

**Назначение**: Специфичная функциональность аудиозвонков

**Структура**:
```
features/audio-call/
├── index.ts
└── ...                       # UI компоненты
```

**Функционал**:
- Инициация аудиозвонка
- Управление аудиозвонком

---

### 5. `features/notifications` - Уведомления

**Назначение**: Работа с уведомлениями

**Структура**:
```
features/notifications/
├── index.ts
├── lib/
│   └── ...                   # Логика уведомлений
├── model/
│   └── ...                   # Redux модель
├── type/
│   └── ...                   # Типы
└── ui/
    ├── NotificationList.tsx   # Список уведомлений
    └── NotificationItem.tsx   # Элемент уведомления
```

**Функционал**:
- Отображение уведомлений
- Real-time обновления через WebSocket
- Отметка уведомлений как прочитанных

**Использование**:
```typescript
import { NotificationList } from '@/modules/features/notifications';
```

---

### 6. `features/secret-chat` - Секретные чаты

**Назначение**: Зашифрованные чаты с использованием WebRTC

**Структура**:
```
features/secret-chat/
├── lib/
│   └── ...                   # Логика секретных чатов
└── ui/
    └── ...                   # UI компоненты
```

**Функционал**:
- Создание секретного чата
- Шифрование сообщений
- P2P соединение через WebRTC

---

## Принципы работы features

### 1. Features управляют Entities

Features используют entities для реализации функциональности:

```typescript
// features/post/CreatePost/CreatePost.tsx
import { Post } from '@/modules/entities/post';
import { User } from '@/modules/entities/user';

export const CreatePost = () => {
    // Используем entities для работы с данными
    const { createPost } = useCreatePost();

    return (
        <form onSubmit={handleSubmit}>
            {/* Используем UI из entities */}
            <User user={currentUser} />
            <Post post={previewPost} />
        </form>
    );
};
```

### 2. Features могут использовать несколько Entities

Один feature может использовать несколько entities:

```typescript
// features/call/lib/context/global-call-provider.tsx
import { User } from '@/modules/entities/user';
import { Chat } from '@/modules/entities/chats';
import { Presence } from '@/modules/entities/presence';

// Feature использует несколько entities
```

### 3. Features могут иметь собственное состояние

Features могут иметь Redux slice для управления состоянием:

```typescript
// features/post/CreatePost/model/slice/CreatePostSlice.ts
export const createPostSlice = createSlice({
    name: 'createPost',
    initialState: {
        isOpen: false,
        media: [],
        // ...
    },
    // ...
});
```

### 4. Features могут иметь UI компоненты

Features предоставляют UI для выполнения действий:

```typescript
// features/post/CreatePost/ui/MediaPreview.tsx
export const MediaPreview = ({ media }: { media: Media[] }) => {
    // UI для превью медиа
};
```

## Правила импортов

Features могут импортировать:
- ✅ `shared` - общие ресурсы
- ✅ `entities` - для работы с данными
- ✅ Другие `features` - для композиции функциональности

Features НЕ могут импортировать:
- ❌ `widgets`, `processes`, `pages` - это вышележащие слои

## Примеры использования

### Использование в widget

```typescript
// widgetes/Header/Header.tsx
import { CreatePost } from '@/modules/features/post';
import { NotificationList } from '@/modules/features/notifications';

export const Header = () => {
    return (
        <header>
            <CreatePost />
            <NotificationList />
        </header>
    );
};
```

### Использование в page

```typescript
// app/network/calls/page.tsx
import { VideoCall } from '@/modules/features/call/ui/LiveKitTest';

export default function CallsPage() {
    return <VideoCall token={token} />;
}
```

## Отличия Features от Entities

| Аспект | Entities | Features |
|--------|----------|----------|
| **Назначение** | Данные и их представление | Действия пользователя (use-cases) |
| **Что содержит** | Модели, API, UI компоненты | Логика действий, формы, кнопки |
| **Примеры** | Post, User, Chat | CreatePost, Call, SendMessage |
| **Управляет** | Собственными данными | Entities для выполнения действий |

## Best Practices

1. **Один feature = одно действие**: Каждый feature должен реализовывать одно конкретное действие
2. **Используйте entities**: Не дублируйте логику, используйте entities
3. **Композиция**: Features могут использовать другие features
4. **Состояние**: Используйте Redux только если нужно глобальное состояние
5. **UI**: Предоставляйте UI для выполнения действия
