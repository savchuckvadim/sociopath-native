# Frontend - Sociopath Network

## Описание

Frontend приложение социальной сети Sociopath Network, построенное на Next.js 15 с использованием React 19. Приложение реализует полный функционал социальной сети с поддержкой чатов, постов, видеозвонков и других социальных функций.

## Технологический стек

- **Next.js 15.5.7** - React фреймворк с App Router
- **React 19** - UI библиотека
- **TypeScript** - типизация
- **TanStack Query** - управление состоянием сервера и кэширование
- **Redux Toolkit** - управление клиентским состоянием
- **shadcn/ui** - компоненты UI (через `@workspace/ui`)
- **Framer Motion** - анимации
- **LiveKit** - видеозвонки и аудиозвонки
- **Socket.IO Client** - WebSocket соединения для real-time функций
- **React Hook Form** - управление формами
- **Axios** - HTTP клиент

## Архитектура

Проект использует **Feature-Sliced Design (FSD)** архитектуру. Подробное описание см. в [Архитектуре FSD](./frontend/docs/architecture.md).

```
modules/
├── app/          # Инициализация приложения, провайдеры, store
├── processes/    # Бизнес-процессы (auth, routing)
├── pages/        # Страницы приложения
├── widgets/      # Крупные UI блоки (Header, Navigation, Chat, Profile)
├── features/     # Функциональные возможности (call, post, notifications)
├── entities/     # Бизнес-сущности (user, post, chat, message)
└── shared/       # Переиспользуемые компоненты и утилиты
```

## Документация

### Основные разделы

1. **[Архитектура FSD](./frontend/docs/architecture.md)** - подробное описание архитектуры Feature-Sliced Design, правила импортов, структура модулей

2. **[Монорепо и API](./frontend/docs/monorepo-api.md)** - как устроено монорепо, кодогенерация с Orval, работа с API клиентом

3. **[Аутентификация](./frontend/docs/auth.md)** - система аутентификации, работа с токенами, middleware, interceptors, редиректы

4. **[Страницы](./frontend/docs/pages.md)** - описание всех страниц приложения, их функционал и компоненты

5. **[Сущности](./frontend/docs/entities.md)** - описание всех entities (user, post, chat, message и т.д.), их структура и использование

6. **[Features](./frontend/docs/features.md)** - описание всех features (use-cases), их функционал и использование

7. **[Чат и WebRTC](./frontend/docs/chat-webrtc.md)** - работа с чатами, WebRTC для секретных чатов, переход на LiveKit

8. **[Задачи](./frontend/tasks/tasks.md)** - список задач для выполнения

## Основные модули

### Аутентификация
- Регистрация и вход в систему
- Подтверждение email
- Управление токенами (access/refresh)
- Middleware для защиты роутов

Подробнее: [Документация по Auth](./frontend/docs/auth.md)

### Социальная сеть
- **Посты** - создание, просмотр, лайки, комментарии
- **Профили** - просмотр и редактирование профилей пользователей
- **Подписки** - система фолловеров
- **Лента** - отображение постов пользователей

Подробнее: [Сущности](./frontend/docs/entities.md#2-entitiespost---пост), [Features](./frontend/docs/features.md#1-featurespost---создание-поста)

### Мессенджер
- **Чаты** - список чатов и переписки
- **Сообщения** - отправка и получение сообщений в реальном времени
- **Secret Chat** - зашифрованные чаты через WebRTC
- **Presence** - статус онлайн/офлайн пользователей

Подробнее: [Чат и WebRTC](./frontend/docs/chat-webrtc.md)

### Звонки
- **Видеозвонки** - через LiveKit
- **Аудиозвонки** - через LiveKit
- **Управление звонками** - создание комнат, управление участниками

Подробнее: [Features - Звонки](./frontend/docs/features.md#2-featurescall---звонки)

### Уведомления
- Real-time уведомления через WebSocket
- Уведомления о новых сообщениях, постах, подписках

Подробнее: [Features - Уведомления](./frontend/docs/features.md#5-featuresnotifications---уведомления)

## Роутинг

- `/auth/login` - страница входа
- `/auth/register` - страница регистрации
- `/auth/confirm` - подтверждение email
- `/network` - главная страница социальной сети
- `/network/me` - профиль текущего пользователя
- `/network/people` - список пользователей
- `/network/people/[userId]` - профиль пользователя
- `/network/chats` - список чатов
- `/network/chats/[chatId]` - переписка
- `/network/calls` - страница звонков (тестовая)

Подробнее: [Страницы](./frontend/docs/pages.md)

## Переменные окружения

Создайте файл `.env.local` в `apps/front/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_LIVEKIT_URL=https://ws.sociopath-network.ru
```

## Задачи

Список задач для выполнения см. в [Задачах Frontend](./frontend/tasks/tasks.md).
