# Архитектура Frontend - Feature-Sliced Design (FSD)

## Обзор

Проект использует архитектуру **Feature-Sliced Design (FSD)** - методологию организации кода, которая разделяет приложение на слои по уровню абстракции и изоляции.

## Структура слоев

FSD состоит из следующих слоев (от низкого к высокому уровню абстракции):

```
modules/
├── shared/      # Переиспользуемые компоненты и утилиты (низкий уровень)
├── entities/    # Бизнес-сущности (данные и их представление)
├── features/    # Функциональные возможности (use-cases)
├── widgets/     # Крупные UI блоки, композиция features и entities
├── processes/   # Глобальные бизнес-процессы (роутинг, аутентификация)
└── pages/       # Страницы приложения (композиция всех слоев)
```

## Детальное описание слоев

### 1. `shared/` - Общие ресурсы

**Назначение**: Переиспользуемые компоненты, утилиты, константы, которые не привязаны к бизнес-логике.

**Что содержит**:
- UI компоненты общего назначения (кнопки, инпуты, модалки)
- Утилиты (форматирование дат, валидация, helpers)
- Хуки общего назначения
- Конфигурации (WebRTC config, socket config)
- Типы и интерфейсы общего назначения

**Правила импорта**:
- ✅ Может импортировать только из `shared`
- ❌ НЕ может импортировать из других слоев

**Примеры**:
```typescript
// shared/ui/Loading/LoadingScreen.tsx
// shared/lib/utils/formatDate.ts
// shared/lib/hooks/useDebounce.hook.ts
```

### 2. `entities/` - Бизнес-сущности

**Назначение**: Бизнес-сущности приложения (User, Post, Chat, Message и т.д.). Содержат данные и их представление.

**Что содержит**:
- Модели данных (типы, интерфейсы)
- API сервисы для работы с сущностью
- Хуки для работы с данными (usePost, useUser)
- UI компоненты для отображения сущности (PostCard, UserAvatar)
- Бизнес-логика сущности

**Структура**:
```
entities/
├── post/
│   ├── index.ts          # Public API модуля
│   ├── lib/              # Логика (API, хуки, утилиты)
│   │   ├── api/
│   │   ├── hook/         # React хуки (название: *.hook.ts)
│   │   └── util/
│   ├── ui/               # UI компоненты
│   └── type/             # Типы
```

**Правила импорта**:
- ✅ Может импортировать из `shared` и других `entities`
- ❌ НЕ может импортировать из `features`, `widgets`, `processes`, `pages`

**Примеры**:
```typescript
// entities/post/lib/api/post.service.ts
// entities/post/ui/Post/Post.tsx
// entities/user/lib/hook/useUser.hook.ts
```

### 3. `features/` - Функциональные возможности (Use-Cases)

**Назначение**: Конкретные функциональные возможности приложения, которые управляют сущностями. Это use-cases - действия пользователя.

**Что содержит**:
- Логика выполнения действия (создание поста, отправка сообщения, инициация звонка)
- UI для выполнения действия (формы, кнопки действий)
- Модели состояния для feature (Redux slice, если нужно)
- Хуки для работы с feature

**Структура**:
```
features/
├── post/
│   └── CreatePost/
│       ├── index.ts
│       ├── CreatePost.tsx
│       ├── lib/          # Логика создания поста
│       ├── model/        # Состояние (если нужно)
│       └── ui/           # UI компоненты
```

**Правила импорта**:
- ✅ Может импортировать из `shared`, `entities` и других `features`
- ❌ НЕ может импортировать из `widgets`, `processes`, `pages`

**Примеры**:
```typescript
// features/post/CreatePost/CreatePost.tsx - создание поста
// features/call/lib/context/global-call-provider.tsx - управление звонками
// features/notifications/ui/NotificationList.tsx - отображение уведомлений
```

**Важно**: Feature может импортировать несколько entities. Например, `CreatePost` может использовать `entities/post` и `entities/user`.

### 4. `widgets/` - Виджеты

**Назначение**: Крупные составные UI блоки, которые комбинируют несколько features и entities.

**Что содержит**:
- Композицию features и entities
- Сложные UI блоки (Header, Navigation, Chat Widget)
- Виджеты, которые могут использоваться на разных страницах

**Правила импорта**:
- ✅ Может импортировать из `shared`, `entities`, `features` и других `widgets`
- ❌ НЕ может импортировать из `processes`, `pages`

**Примеры**:
```typescript
// widgetes/Header/Header.tsx - шапка сайта
// widgetes/chat/ChatListWidget/ChatListWidget.tsx - список чатов
// widgetes/navigation/Navigation.tsx - навигация
```

### 5. `processes/` - Бизнес-процессы

**Назначение**: Глобальные бизнес-процессы, которые управляют состоянием приложения на высоком уровне. Могут управлять тем, какие страницы показывать, глобальными состояниями.

**Что содержит**:
- Процессы аутентификации (auth)
- Роутинг и навигация
- Глобальные состояния приложения
- Логика инициализации приложения

**Правила импорта**:
- ✅ Может импортировать из `shared`, `entities`, `features`, `widgets` и других `processes`
- ❌ НЕ может импортировать из `pages`

**Примеры**:
```typescript
// processes/auth/ - процесс аутентификации
// processes/routing/ - управление роутингом
```

**Важно**: Processes более глобальные, чем features. Они могут управлять тем, какие страницы показывать, глобальными состояниями приложения.

### 6. `pages/` - Страницы

**Назначение**: Точки входа приложения, композиция всех слоев.

**Что содержит**:
- Композицию widgets, features, entities
- Страницы приложения
- Error pages

**Правила импорта**:
- ✅ Может импортировать из всех слоев
- ✅ Может импортировать из других `pages`

**Примеры**:
```typescript
// pages/error-page/ErrorPage.tsx
```

## Index файлы (Public API)

Каждый модуль должен иметь `index.ts` файл, который экспортирует только публичный API модуля.

**Назначение**:
- Контроль того, что можно импортировать из модуля
- Скрытие внутренней реализации
- Упрощение импортов

**Пример**:
```typescript
// entities/post/index.ts
export * from './ui/Post/Post';
export * from './lib/hook/post.hook';
export * from './type/consts';

// НЕ экспортируем внутренние файлы:
// export * from './lib/api/post.service'; // ❌ Внутренняя реализация
```

**Правило**: Импорты должны идти только через `index.ts`:
```typescript
// ✅ Правильно
import { Post } from '@/modules/entities/post';

// ❌ Неправильно
import { Post } from '@/modules/entities/post/ui/Post/Post';
```

## Правила импортов между слоями

### Разрешенные импорты:

```
shared     → (ничего)
entities   → shared, entities
features   → shared, entities, features
widgets    → shared, entities, features, widgets
processes   → shared, entities, features, widgets, processes
pages      → все слои
```

### Запрещенные импорты:

- ❌ `shared` не может импортировать из других слоев
- ❌ `entities` не может импортировать из `features`, `widgets`, `processes`, `pages`
- ❌ `features` не может импортировать из `widgets`, `processes`, `pages`
- ❌ `widgets` не может импортировать из `processes`, `pages`
- ❌ `processes` не может импортировать из `pages`

### Примеры правильных импортов:

```typescript
// ✅ entities/post может импортировать entities/user
import { User } from '@/modules/entities/user';

// ✅ features/post может импортировать несколько entities
import { Post } from '@/modules/entities/post';
import { User } from '@/modules/entities/user';

// ✅ widgets/Header может импортировать features и entities
import { CreatePost } from '@/modules/features/post';
import { User } from '@/modules/entities/user';

// ❌ entities/post НЕ может импортировать features/post
import { CreatePost } from '@/modules/features/post'; // ОШИБКА!
```

## Соглашения об именовании

### Хуки (Hooks)

**ВСЕ** React хуки в проекте должны иметь суффикс `.hook.ts`, без исключений:

```typescript
// ✅ Правильно
// entities/post/lib/hook/post.hook.ts
// entities/post/lib/hook/posts.hook.ts
// features/call/lib/hook/call-controls.hook.ts
// features/post/CreatePost/lib/useCreatePostForm.hook.ts
// processes/auth/lib/hooks/auth.hook.ts

// ❌ Неправильно
// entities/post/lib/hook/post.ts
// entities/post/lib/hook/usePost.ts
// features/post/CreatePost/lib/useCreatePostForm.ts
```

**Примеры из проекта**:
- `call-controls.hook.ts` - хуки для управления звонками
- `post.hook.ts` - хук для работы с одним постом
- `posts.hook.ts` - хук для работы со списком постов
- `auth.hook.ts` - хук для аутентификации
- `useCreatePostForm.hook.ts` - хук для формы создания поста

## Структура модуля

Каждый модуль в слое должен следовать единой структуре:

```
module-name/
├── index.ts          # Public API - что можно импортировать
├── lib/              # Логика модуля
│   ├── api/          # API сервисы
│   ├── hook/         # React хуки
│   ├── util/         # Утилиты
│   └── ...
├── ui/               # UI компоненты
├── model/            # Модели состояния (Redux slice, если нужно)
├── type/             # Типы и интерфейсы
└── consts/           # Константы
```

## Преимущества FSD

1. **Изоляция**: Каждый слой изолирован от вышележащих
2. **Переиспользование**: Низкие слои можно переиспользовать
3. **Масштабируемость**: Легко добавлять новые features и entities
4. **Понятность**: Четкая структура, понятно где что искать
5. **Тестируемость**: Легко тестировать изолированные модули

## Важные принципы

1. **Один модуль = одна ответственность**: Модуль должен решать одну задачу
2. **Public API через index.ts**: Все импорты через публичный API
3. **Запрет обратных импортов**: Низкие слои не знают о высоких
4. **Features управляют Entities**: Features - это use-cases, которые используют entities
5. **Processes управляют глобальным состоянием**: Processes более глобальные, чем features
