# Переход чатов с WebRTC на LiveKit

## Текущее состояние

- Чаты используют WebRTC для секретных чатов через `PeerService` и `useCallEngine`
- Есть тестовая страница `/network/calls` для проверки LiveKit
- LiveKit работает и принимает/отдает нужные ответы
- API endpoint для получения токенов уже реализован (`POST /api/calls/token`)
- `CallWrapperWidget` управляет UI звонков через WebRTC

## Детальное описание миграции

### Этап 1: Подготовка инфраструктуры

- [x] Проверить, что LiveKit сервер запущен и доступен
- [x] Убедиться, что переменные окружения настроены:
  - Backend: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
  - Frontend: `NEXT_PUBLIC_LIVEKIT_URL`
- [x] Проверить работу API endpoint `/api/calls/token`
- [x] Протестировать получение токена через `useLivekitToken` хук
- [x] Обновить `useLivekitToken` для условного запроса (только когда есть roomName)
- [x] Добавить `chatId` в `GlobalCallContext`

### Этап 2: Миграция CallWrapper

**Файл**: `apps/front/modules/widgetes/call/CallWrapper/CallWrapperWidget.tsx`

**Текущая реализация**:
- Использует `useGlobalCallContext()` для получения состояния звонка
- Работает с `MediaStream` для `myStream` и `remoteStream`
- Показывает overlay с `VideoPlayer` компонентами
- Управляет состояниями через `useCallEngine` и `PeerService`

**Что нужно изменить**:

1. **Заменить получение медиа потоков**:
   - [x] Убрать зависимость от `useCallMedia` и `getUserMedia()`
   - [x] LiveKit автоматически получает медиа при подключении к комнате
   - [x] Убрать `myStream` и `remoteStream` из контекста (заменить на LiveKit participants)

2. **Заменить управление соединением**:
   - [x] Убрать зависимость от `useCallEngine` и `PeerService` (частично, для обратной совместимости оставлен)
   - [x] Интегрировать `LiveKitRoom` компонент в CallWrapper
   - [x] Использовать `RoomContext` для получения состояния комнаты
   - [x] Убрать WebSocket события для WebRTC (`webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`) - LiveKit использует токены

3. **Обновить получение токенов**:
   - [x] Интегрировать `useLivekitToken(roomName)` в CallWrapper
   - [x] Генерировать `roomName` на основе `chatId`: `chat-${chatId}`
   - [x] Получать токен перед подключением к комнате (только когда `isInCall === true` и есть `chatId`)
   - [x] Обрабатывать состояния загрузки токена

4. **Обновить UI компоненты**:
   - [x] Заменить `VideoPlayer` на LiveKit компоненты:
     - `ParticipantTile` для отображения участников
     - Сохранен внешний вид (удаленное видео на весь экран, локальное справа внизу)
   - [x] Обновить `CallControls` для работы с LiveKit API:
     - Использовать `room.localParticipant.setMicrophoneEnabled()`
     - Использовать `room.localParticipant.setCameraEnabled()`
     - Использовать `room.disconnect()` для завершения звонка
   - [x] Обновить логику отображения локального/удаленного видео

5. **Обновить состояния**:
   - [x] Использовать `room.state === 'connected'` для проверки подключения
   - [x] Заменить `remoteStream` на `room.remoteParticipants` (массив участников)
   - [x] Заменить `myStream` на `room.localParticipant`
   - [x] Обновить логику входящих/исходящих звонков (через WebSocket события для уведомлений, LiveKit для медиа)

**Пример структуры нового CallWrapper**:

```typescript
// CallWrapperWidget.tsx (новая версия)
import { LiveKitRoom, useRoom, RoomAudioRenderer, ParticipantTile } from '@livekit/components-react';
import { useLivekitToken } from '@/app/network/calls/useLivekitToken';

const CallWrapperWidgetContent = ({ children }) => {
    const call = useGlobalCallContext();
    const { isInCall, callType, chatId } = call;

    // Генерируем roomName на основе chatId
    const roomName = chatId ? `chat-${chatId}` : null;
    const { data: tokenData, isLoading: tokenLoading } = useLivekitToken(roomName);

    // Показываем overlay только если есть активный звонок и токен
    if (isInCall && tokenData?.token && !tokenLoading) {
        return (
            <>
                {children}
                <LiveKitRoom
                    video={callType === 'VIDEO'}
                    audio={true}
                    token={tokenData.token}
                    serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                    connect={true}
                >
                    <CallOverlay callType={callType} />
                    <RoomAudioRenderer />
                </LiveKitRoom>
            </>
        );
    }

    return <>{children}</>;
};

const CallOverlay = ({ callType }) => {
    const room = useRoom();
    const participants = Array.from(room.participants.values());
    const localParticipant = room.localParticipant;

    if (callType === 'VIDEO') {
        return (
            <div className="fixed inset-0 z-50 bg-black">
                {/* Удаленное видео - на весь экран */}
                {participants.map(participant => (
                    <ParticipantTile
                        key={participant.identity}
                        participant={participant}
                        className="absolute inset-0"
                    />
                ))}

                {/* Локальное видео - маленькое справа внизу */}
                <ParticipantTile
                    participant={localParticipant}
                    className="absolute bottom-24 right-4 w-56 h-72 rounded-lg"
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

### Этап 3: Обновление GlobalCallProvider

**Файл**: `apps/front/modules/features/call/lib/context/global-call-provider.tsx`

**Что нужно изменить**:

- [x]  Убрать зависимость от `useCall` hook (который использует WebRTC)
- [x]  Создать новый `useLiveKitCall` hook для работы с LiveKit
- [x] Обновить контекст для работы с LiveKit состояниями:
  - Заменить `myStream` и `remoteStream` на `room` и `participants`
  - Обновить методы управления (`handleToggleAudio`, `handleToggleVideo`) для работы с LiveKit API
- [x]  Обновить логику входящих звонков (возможно, оставить WebSocket для уведомлений, но использовать LiveKit для медиа)

### Этап 4: Обновление хуков звонков

**Файлы**:
- `modules/features/call/lib/hook/call.hook.ts` - главный хук
- `modules/features/call/lib/hook/call-engine.hook.ts` - движок звонков (заменить)
- `modules/features/call/lib/hook/call-media.hook.ts` - медиа (заменить на LiveKit)
- `modules/features/call/lib/hook/call-controls.hook.ts` - контролы (обновить)

**Что нужно сделать**:

- [x]  Создать новый `useLiveKitCall` hook вместо `useCall`
- [x] Убрать `useCallEngine` (заменить на `useRoom` из LiveKit)
- [x]  Убрать `useCallMedia` (LiveKit управляет медиа автоматически)
- [x]  Обновить `useCallControls` для работы с `room.localParticipant`:
  ```typescript
  const toggleAudio = () => {
      room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled);
  };

  const toggleVideo = () => {
      room.localParticipant.setCameraEnabled(!room.localParticipant.isCameraEnabled);
  };

  const endCall = () => {
      room.disconnect();
  };
  ```

### Этап 5: Обновление WebSocket событий

**Текущие события** (нужно убрать или переделать):
- `webrtc:offer` - не нужен (LiveKit использует токены)
- `webrtc:answer` - не нужен
- `webrtc:ice-candidate` - не нужен
- `webrtc:end` - можно оставить для уведомлений о завершении

**Новые события** (для уведомлений):
- `call:incoming` - уведомление о входящем звонке (опционально, можно использовать LiveKit events)
- `call:end` - уведомление о завершении звонка

**Файлы для работы**:
- `modules/shared/lib/socket/calls-socket.ts` - обновить события
- Backend WebSocket handlers - обновить или убрать WebRTC signaling

### Этап 6: Обновление страницы звонков

**Файл**: `app/network/calls/page.tsx`

**Варианты**:
- [ ] Вариант 1: Удалить тестовую страницу после миграции
- [ ] Вариант 2: Оставить как демо-страницу для тестирования LiveKit
- [ ] Вариант 3: Переделать в полноценную страницу звонков

### Этап 7: Очистка старого кода

**Файлы для удаления/архивации**:
- [ ] `modules/shared/lib/webrtc/peer-service.ts` - убрать или оставить как fallback
- [ ] `modules/shared/lib/webrtc/webrtc.config.ts` - убрать
- [ ] `modules/features/call/lib/hook/call-engine.hook.ts` - убрать после миграции
- [ ] `modules/features/call/lib/hook/call-media.hook.ts` - убрать после миграции
- [ ] WebSocket handlers для WebRTC signaling - убрать или оставить для fallback

### Этап 8: Тестирование

- [ ] Протестировать инициацию звонка
- [ ] Протестировать принятие входящего звонка
- [ ] Протестировать видео звонок (локальное и удаленное видео)
- [ ] Протестировать аудио звонок
- [ ] Протестировать управление (микрофон, камера, завершение)
- [ ] Протестировать обработку ошибок (недоступность токена, проблемы с подключением)
- [ ] Протестировать на разных устройствах и браузерах

## Файлы для работы

- `app/network/calls/page.tsx` - тестовая страница (переделать или удалить)
- `modules/features/call/ui/LiveKitTest.tsx` - тестовый компонент (можно использовать как основу)
- `modules/widgetes/call/CallWrapper/CallWrapperWidget.tsx` - главный компонент для миграции
- `modules/features/call/lib/context/global-call-provider.tsx` - контекст для обновления
- `modules/shared/lib/webrtc/` - старый WebRTC код (удалить после миграции)
- `modules/features/call/lib/hook/` - хуки для обновления
- `app/network/calls/useLivekitToken.ts` - хук для получения токена (уже готов)

## Дополнительные ресурсы

- [LiveKit React Components Docs](https://docs.livekit.io/client-sdk-react/)
- [LiveKit Room API](https://docs.livekit.io/client-sdk-js/classes/Room.html)
- Документация проекта: `documentation/frontend/docs/chat-webrtc.md` (обновлена с деталями миграции)
