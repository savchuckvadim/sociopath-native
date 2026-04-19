# Presence и Уведомления

## Обзор

В проекте реализованы две важные системы:
1. **Presence** - отслеживание присутствия пользователей (онлайн/оффлайн статус)
2. **Уведомления** - оповещения о новых сообщениях, постах и других событиях

---

## Presence (Отслеживание присутствия)

### Назначение

Система Presence отслеживает, какие пользователи находятся онлайн в реальном времени. Это позволяет:
- Показывать индикаторы онлайн/оффлайн статуса
- Отображать время последнего визита
- Оптимизировать доставку сообщений

### Архитектура

#### Frontend

**Расположение**: `modules/entities/presence/`

**Компоненты**:

1. **PresenceSlice** (`model/PresenceSlise.ts`)
   - Redux slice для хранения состояния presence
   - Хранит объект `presence: Record<string, IPresence>`
   - Каждый ключ - это `userId`, значение - информация о статусе

2. **usePresence** (`lib/hook/presence.hook.ts`)
   - Главный хук для работы с presence
   - Методы:
     - `getPresenceUser(userId)` - получить информацию о пользователе
     - `getIsUserOnline(userId)` - проверить, онлайн ли пользователь
     - `getPresenceUsers(userIds[])` - получить информацию о нескольких пользователях
     - `handleOnPresenceChange(userId, status)` - обновить статус пользователя

3. **usePresenceSocket** (`lib/hook/presence-socket.hook.ts`)
   - Хук для подписки на WebSocket события presence
   - Автоматически обновляет Redux store при изменении статусов
   - Отправляет ping каждые 25 секунд для продления TTL

**Состояния**:
```typescript
enum EnumPresenceStatus {
    ONLINE = 'online',
    OFFLINE = 'offline'
}

interface IPresence {
    userId: string;
    status: EnumPresenceStatus;
    lastSeenAt: string; // Форматированная строка (например, "2 минуты назад")
}
```

**WebSocket события**:
- `presence:online` - пользователь стал онлайн
- `presence:offline` - пользователь стал оффлайн
- `presence:bulk-online` - список всех онлайн пользователей (при подключении)
- `presence:ping` - ping для продления TTL (отправляется каждые 25 секунд)

**Поток работы**:

1. **Подключение пользователя**:
   ```
   Пользователь открывает приложение
   → usePresenceSocket инициализируется
   → Socket подключается к серверу
   → Сервер отправляет presence:online для текущего пользователя
   → Сервер отправляет presence:bulk-online со списком всех онлайн пользователей
   → Redux store обновляется
   ```

2. **Поддержание онлайн статуса**:
   ```
   Каждые 25 секунд отправляется presence:ping
   → Сервер обновляет TTL в Redis (60 секунд)
   → Если ping не приходит 60 секунд, ключ истекает
   → Redis отправляет событие expired
   → Сервер отправляет presence:offline всем клиентам
   ```

3. **Отключение пользователя**:
   ```
   Пользователь закрывает приложение
   → Socket отключается
   → Сервер удаляет ключ из Redis
   → Сервер отправляет presence:offline всем клиентам
   ```

**Использование в компонентах**:

```typescript
import { usePresence } from '@/modules/entities/presence';

const MyComponent = ({ userId }: { userId: string }) => {
    const { getIsUserOnline } = usePresence();
    const isOnline = getIsUserOnline(userId);

    return (
        <div>
            <span>{isOnline ? 'Онлайн' : 'Оффлайн'}</span>
        </div>
    );
};
```

**Примеры использования**:
- `modules/widgetes/chat/ChatMessagesWidget/ChatMessagesWidget.tsx` - показывает статус в чате
- `modules/entities/post/ui/Post/components/PostHeader.tsx` - показывает статус автора поста
- `modules/entities/chats/ui/ChatsList/ChatsListItem.tsx` - показывает статус в списке чатов
- `modules/shared/ui/Avatar/Avatar.tsx` - показывает индикатор онлайн/оффлайн

#### Backend

**Расположение**: `apps/api/src/modules/presence/`

**Компоненты**:

1. **PresenceService** (`service/presence.service.ts`)
   - Управляет presence в Redis
   - Использует ключи вида `presence:user:${userId}`
   - TTL = 60 секунд
   - Подписывается на события истечения ключей Redis

   **Методы**:
   - `markOnline(userId)` - пометить пользователя как онлайн
   - `refresh(userId)` - продлить TTL (обновить время онлайн)
   - `markOffline(userId)` - пометить пользователя как оффлайн
   - `isOnline(userId)` - проверить, онлайн ли пользователь
   - `getOnlineUsers(userIds[])` - получить список онлайн пользователей из массива
   - `getAllOnlineUsers()` - получить список всех онлайн пользователей

2. **PresenceGateway** (`socket/presence.getway.ts`)
   - WebSocket gateway для presence событий
   - Обрабатывает подключения/отключения
   - Отправляет события всем клиентам

   **События**:
   - `presence:ping` - обработчик ping от клиента
   - `handleConnection` - при подключении клиента
   - `handleDisconnect` - при отключении клиента

**Поток работы на backend**:

1. **Подключение клиента**:
   ```
   Клиент подключается к WebSocket
   → handleConnection вызывается
   → PresenceService.markOnline(userId) - создает ключ в Redis с TTL 60 сек
   → Сервер отправляет presence:online всем клиентам
   → Сервер отправляет presence:bulk-online новому клиенту со списком всех онлайн
   ```

2. **Ping от клиента**:
   ```
   Клиент отправляет presence:ping каждые 25 секунд
   → PresenceService.refresh(userId) - обновляет TTL ключа
   → Если ключ был истек, но пользователь все еще подключен, отправляется presence:online
   ```

3. **Истечение TTL**:
   ```
   Redis ключ истекает (60 секунд без ping)
   → Redis отправляет событие expired
   → PresenceService получает событие через подписку
   → PresenceGateway отправляет presence:offline всем клиентам
   ```

4. **Отключение клиента**:
   ```
   Клиент отключается от WebSocket
   → handleDisconnect вызывается
   → PresenceService.markOffline(userId) - удаляет ключ из Redis
   → Сервер отправляет presence:offline всем клиентам
   ```

**Redis структура**:
- Ключ: `presence:user:${userId}`
- Значение: `'1'` (просто маркер)
- TTL: 60 секунд
- Автоматическое истечение: через Redis keyspace events

---

## Уведомления

### Назначение

Система уведомлений оповещает пользователей о новых событиях:
- Новые сообщения в чатах
- Новые посты от подписок
- Новые комментарии
- Лайки и другие действия

### Архитектура

#### Frontend

**Расположение**: `modules/features/notifiactions/`

**Компоненты**:

1. **NotificationSlice** (`model/NotificationSlice.ts`)
   - Redux slice для хранения уведомлений
   - Хранит массив `notifications: INotification[]`
   - Методы: `addNotification`, `removeNotification`

2. **NotificationsProvider** (`ui/NotificationsProvider.tsx`)
   - Провайдер для отображения уведомлений
   - Показывает toast-уведомления
   - Автоматически удаляет уведомления через 5 секунд

3. **NotificationToast** (`ui/NotificationToast.tsx`)
   - Компонент отдельного toast-уведомления
   - Анимации через framer-motion
   - Кликабельные уведомления с переходом по URL

4. **useNotificationsSocket** (`lib/hook/notifications-socket.hook.ts`)
   - Хук для подписки на WebSocket события уведомлений
   - Обрабатывает события от сервера

5. **usePostNotification** (`lib/hook/post-notification.hook.ts`)
   - Хук для обработки уведомлений о новых постах
   - Слушает событие `post:created`

**Типы уведомлений**:
```typescript
enum EnumNotificationType {
    POST = 'post',
    MESSAGE = 'message',
    COMMENT = 'comment',
    LIKE = 'like',
    DISLIKE = 'dislike',
    FOLLOW = 'follow',
    UNFOLLOW = 'unfollow',
}

interface INotification {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    type: EnumNotificationType;
    contentType: EnumNotificationContentType;
    url?: string; // URL для перехода при клике
}
```

**WebSocket события**:
- `notification:new-message` - новое сообщение (если чат не открыт)
- `notification:new-follower` - новый подписчик
- `post:created` - новый пост (обрабатывается через основной socket)

**Поток работы**:

1. **Новое сообщение**:
   ```
   Пользователь отправляет сообщение
   → Backend проверяет, открыт ли чат у получателя
   → Если чат не открыт, отправляется notification:new-message
   → Frontend получает событие
   → NotificationToast показывается
   → При клике - переход в чат
   ```

2. **Новый пост**:
   ```
   Пользователь создает пост
   → Backend отправляет post:created через основной socket
   → Frontend получает событие
   → usePostNotification обрабатывает событие
   → Создается уведомление в Redux
   → NotificationToast показывается
   ```

**Использование**:

```typescript
// В корневом layout
import { NotificationsProvider } from '@/modules/features/notifiactions';

<NotificationsProvider>
    {children}
</NotificationsProvider>
```

#### Backend

**Расположение**: `apps/api/src/modules/notifications/`

**Компоненты**:

1. **NotificationsGateway** (`notifications.gateway.ts`)
   - WebSocket gateway для уведомлений
   - Namespace: `/notifications`
   - Управляет подключениями пользователей
   - Отправляет уведомления в комнаты пользователей

   **Методы**:
   - `notifyNewMessage(userId, message)` - уведомить о новом сообщении
   - `notifyNewFollower(userId, follower)` - уведомить о новом подписчике

**Поток работы на backend**:

1. **Новое сообщение**:
   ```
   Пользователь отправляет сообщение
   → MessagesGateway.broadcastMessage вызывается
   → Проверяется, открыт ли чат у получателя (через комнаты Socket.IO)
   → Если чат не открыт, вызывается NotificationsGateway.notifyNewMessage
   → Уведомление отправляется в комнату user:${userId}
   → Все сокеты пользователя получают уведомление
   ```

2. **Новый пост**:
   ```
   Пользователь создает пост
   → PostService создает пост
   → Отправляется событие post:created через основной socket
   → Frontend обрабатывает событие и создает уведомление локально
   ```

**Интеграция с MessagesGateway**:

В `apps/api/src/modules/messages/socket/messages.gateway.ts`:

```typescript
// Отправляем уведомления участникам, которые не в чате
chatMembers.forEach(member => {
    if (member.userId !== senderId) {
        // Проверяем, находится ли пользователь в комнате чата
        const isInChatRoom = /* проверка через Socket.IO комнаты */;

        if (!isInChatRoom) {
            this.notificationsGateway.notifyNewMessage(member.userId, {
                id: message.id,
                chatId: chatId,
                content: message.content,
                sender: message.sender || { name: 'Пользователь' },
            });
        }
    }
});
```

**Структура комнат Socket.IO**:
- `user:${userId}` - комната для уведомлений пользователя
- `chat:${chatId}` - комната для сообщений чата

---

## Сравнение Presence и Уведомлений

| Аспект | Presence | Уведомления |
|--------|----------|-------------|
| **Назначение** | Отслеживание онлайн/оффлайн статуса | Оповещения о событиях |
| **Хранение** | Redis (TTL 60 сек) | Redux (временное, на время показа) |
| **WebSocket** | Основной socket | Отдельный namespace `/notifications` |
| **События** | `presence:online`, `presence:offline` | `notification:new-message`, `notification:new-follower` |
| **Обновление** | Автоматическое (ping каждые 25 сек) | По событиям от сервера |
| **Масштаб** | Все пользователи | Только текущий пользователь |

---

## Документация

- [Presence Frontend код](../modules/entities/presence/)
- [Presence Backend код](../../backend/docs/presence.md)
- [Notifications Frontend код](../modules/features/notifiactions/)
- [Notifications Backend код](../../backend/docs/notifications.md)
