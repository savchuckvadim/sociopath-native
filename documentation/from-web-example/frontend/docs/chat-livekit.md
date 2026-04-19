# Система звонков на LiveKit

## Обзор

Система звонков была мигрирована с WebRTC на **LiveKit** для обеспечения:
- ✅ Лучшей стабильности соединений (не зависит от NAT)
- ✅ Упрощения настройки (не нужны STUN/TURN серверы)
- ✅ Масштабируемости (поддержка групповых звонков в будущем)
- ✅ Готовых UI компонентов и API
- ✅ Автоматического управления медиа потоками

## Архитектура системы

### Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         GlobalCallProvider (Context)                  │  │
│  │  - Управляет глобальным состоянием звонков           │  │
│  │  - Слушает входящие звонки через WebSocket            │  │
│  │  - Координирует работу useLiveKitCall                │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         useLiveKitCall (Hook)                        │  │
│  │  - Управление состоянием звонка                       │  │
│  │  - Обработка WebSocket событий                        │  │
│  │  - Инициация/принятие/отклонение звонков             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         CallWrapperWidget (UI Component)              │  │
│  │  - Отображение UI звонков (входящие/активные)        │  │
│  │  - Управление LiveKitRoom                             │  │
│  │  - Получение токенов через useLivekitToken            │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         LiveKitRoom (@livekit/components-react)      │  │
│  │  - Подключение к LiveKit серверу                      │  │
│  │  - Управление медиа потоками                          │  │
│  │  - Обработка участников и треков                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ WebSocket (Socket.IO)
                          │ - call:initiate
                          │ - call:incoming
                          │ - call:accepted
                          │ - call:end
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │         CallsGateway (WebSocket Gateway)            │  │
│  │  - Обработка событий звонков                        │  │
│  │  - Маршрутизация между пользователями               │  │
│  │  - Создание записей в БД                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         LiveKitService                                 │  │
│  │  - Генерация JWT токенов для LiveKit                  │  │
│  │  - POST /api/calls/token                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ WebRTC (через LiveKit сервер)
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    LiveKit Server                            │
│  - Управление комнатами                                      │
│  - Маршрутизация медиа потоков                               │
│  - STUN/TURN серверы (встроенные)                            │
└─────────────────────────────────────────────────────────────┘
```

### Иерархия компонентов

```
app/network/layout.tsx
└── GlobalCallProvider
    └── CallWrapperWidget
        ├── children (контент приложения)
        ├── CallIncoming (если isIncomingCall)
        ├── Outgoing Call Overlay (если isInCall && !token)
        └── LiveKitRoom (если isInCall && token)
            ├── CallOverlay
            │   ├── LiveKitVideoPlayer (удаленное видео)
            │   ├── LiveKitVideoPlayer (локальное видео)
            │   └── CallControls
            └── RoomAudioRenderer
```

## Компоненты системы

### 1. GlobalCallProvider

**Расположение**: `modules/features/call/lib/context/global-call-provider.tsx`

**Назначение**: Глобальный провайдер контекста для управления звонками во всем приложении.

**Ключевые функции**:
- Оборачивает приложение и предоставляет контекст звонков
- Управляет `activeChatId` и `activeOtherUserId`
- Координирует работу `useLiveKitCall`
- Обрабатывает принятие/отклонение звонков

**Состояние**:
```typescript
interface GlobalCallContextValue {
    isInCall: boolean;
    callType: 'VIDEO' | 'AUDIO';
    isIncomingCall: boolean;
    incomingCallFromUserId: string | null;
    remoteUserId: string | null;
    chatId: string | null;
    // Методы
    handleCallUser: (otherUserId: string, chatId: string, type: 'VIDEO' | 'AUDIO') => Promise<void>;
    acceptCall: () => void;
    rejectCall: () => void;
    handleEndCall: () => void;
    // Заглушки для совместимости (LiveKit управляет сам)
    myStream: null;
    remoteStream: null;
    isAudioMute: false;
    isVideoOnHold: false;
    handleToggleAudio: () => {};
    handleToggleVideo: () => {};
}
```

**Особенности**:
- ✅ Использует только `useLiveKitCall` (WebRTC код закомментирован)
- ✅ Устанавливает `chatId` перед вызовом `acceptCall()` для правильной работы LiveKit
- ⚠️ Содержит закомментированный код для WebRTC (строки 110-140) - можно удалить
- ⚠️ Содержит `debugger` на строках 149, 153, 157 - нужно удалить

**Критический момент**:
```typescript
const acceptCall = () => {
    // ✅ КРИТИЧНО: Устанавливаем chatId ПЕРЕД вызовом call.acceptCall()
    // чтобы useLiveKitCall получил правильный chatId
    if (liveKitCall.incomingCallFromUserId) {
        const incomingData = (liveKitCall as any).incomingCallData;
        if (incomingData?.chatId) {
            setActiveChatId(incomingData.chatId); // ✅ ПЕРЕД acceptCall
        }
    }
    call.acceptCall();
};
```

---

### 2. useLiveKitCall Hook

**Расположение**: `modules/features/call/lib/hook/livekit-call.hook.ts`

**Назначение**: Управление состоянием звонка и обработка WebSocket событий.

**Ключевые функции**:

#### Инициализация сокета
```typescript
useEffect(() => {
    if (!currentUser?.id) return;

    const initSocket = () => {
        if (!socketManager.isConnected()) return false;
        const s = socketManager.getSocket();
        setSocket(s);
        return true;
    };

    if (!initSocket()) {
        // Polling каждые 100ms, таймаут 10s
        const interval = setInterval(() => {
            if (initSocket()) clearInterval(interval);
        }, 100);

        const timeout = setTimeout(() => clearInterval(interval), 10000);
        return () => { clearInterval(interval); clearTimeout(timeout); };
    }
}, [currentUser?.id]);
```

#### Обработка входящих звонков
```typescript
useEffect(() => {
    if (!socket || !currentUser?.id) return;

    const handleIncomingCall = (data: IncomingCallData) => {
        console.log('📞 [LIVEKIT CALL] Incoming call received', {
            fromUserId: data.fromUserId,
            type: data.type,
            chatId: data.chatId,
            from: data.from
        });

        setIncomingCallData(data);
        setIsIncomingCall(true);
        setActiveOtherUserId(data.fromUserId);
        setCallType(data.type);
    };

    socket.on(CallEvent.INCOMING, handleIncomingCall);
    return () => socket.off(CallEvent.INCOMING, handleIncomingCall);
}, [socket, currentUser?.id]);
```

#### Инициация звонка
```typescript
const handleCallUser = useCallback(async (
    otherUserId: string,
    chatId: string,
    type: 'VIDEO' | 'AUDIO'
) => {
    setActiveOtherUserId(otherUserId);
    setRemoteUserId(otherUserId);
    setCallType(type);
    setIsInCall(true);
    setIsIncomingCall(false);

    // Отправка события через WebSocket
    if (socket) {
        socket.emit(CallEvent.INITIATE, {
            toUserId: otherUserId,
            chatId,
            type,
            // НЕ отправляем offer - LiveKit сам все сделает
        });
    }
}, [socket]);
```

**Возвращаемые значения**:
```typescript
{
    isInCall: boolean;
    callType: 'VIDEO' | 'AUDIO';
    isIncomingCall: boolean;
    incomingCallFromUserId: string | null;
    remoteUserId: string | null;
    incomingCallData: IncomingCallData | null; // ✅ Для доступа к chatId
    handleCallUser: (otherUserId, chatId, type) => Promise<void>;
    acceptCall: () => void;
    rejectCall: () => void;
    handleEndCall: () => void;
}
```

**Особенности**:
- ✅ Не использует WebRTC - только управление состоянием
- ✅ Обрабатывает только WebSocket события для уведомлений
- ⚠️ Содержит `debugger` на строке 75 - нужно удалить
- ⚠️ Polling для проверки сокета (можно оптимизировать через события)

---

### 3. CallWrapperWidget

**Расположение**: `modules/widgetes/call/CallWrapper/CallWrapperWidget.tsx`

**Назначение**: UI компонент для отображения всех состояний звонка (входящий, исходящий, активный).

#### Состояния UI

1. **Входящий звонок** (`isIncomingCall === true`):
   ```tsx
   {isIncomingCall && <CallIncoming />}
   ```
   - Показывает компонент `CallIncoming` с кнопками Принять/Отклонить

2. **Исходящий звонок** (`isInCall && !token`):
   ```tsx
   {isInCall && (!tokenData?.token || tokenLoading) && !isIncomingCall && (
       <div>Звонок {callType}... (Подключение...)</div>
   )}
   ```
   - Показывает overlay с текстом "Звонок видео/аудио..."
   - Кнопка "Отменить вызов"

3. **Активный звонок** (`isInCall && token`):
   ```tsx
   {isInCall && tokenData?.token && !tokenLoading && roomName && (
       <LiveKitRoom>
           <CallOverlay />
           <RoomAudioRenderer />
       </LiveKitRoom>
   )}
   ```

#### LiveKitVideoPlayer

**Назначение**: Кастомный компонент для отображения видео участника.

**Особенности**:
- Использует `useTracks` для получения всех треков
- Автоматически подписывается на видео треки удаленных участников
- Обрабатывает локальное и удаленное видео
- Показывает placeholder "Нет видео" если трек недоступен

**Проблемы**:
- ⚠️ Слишком много логирования (строки 69-78, 84-87, 100-103)
- ⚠️ Дублирование логики подписки на треки

#### CallOverlay

**Назначение**: Overlay для активного звонка с видео и контролами.

**Для видео звонка**:
- Удаленное видео на весь экран
- Локальное видео маленькое справа внизу (28x36 на мобильных, 56x72 на десктопе)
- Контролы внизу экрана

**Для аудио звонка**:
- Центрированный текст с именем пользователя
- Контролы по центру

**Особенности**:
- Использует `useLiveKitControls` для управления медиа
- Отслеживает подключение/отключение участников
- Автоматически завершает звонок при отключении удаленного участника

**Проблемы**:
- ⚠️ Много дублирующегося кода для подписки на треки (строки 258-269 и 280-289)
- ⚠️ Избыточное логирование (строки 201-208, 261-265, 276, 293-298)

---

### 4. useLivekitToken Hook

**Расположение**: `app/network/calls/useLivekitToken.ts`

**Назначение**: Получение JWT токена для подключения к LiveKit комнате.

**Реализация**:
```typescript
export const useLivekitToken = (roomName: string | null) => {
    const { currentUser } = useAuth();
    const api = getCalls();

    const { data, isPending: isLoading, error } = useQuery({
        queryKey: ['livekit-token', currentUser?.id, roomName],
        queryFn: () => {
            if (!currentUser?.id || !roomName) return null;
            return api.callsGetToken({ roomName, userId: currentUser.id });
        },
        enabled: !!currentUser?.id && !!roomName, // ✅ Запрос только если есть roomName
    });

    return { data, isLoading, error };
};
```

**Особенности**:
- ✅ Использует React Query для кеширования
- ✅ Запрос выполняется только если есть `roomName`
- ✅ Токен автоматически обновляется при изменении `roomName`

**Проблемы**:
- 🔴 **Дублирование**: Есть также `modules/features/call/lib/hook/livekit.hook.ts` с похожей функцией

---

### 5. useLiveKitControls Hook

**Расположение**: `modules/features/call/lib/hook/livekit-controls.hook.ts`

**Назначение**: Управление медиа (микрофон, камера) в LiveKit.

**Реализация**:
```typescript
const toggleAudio = () => {
    const newState = !localParticipant.isMicrophoneEnabled;
    localParticipant.setMicrophoneEnabled(newState);
    setIsAudioMute(!newState);
};

const toggleVideo = () => {
    const newState = !localParticipant.isCameraEnabled;
    localParticipant.setCameraEnabled(newState);
    setIsVideoOnHold(!newState);
};
```

**Особенности**:
- ✅ Простая и понятная реализация
- ✅ Работает напрямую с `LocalParticipant` API
- ⚠️ Состояние `isAudioMute` и `isVideoOnHold` может рассинхронизироваться с реальным состоянием LiveKit
- ⚠️ Есть метод `updateMediaState`, но он не используется автоматически

---

### 6. Backend: CallsGateway

**Расположение**: `apps/api/src/modules/calls/socket/calls.gateway.ts`

**Назначение**: WebSocket Gateway для обработки событий звонков.

**События**:

#### call:initiate
```typescript
@SubscribeMessage(CallEvent.INITIATE)
async handleCallInitiate(data: CallInitiateDto, client: Socket) {
    // 1. Создает запись в БД
    const call = await this.callsService.createCall({
        chatId: data.chatId,
        initiatorId: userId,
        receiverId: data.toUserId,
        type: data.type || CallType.VIDEO,
    });

    // 2. Отправляет событие входящего звонка
    this.server.to(`user:${data.toUserId}`).emit(CallEvent.INCOMING, {
        from: client.id,
        fromUserId: userId,
        callId: call.id,
        chatId: data.chatId,
        type: data.type
    });
}
```

#### call:accepted
```typescript
@SubscribeMessage(CallEvent.ACCEPTED)
async handleCallAccepted(data: CallAcceptedDto, client: Socket) {
    // Обновляет статус звонка в БД
    await this.callsService.updateCallStatus(callId, CallStatus.ACCEPTED);

    // Уведомляет инициатора
    this.server.to(`user:${data.toUserId}`).emit(CallEvent.ACCEPTED, {...});
}
```

#### call:end
```typescript
@SubscribeMessage(CallEvent.END)
async handleCallEnd(data: CallEndDto, client: Socket) {
    // Завершает звонок в БД
    await this.callsService.endCall(callId, data.duration);

    // Уведомляет другую сторону
    this.server.to(`user:${data.toUserId}`).emit(CallEvent.END, {...});
}
```

**Особенности**:
- ✅ Использует персональные комнаты `user:${userId}` для маршрутизации
- ✅ Сохраняет маппинг `socketId -> callId` для отслеживания звонков
- ⚠️ Содержит неиспользуемые события для WebRTC:
  - `PEER_NEGO_NEEDED` (строки 151-160)
  - `PEER_NEGO_FINAL` (строки 162-171)
  - `PEER_ICE_CANDIDATE` (строки 222-239)

---

## Потоки работы

### Поток 1: Инициация звонка

```
1. Пользователь A нажимает "Позвонить"
   └─> handleCallUser(otherUserId, chatId, 'VIDEO')
       └─> GlobalCallProvider.handleCallUser()
           ├─> setActiveChatId(chatId)
           ├─> setActiveOtherUserId(otherUserId)
           └─> liveKitCall.handleCallUser()
               ├─> setIsInCall(true)
               ├─> setCallType('VIDEO')
               └─> socket.emit('call:initiate', {toUserId, chatId, type})

2. Backend получает событие
   └─> CallsGateway.handleCallInitiate()
       ├─> Создает запись в БД
       └─> server.to(`user:${toUserId}`).emit('call:incoming', {...})

3. Пользователь B получает событие
   └─> useLiveKitCall.handleIncomingCall()
       ├─> setIncomingCallData(data)
       ├─> setIsIncomingCall(true)
       └─> CallWrapperWidget показывает CallIncoming

4. Пользователь A видит UI
   └─> CallWrapperWidget показывает "Звонок видео... (Подключение...)"
       └─> useLivekitToken запрашивает токен
           └─> POST /api/calls/token {roomName: 'chat-${chatId}'}
```

### Поток 2: Принятие звонка

```
1. Пользователь B нажимает "Принять"
   └─> CallIncoming.acceptCall()
       └─> GlobalCallProvider.acceptCall()
           ├─> setActiveChatId(incomingData.chatId) // ✅ КРИТИЧНО: ПЕРЕД acceptCall
           ├─> setActiveOtherUserId(incomingData.fromUserId)
           └─> liveKitCall.acceptCall()
               ├─> setIsInCall(true)
               ├─> setIsIncomingCall(false)
               └─> socket.emit('call:accepted', {toUserId})

2. Backend получает событие
   └─> CallsGateway.handleCallAccepted()
       ├─> Обновляет статус в БД
       └─> server.to(`user:${toUserId}`).emit('call:accepted', {...})

3. Оба пользователя подключаются к LiveKit
   └─> CallWrapperWidget получает токен
       └─> LiveKitRoom подключается
           ├─> room.connect()
           ├─> Автоматически получает медиа потоки
           └─> CallOverlay показывает видео
```

### Поток 3: Активный звонок

```
1. LiveKitRoom подключен
   └─> room.state === 'connected'
       └─> CallOverlay инициализируется
           ├─> Получает localParticipant
           ├─> Получает remoteParticipants
           └─> Подписывается на треки

2. Отображение видео
   └─> LiveKitVideoPlayer
       ├─> useTracks получает все треки
       ├─> Находит видео трек для участника
       ├─> track.attach(videoElement)
       └─> videoElement.play()

3. Управление медиа
   └─> CallControls
       └─> useLiveKitControls
           ├─> toggleAudio() -> localParticipant.setMicrophoneEnabled()
           └─> toggleVideo() -> localParticipant.setCameraEnabled()
```

### Поток 4: Завершение звонка

```
1. Пользователь нажимает "Завершить"
   └─> CallControls.onEndCall()
       └─> CallOverlay.handleEndCallLiveKit()
           ├─> room.disconnect()
           └─> handleEndCall()
               └─> socket.emit('call:end', {toUserId})

2. Backend получает событие
   └─> CallsGateway.handleCallEnd()
       ├─> Завершает звонок в БД
       └─> server.to(`user:${toUserId}`).emit('call:end', {...})

3. Другая сторона получает событие
   └─> useLiveKitCall.handleCallEnd()
       ├─> setIsInCall(false)
       └─> CallWrapperWidget скрывает overlay
```

---

## Схема данных

### WebSocket события

#### call:initiate (Client -> Server)
```typescript
{
    toUserId: string;
    chatId: string;
    type: 'VIDEO' | 'AUDIO';
    // offer больше не используется (было для WebRTC)
}
```

#### call:incoming (Server -> Client)
```typescript
{
    from: string;           // socketId инициатора
    fromUserId: string;     // userId инициатора
    callId: string;         // ID звонка в БД
    chatId: string;         // ID чата
    type: 'VIDEO' | 'AUDIO';
    // offer больше не используется
}
```

#### call:accepted (Client -> Server, Server -> Client)
```typescript
{
    toUserId: string;
    callId?: string;
    // ans больше не используется (было для WebRTC)
}
```

#### call:end (Client -> Server, Server -> Client)
```typescript
{
    toUserId: string;
    callId?: string;
    duration?: number;      // Длительность звонка в секундах
}
```

### LiveKit токен

**Endpoint**: `POST /api/calls/token`

**Request**:
```typescript
{
    roomName: string;  // Например: "chat-123"
    userId: string;    // ID пользователя
}
```

**Response**:
```typescript
{
    token: string;     // JWT токен для LiveKit
}
```

**Токен содержит**:
- `identity`: userId
- `room`: roomName
- `canPublish`: true
- `canSubscribe`: true

---

## Слабые места и проблемы

### 🔴 Критические проблемы

#### 1. Дублирование useLivekitToken
**Проблема**: Есть два файла с одинаковой функцией:
- `app/network/calls/useLivekitToken.ts` (используется в CallWrapperWidget)
- `modules/features/call/lib/hook/livekit.hook.ts` (дубликат?)

**Решение**:
- Проверить, используется ли второй файл
- Если нет - удалить
- Если используется - объединить в один файл в `modules/features/call/lib/hook/`

#### 2. Закомментированный WebRTC код
**Проблема**: В `GlobalCallProvider` есть закомментированный код для WebRTC (строки 110-140).

**Решение**: Удалить закомментированный код, так как миграция завершена.

#### 3. Debugger в production коде
**Проблема**: В коде есть `debugger`:
- `global-call-provider.tsx`: строки 149, 153, 157
- `livekit-call.hook.ts`: строка 75

**Решение**: Удалить все `debugger` из production кода.

#### 4. Неиспользуемые WebSocket события на бэкенде
**Проблема**: В `CallsGateway` есть обработчики для WebRTC событий:
- `PEER_NEGO_NEEDED` (строки 151-160)
- `PEER_NEGO_FINAL` (строки 162-171)
- `PEER_ICE_CANDIDATE` (строки 222-239)

**Решение**: Удалить или пометить как deprecated, если не используются.

#### 5. Закомментированный CallWrapperWidget в [chatId]/page.tsx
**Проблема**: В `app/network/chats/[chatId]/page.tsx` есть закомментированный `CallWrapperWidget` (строки 100, 121).

**Решение**: Удалить закомментированный код, так как `CallWrapperWidget` уже используется в `layout.tsx`.

### 🟡 Средние проблемы

#### 6. Избыточное логирование
**Проблема**: Слишком много `console.log` в production коде:
- `CallWrapperWidget.tsx`: строки 69-78, 84-87, 100-103, 201-208, 261-265, 276, 293-298, 461-471
- `livekit-call.hook.ts`: множественные логи
- `livekit-controls.hook.ts`: строки 32, 44

**Решение**:
- Использовать систему логирования (например, через logger)
- Оставить только критичные логи
- Добавить уровни логирования (debug, info, error)
- Использовать `process.env.NODE_ENV === 'development'` для debug логов

#### 7. Дублирование логики подписки на треки
**Проблема**: В `CallOverlay` логика подписки на треки дублируется:
- Строки 258-269: для уже подключенных участников
- Строки 280-289: для новых участников

**Решение**: Вынести в отдельную функцию `subscribeToParticipantTracks(participant)`.

#### 8. Рассинхронизация состояния медиа
**Проблема**: В `useLiveKitControls` состояние `isAudioMute` и `isVideoOnHold` может не совпадать с реальным состоянием LiveKit.

**Решение**:
- Использовать события LiveKit для синхронизации
- Или получать состояние напрямую из `localParticipant.isMicrophoneEnabled`

#### 9. Неоптимальная проверка сокета
**Проблема**: В `useLiveKitCall` проверка сокета происходит каждые 100ms с таймаутом 10s (polling).

**Решение**:
- Использовать события `socketManager` для уведомления о подключении
- Или увеличить интервал проверки до 1s

#### 10. Магические строки
**Проблема**: В коде есть магические строки:
- `'chat-${chatId}'` для roomName
- `'user:${userId}'` для WebSocket комнат

**Решение**: Вынести в константы или функции-хелперы.

### 🟢 Мелкие улучшения

#### 11. Типы данных
**Проблема**: В `webrtc.types.ts` есть поля `offer` и `ans`, которые больше не используются для LiveKit.

**Решение**:
- Создать отдельные типы для LiveKit (`livekit.types.ts`)
- Или пометить неиспользуемые поля как optional/deprecated

#### 12. Обработка ошибок LiveKit
**Проблема**: В `CallWrapperWidget` есть список игнорируемых ошибок (строки 535-539), но он может быть неполным.

**Решение**:
- Использовать типы ошибок LiveKit (`DisconnectReason`)
- Добавить более детальную обработку ошибок
- Логировать все ошибки для анализа

#### 13. Отсутствие обработки переподключения
**Проблема**: Нет явной обработки событий `onReconnecting` и `onReconnected` в `LiveKitRoom`.

**Решение**: Добавить обработчики для улучшения UX.

---

## Рекомендации по рефакторингу

### Приоритет 1: Критические исправления

#### 1. Удалить неиспользуемый код
```typescript
// Удалить:
- Закомментированный код в GlobalCallProvider (строки 110-140)
- Все debugger (global-call-provider.tsx: 149, 153, 157; livekit-call.hook.ts: 75)
- Закомментированный CallWrapperWidget в [chatId]/page.tsx
- WebRTC обработчики в CallsGateway (если не используются)
- Дубликат useLivekitToken (если есть)
```

#### 2. Исправить дублирование useLivekitToken
```typescript
// Оставить один файл:
// modules/features/call/lib/hook/use-livekit-token.hook.ts
// И использовать его везде

// Переименовать для консистентности:
// useLivekitToken -> useLiveKitToken (с большой K)
```

#### 3. Создать константы
```typescript
// constants/livekit.constants.ts
export const LIVEKIT_ROOM_PREFIX = 'chat-';
export const SOCKET_USER_ROOM_PREFIX = 'user:';

export const getLiveKitRoomName = (chatId: string) =>
    `${LIVEKIT_ROOM_PREFIX}${chatId}`;

export const getSocketUserRoom = (userId: string) =>
    `${SOCKET_USER_ROOM_PREFIX}${userId}`;
```

### Приоритет 2: Улучшение архитектуры

#### 4. Рефакторинг CallOverlay
```typescript
// Вынести логику подписки на треки
const subscribeToParticipantTracks = useCallback((participant: RemoteParticipant) => {
    participant.trackPublications.forEach((publication) => {
        if (publication.kind === 'video' && !publication.isSubscribed) {
            console.log('📡 [LIVEKIT] Auto-subscribing to video track', {
                participant: participant.identity,
                trackSid: publication.trackSid,
                source: publication.source,
            });
            publication.setSubscribed(true);
        }
    });

    // Отслеживаем новые публикации
    participant.on('trackPublished', (publication) => {
        if (publication.kind === 'video' && !publication.isSubscribed) {
            publication.setSubscribed(true);
        }
    });
}, []);

// Использовать в одном месте
useEffect(() => {
    if (!room) return;

    const updateParticipants = () => {
        const remoteParticipants = Array.from(room.remoteParticipants.values());
        setParticipants(remoteParticipants);
        setLocalParticipant(room.localParticipant);

        // Подписываемся на треки всех участников
        remoteParticipants.forEach(subscribeToParticipantTracks);
    };

    updateParticipants();

    room.on('participantConnected', (participant) => {
        subscribeToParticipantTracks(participant);
        updateParticipants();
    });

    // ...
}, [room, subscribeToParticipantTracks]);
```

#### 5. Улучшить useLiveKitControls
```typescript
// Использовать события LiveKit для синхронизации
useEffect(() => {
    if (!localParticipant) return;

    const updateState = () => {
        setIsAudioMute(!localParticipant.isMicrophoneEnabled);
        setIsVideoOnHold(!localParticipant.isCameraEnabled);
    };

    // Обновляем сразу
    updateState();

    // Подписываемся на изменения
    localParticipant.on('trackMuted', updateState);
    localParticipant.on('trackUnmuted', updateState);

    return () => {
        localParticipant.off('trackMuted', updateState);
        localParticipant.off('trackUnmuted', updateState);
    };
}, [localParticipant]);
```

#### 6. Улучшить логирование
```typescript
// utils/logger.ts
const logger = {
    debug: (message: string, data?: any) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${message}`, data);
        }
    },
    info: (message: string, data?: any) => {
        console.log(`[INFO] ${message}`, data);
    },
    warn: (message: string, data?: any) => {
        console.warn(`[WARN] ${message}`, data);
    },
    error: (message: string, error?: any) => {
        console.error(`[ERROR] ${message}`, error);
    }
};

// Использовать вместо console.log
logger.debug('📞 [LIVEKIT CALL] Incoming call received', data);
```

#### 7. Оптимизировать проверку сокета
```typescript
// Использовать события вместо polling
useEffect(() => {
    if (!currentUser?.id) return;

    const initSocket = () => {
        if (socketManager.isConnected()) {
            setSocket(socketManager.getSocket());
            return true;
        }
        return false;
    };

    // Проверяем сразу
    if (initSocket()) return;

    // Подписываемся на события подключения
    const socket = socketManager.getSocketSafe();
    if (socket) {
        const onConnect = () => {
            setSocket(socket);
        };

        socket.on('connect', onConnect);

        // Если уже подключен
        if (socket.connected) {
            setSocket(socket);
        }

        return () => {
            socket.off('connect', onConnect);
        };
    }
}, [currentUser?.id]);
```

### Приоритет 3: Дополнительные улучшения

#### 8. Улучшить обработку ошибок LiveKit
```typescript
import { DisconnectReason } from 'livekit-client';

<LiveKitRoom
    onDisconnected={(reason) => {
        logger.info('🔌 [LIVEKIT] Disconnected', { reason });

        // Пользователь сам отключился - не завершаем звонок
        if (reason === DisconnectReason.CLIENT_INITIATED) {
            return;
        }

        // Другие причины - логируем
        logger.warn('⚠️ [LIVEKIT] Unexpected disconnect', { reason });
    }}
    onReconnecting={() => {
        logger.info('🔄 [LIVEKIT] Reconnecting...');
        // Можно показать индикатор переподключения
    }}
    onReconnected={() => {
        logger.info('✅ [LIVEKIT] Reconnected');
    }}
    onError={(error) => {
        logger.error('❌ [LIVEKIT] Room error', error);

        // Критические ошибки
        const criticalErrors = [
            'authentication failed',
            'token expired',
            'room not found'
        ];

        const isCritical = criticalErrors.some(err =>
            error?.message?.toLowerCase().includes(err)
        );

        if (isCritical) {
            logger.error('❌ [LIVEKIT] Critical error, ending call');
            handleEndCall();
        }
    }}
/>
```

#### 9. Создать типы для LiveKit
```typescript
// types/livekit.types.ts
export interface LiveKitCallData {
    fromUserId: string;
    chatId: string;
    type: 'VIDEO' | 'AUDIO';
    // Без offer/ans - они не нужны для LiveKit
}

export interface LiveKitCallInitiateData {
    toUserId: string;
    chatId: string;
    type: 'VIDEO' | 'AUDIO';
}

export interface LiveKitCallIncomingData {
    from: string;
    fromUserId: string;
    callId: string;
    chatId: string;
    type: 'VIDEO' | 'AUDIO';
}
```

#### 10. Улучшить UI состояний
```typescript
// Добавить индикатор качества соединения
const ConnectionQuality = () => {
    const room = useRoom();
    const quality = room?.localParticipant?.connectionQuality;

    if (!quality) return null;

    const colors = {
        excellent: 'bg-green-500',
        good: 'bg-yellow-500',
        poor: 'bg-red-500',
        unknown: 'bg-gray-500'
    };

    return (
        <div className={`w-2 h-2 rounded-full ${colors[quality] || colors.unknown}`} />
    );
};

// Показывать статус подключения
{room?.state === 'reconnecting' && (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded">
        Переподключение...
    </div>
)}
```

---

## Сравнение с WebRTC

| Аспект | WebRTC (старый) | LiveKit (текущий) |
|--------|----------------|-------------------|
| **Настройка** | Сложная (STUN/TURN) | Простая (только токен) |
| **Стабильность** | Зависит от NAT | Высокая (через сервер) |
| **Масштабируемость** | Только P2P (2 участника) | Групповые звонки |
| **Управление медиа** | Вручную (getUserMedia, addTrack) | Автоматически |
| **Signaling** | WebSocket (offer/answer/ICE) | WebSocket (только уведомления) |
| **UI компоненты** | Нужно делать самому | Готовые компоненты |
| **Сервер** | Не нужен (P2P) | Нужен LiveKit сервер |
| **Код** | ~1358 строк (call-engine.hook.ts) | ~229 строк (livekit-call.hook.ts) |
| **Сложность** | Высокая | Низкая |

---

## Зависимости

### Frontend
```json
{
    "@livekit/components-react": "^X.X.X",
    "@livekit/components-styles": "^X.X.X",
    "livekit-client": "^X.X.X"
}
```

### Backend
```json
{
    "livekit-server-sdk": "^X.X.X"
}
```

### Переменные окружения

**Frontend**:
- `NEXT_PUBLIC_LIVEKIT_URL` - URL LiveKit сервера (например, `https://ws.sociopath-network.ru`)

**Backend**:
- `LIVEKIT_API_KEY` - API ключ LiveKit
- `LIVEKIT_API_SECRET` - API секрет LiveKit

---

## Документация LiveKit

- [LiveKit Docs](https://docs.livekit.io/)
- [LiveKit React Components](https://docs.livekit.io/client-sdk-react/)
- [LiveKit Server SDK](https://docs.livekit.io/server-api/)
- [LiveKit Best Practices](https://docs.livekit.io/guides/best-practices/)

---

## Заключение

Система звонков успешно мигрирована на LiveKit. Основные преимущества:
- ✅ Упрощенный код (меньше строк, проще логика)
- ✅ Лучшая стабильность соединений
- ✅ Готовность к групповым звонкам
- ✅ Автоматическое управление медиа

**Следующие шаги**:
1. ✅ Удалить неиспользуемый код (WebRTC, debugger, закомментированный код)
2. ✅ Исправить дублирование (useLivekitToken)
3. ✅ Улучшить обработку ошибок и логирование
4. ✅ Оптимизировать код (вынести дублирующуюся логику)
5. ✅ Добавить обработку переподключений и улучшить UX

**Оценка готовности**: ~85%
- Основной функционал работает
- Требуется рефакторинг и очистка кода
- Нужны улучшения UX (индикаторы состояния, обработка ошибок)
