# Чат и WebRTC

## Обзор

В проекте реализованы два типа чатов:
1. **Обычные чаты** - через WebSocket и REST API
2. **Секретные чаты** - через WebRTC для P2P соединения

## Обычные чаты

### Архитектура

Обычные чаты работают через:
- **REST API** - для получения истории сообщений, отправки сообщений
- **WebSocket (Socket.IO)** - для real-time обновлений

### Компоненты

- `entities/chats` - работа с чатами
- `entities/messages` - работа с сообщениями
- `widgetes/chat` - UI виджеты для чатов

### Поток работы

1. **Получение списка чатов**: REST API → `useUserChats()`
2. **Открытие чата**: REST API → `useChatMessages(chatId)`
3. **Отправка сообщения**: REST API → `useSendMessage()`
4. **Real-time обновления**: WebSocket → автоматическое обновление через `useChatSocket()`

### WebSocket события

- `message:new` - новое сообщение
- `message:update` - обновление сообщения
- `chat:update` - обновление чата
- `chat:new` - новый чат

---

## Секретные чаты (WebRTC)

### Назначение

Секретные чаты используют **WebRTC** для создания прямого P2P соединения между пользователями, что обеспечивает:
- **Шифрование** - данные передаются напрямую между пользователями
- **Приватность** - сообщения не проходят через сервер
- **Безопасность** - только участники чата могут видеть сообщения

### Архитектура WebRTC

WebRTC использует:
- **STUN серверы** - для определения публичного IP адреса
- **TURN серверы** (опционально) - для обхода NAT
- **Signaling** - для обмена SDP (Session Description Protocol) через WebSocket

### Компоненты

#### 1. PeerService

**Расположение**: `modules/shared/lib/webrtc/peer-service.ts`

**Назначение**: Управление RTCPeerConnection

**Методы**:
```typescript
class PeerService {
    get connection(): RTCPeerConnection | null
    setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>
    getAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>
    getOffer(): Promise<RTCSessionDescriptionInit>
    toggleAudio(): void
    toggleVideo(): void
    addTrack(track: MediaStreamTrack, stream: MediaStream): void
    close(): void
    recreate(): void
    isAudioEnabled(): boolean
    isVideoEnabled(): boolean
}
```

#### 2. WebRTC Config

**Расположение**: `modules/shared/lib/webrtc/webrtc.config.ts`

**Конфигурация**:
```typescript
export const WEBRTC_CONFIG: RTCConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:global.stun.twilio.com:3478',
            ],
        },
    ],
};
```

### Поток установления соединения

#### 1. Инициация звонка (Caller)

```
1. Caller создает RTCPeerConnection
2. Caller добавляет медиа треки (аудио/видео)
3. Caller создает offer через createOffer()
4. Caller устанавливает local description
5. Caller отправляет offer через WebSocket другому пользователю
```

#### 2. Принятие звонка (Callee)

```
1. Callee получает offer через WebSocket
2. Callee создает RTCPeerConnection
3. Callee устанавливает remote description (offer)
4. Callee добавляет медиа треки
5. Callee создает answer через createAnswer()
6. Callee устанавливает local description
7. Callee отправляет answer через WebSocket Caller'у
```

#### 3. Завершение установки

```
1. Caller получает answer через WebSocket
2. Caller устанавливает remote description (answer)
3. ICE candidates обмениваются через WebSocket
4. Соединение устанавливается (ICE connection)
5. Медиа потоки начинают передаваться
```

### Код примера

```typescript
// Инициация звонка
const peerService = new PeerService();

// Получаем медиа потоки
const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
});

// Добавляем треки
stream.getTracks().forEach(track => {
    peerService.addTrack(track, stream);
});

// Создаем offer
const offer = await peerService.getOffer();

// Отправляем offer через WebSocket
socket.emit('webrtc:offer', { offer, to: userId });

// Получаем answer
socket.on('webrtc:answer', async ({ answer }) => {
    await peerService.setRemoteDescription(answer);
});

// Получаем ICE candidates
socket.on('webrtc:ice-candidate', async ({ candidate }) => {
    if (peerService.connection) {
        await peerService.connection.addIceCandidate(candidate);
    }
});
```

### WebSocket события для WebRTC

- `webrtc:offer` - отправка/получение offer
- `webrtc:answer` - отправка/получение answer
- `webrtc:ice-candidate` - обмен ICE candidates
- `webrtc:end` - завершение соединения

#### 3. CallWrapper Widget

**Расположение**: `modules/widgetes/call/CallWrapper/CallWrapperWidget.tsx`

**Назначение**: Глобальный виджет-обертка для управления UI звонков во всем приложении. Обеспечивает отображение входящих, исходящих и активных звонков поверх всего контента приложения.

**Архитектура**:

CallWrapper использует глобальный контекст `useGlobalCallContext()`, который предоставляет:
- Состояние звонка (`isInCall`, `callType`, `isIncomingCall`)
- Медиа потоки (`myStream`, `remoteStream`)
- Управление звонком (`handleToggleAudio`, `handleToggleVideo`, `handleEndCall`, `acceptCall`, `rejectCall`)
- Информацию о пользователях (`remoteUserId`, `incomingCallFromUserId`)

**Состояния UI**:

1. **Входящий звонок** (`isIncomingCall === true`):
   - Показывается компонент `CallIncoming`
   - Отображает информацию о звонящем пользователе
   - Кнопки "Принять" и "Отклонить"

2. **Исходящий звонок** (`isInCall === true && !remoteStream && !isIncomingCall`):
   - Показывается overlay с текстом "Звонок видео/аудио..."
   - Кнопка "Отменить вызов"
   - Ожидание ответа от принимающей стороны

3. **Активный звонок** (`isInCall === true && remoteStream`):
   - **Видео звонок** (`callType === 'VIDEO'`):
     - Полноэкранное удаленное видео (на весь экран)
     - Маленькое локальное видео (справа внизу, 28x36 на мобильных, 56x72 на десктопе)
     - Контролы внизу экрана (`CallControls`)
   - **Аудио звонок** (`callType === 'AUDIO'`):
     - Центрированный текст "Аудио звонок"
     - Контролы по центру экрана

**Компоненты**:

- `CallWrapperWidget` - основной компонент-обертка
- `CallIncoming` - компонент для входящих звонков
- `CallControls` - компонент с кнопками управления (микрофон, камера, завершить)
- `VideoPlayer` - компонент для отображения видео потока

**Интеграция**:

CallWrapper оборачивает все приложение и должен быть размещен на верхнем уровне (обычно в `layout.tsx`):

```typescript
// app/network/layout.tsx
import { CallWrapperWidget } from '@/modules/widgetes/call/CallWrapper';
import { GlobalCallProvider } from '@/modules/features/call/lib/context/global-call-provider';

export default function NetworkLayout({ children }) {
    return (
        <GlobalCallProvider>
            <CallWrapperWidget>
                {children}
            </CallWrapperWidget>
        </GlobalCallProvider>
    );
}
```

**Поток работы**:

1. **Инициация звонка**:
   - Пользователь вызывает `handleCallUser(otherUserId, chatId, type)`
   - CallWrapper показывает overlay "Звонок видео/аудио..."
   - Через WebSocket отправляется сигнал принимающей стороне

2. **Входящий звонок**:
   - Принимающая сторона получает сигнал через WebSocket
   - `GlobalCallProvider` устанавливает `isIncomingCall = true`
   - CallWrapper показывает `CallIncoming` компонент

3. **Принятие звонка**:
   - Принимающая сторона вызывает `acceptCall()`
   - Устанавливается WebRTC соединение
   - `remoteStream` становится доступным
   - CallWrapper переключается на активный звонок UI

4. **Активный звонок**:
   - Обе стороны имеют `myStream` и `remoteStream`
   - CallWrapper показывает полноэкранный overlay с видео/аудио
   - Пользователи могут управлять микрофоном, камерой, завершить звонок

5. **Завершение звонка**:
   - Любая сторона вызывает `handleEndCall()`
   - WebRTC соединение закрывается
   - Медиа потоки останавливаются
   - CallWrapper скрывает overlay

**Зависимости**:

- `useGlobalCallContext()` - глобальный контекст звонков
- `useUser(remoteUserId)` - получение данных пользователя для отображения имени
- `VideoPlayer` - компонент для отображения видео
- `CallControls` - компонент управления звонком
- `CallIncoming` - компонент входящего звонка

**Важные детали**:

- CallWrapper использует `fixed inset-0 z-50` для overlay, чтобы показываться поверх всего контента
- Локальное видео имеет меньший размер и позиционируется абсолютно в правом нижнем углу
- Удаленное видео занимает весь экран
- Контролы всегда видны внизу экрана для видео звонков
- Все состояния отслеживаются через React hooks и контекст

### Состояния соединения

RTCPeerConnection имеет несколько состояний:

- `new` - создано, но еще не настроено
- `have-local-offer` - установлен local offer
- `have-remote-offer` - установлен remote offer
- `have-local-pranswer` - установлен local pranswer
- `have-remote-pranswer` - установлен remote pranswer
- `stable` - соединение установлено

### Обработка ошибок

```typescript
peerService.connection?.addEventListener('iceconnectionstatechange', () => {
    const state = peerService.connection?.iceConnectionState;

    if (state === 'failed') {
        // Соединение не удалось установить
        console.error('ICE connection failed');
    } else if (state === 'disconnected') {
        // Соединение разорвано
        console.warn('ICE connection disconnected');
    } else if (state === 'connected') {
        // Соединение установлено
        console.log('ICE connection established');
    }
});
```

---

## Переход на LiveKit

### Текущее состояние

В проекте есть тестовая страница `/network/calls` для проверки работы LiveKit:
- `app/network/calls/page.tsx` - тестовая страница
- `modules/features/call/ui/LiveKitTest.tsx` - тестовый компонент
- `app/network/calls/useLivekitToken.ts` - хук для получения токена

### Задача

Необходимо перевести чаты с WebRTC на LiveKit для:
- Лучшей стабильности соединений
- Упрощения настройки (не нужны STUN/TURN серверы)
- Масштабируемости (поддержка групповых звонков)
- Готовых UI компонентов

### Получение токена LiveKit

#### API Endpoint

**Backend**: `POST /api/calls/token`

**Расположение**: `apps/api/src/modules/calls/controllers/calls.controller.ts`

**Request Body**:
```typescript
{
    roomName: string;  // Имя комнаты (обычно chatId или уникальный идентификатор)
    userId: string;    // ID пользователя
}
```

**Response**:
```typescript
{
    token: string;  // JWT токен для подключения к LiveKit
}
```

#### Backend реализация

**Сервис**: `apps/api/src/modules/calls/services/live-kit.service.ts`

```typescript
import { AccessToken } from 'livekit-server-sdk';

export class LiveKitService {
    private readonly apiKey = process.env.LIVEKIT_API_KEY;
    private readonly apiSecret = process.env.LIVEKIT_API_SECRET;

    async generateToken(roomName: string, participantIdentity: string) {
        const at = new AccessToken(this.apiKey, this.apiSecret, {
            identity: participantIdentity,
        });

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
        });

        return at.toJwt();
    }
}
```

**Переменные окружения** (требуются на backend):
- `LIVEKIT_API_KEY` - API ключ LiveKit сервера
- `LIVEKIT_API_SECRET` - API секрет LiveKit сервера

#### Frontend получение токена

**Хук**: `app/network/calls/useLivekitToken.ts`

```typescript
import { useAuth } from "@/modules/processes";
import { useQuery } from "@tanstack/react-query";
import { getCalls } from "@workspace/nest-api";

export const useLivekitToken = (roomName: string) => {
    const { currentUser } = useAuth();
    const api = getCalls()
    const { data, isPending: isLoading, error } = useQuery({
        queryKey: ['livekit-token', currentUser?.id, roomName],
        queryFn: () => currentUser?.id
            ? api.callsGetToken({
                roomName,
                userId: currentUser.id
            })
            : null,
    })

    return { data, isLoading, error };
}
```

**Использование**:
```typescript
const { data, isLoading, error } = useLivekitToken('room1');
const token = data?.token;
```

### LiveKit компоненты

**Базовый компонент**: `modules/features/call/ui/LiveKitTest.tsx`

```typescript
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'https://ws.sociopath-network.ru';

export const VideoCall = ({ token }: { token: string }) => {
    return (
        <div className="h-screen">
            <LiveKitRoom
                video={true}
                audio={true}
                token={token}
                serverUrl={LIVEKIT_URL}
                connect={true}
            >
                <VideoConference />
                <RoomAudioRenderer />
            </LiveKitRoom>
        </div>
    );
};
```

**Переменные окружения** (требуются на frontend):
- `NEXT_PUBLIC_LIVEKIT_URL` - URL LiveKit сервера (например, `https://ws.sociopath-network.ru`)

### Миграция CallWrapper на LiveKit

**Текущая реализация** использует:
- `PeerService` для WebRTC соединений
- `useCallEngine` для управления звонками
- WebSocket для signaling
- `MediaStream` для локального и удаленного видео

**Целевая реализация** должна использовать:
- `LiveKitRoom` вместо `RTCPeerConnection`
- `useRoom` hook из `@livekit/components-react` вместо `useCallEngine`
- LiveKit токены вместо WebSocket signaling
- LiveKit tracks вместо `MediaStream`

**План миграции CallWrapper**:

1. **Заменить получение медиа потоков**:
   - Убрать `getUserMedia()` вызовы
   - LiveKit автоматически получает медиа при подключении к комнате

2. **Заменить управление соединением**:
   - Убрать `PeerService` и `useCallEngine`
   - Использовать `useRoom()` hook из LiveKit
   - Убрать WebSocket события для WebRTC

3. **Обновить UI компоненты**:
   - Заменить `VideoPlayer` на LiveKit компоненты (`ParticipantTile`, `TrackLoop`)
   - Использовать `VideoConference` или кастомные компоненты из LiveKit
   - Обновить `CallControls` для работы с LiveKit API

4. **Обновить получение токенов**:
   - Использовать `useLivekitToken(roomName)` вместо WebSocket signaling
   - Генерировать `roomName` на основе `chatId` или `callId`
   - Получать токен перед подключением к комнате

5. **Обновить состояния**:
   - Заменить `isInCall`, `remoteStream`, `myStream` на LiveKit состояния
   - Использовать `room.state`, `room.participants`, `room.localParticipant`
   - Обновить логику входящих/исходящих звонков

**Пример миграции CallWrapper**:

```typescript
// Новый CallWrapper с LiveKit
import { LiveKitRoom, useRoom, RoomAudioRenderer } from '@livekit/components-react';
import { useLivekitToken } from '@/app/network/calls/useLivekitToken';

const CallWrapperWidgetContent = ({ children }) => {
    const call = useGlobalCallContext();
    const { isInCall, callType, remoteUserId, chatId } = call;

    // Получаем токен для комнаты
    const roomName = chatId ? `chat-${chatId}` : null;
    const { data: tokenData, isLoading } = useLivekitToken(roomName);

    if (isInCall && tokenData?.token) {
        return (
            <LiveKitRoom
                video={callType === 'VIDEO'}
                audio={true}
                token={tokenData.token}
                serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                connect={true}
            >
                <CallWrapperContent />
                <RoomAudioRenderer />
            </LiveKitRoom>
        );
    }

    return <>{children}</>;
};

const CallWrapperContent = () => {
    const room = useRoom();
    const call = useGlobalCallContext();
    const { callType } = call;

    // Получаем участников из LiveKit
    const participants = Array.from(room.participants.values());
    const localParticipant = room.localParticipant;

    if (callType === 'VIDEO') {
        return (
            <div className="fixed inset-0 z-50 bg-black">
                {/* Удаленное видео */}
                {participants.map(participant => (
                    <ParticipantTile
                        key={participant.identity}
                        participant={participant}
                        className="absolute inset-0"
                    />
                ))}

                {/* Локальное видео */}
                <ParticipantTile
                    participant={localParticipant}
                    className="absolute bottom-24 right-4 w-56 h-72"
                />

                {/* Контролы */}
                <CallControls room={room} />
            </div>
        );
    }

    // Аудио звонок
    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            <CallControls room={room} />
        </div>
    );
};
```

---

## Сравнение подходов

| Аспект | WebRTC (текущий) | LiveKit (целевой) |
|--------|------------------|-------------------|
| **Настройка** | Сложная (STUN/TURN) | Простая (только токен) |
| **Стабильность** | Зависит от NAT | Высокая |
| **Масштабируемость** | Только P2P | Групповые звонки |
| **UI компоненты** | Нужно делать самому | Готовые компоненты |
| **Сервер** | Не нужен | Нужен LiveKit сервер |

---

## Документация

- [WebRTC MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [LiveKit Docs](https://docs.livekit.io/)
- [PeerService код](./modules/shared/lib/webrtc/peer-service.ts)
