# Глобальный аудиоплеер

## Назначение

Создать глобальный аудиоплеер, который работает во всем приложении, продолжает играть при переходе между страницами, и автоматически переключается на следующую аудиозапись.

## Требования

- Плеер должен быть виден в правом нижнем углу экрана
- Плеер продолжает играть при переходе между страницами (лента новостей → сообщения → профиль и т.д.)
- Когда песня заканчивается, автоматически играет следующая аудиозапись из поста/сообщения
- Плеер должен быть всегда доступен (fixed position)

## Архитектура FSD

### Widget: `modules/widgetes/audio/GlobalAudioPlayer/`

**Структура**:
```
widgetes/audio/GlobalAudioPlayer/
├── index.ts
├── GlobalAudioPlayerWidget.tsx        # Основной виджет
├── components/
│   ├── AudioPlayerControls.tsx        # Кнопки управления (play/pause, next, prev)
│   ├── AudioPlayerProgress.tsx         # Прогресс-бар с временем
│   ├── AudioPlayerInfo.tsx             # Информация о треке (название, автор)
│   └── AudioPlayerVolume.tsx           # Контроль громкости
└── lib/
    └── useGlobalAudioPlayer.hook.ts    # Хук для управления плеером
```

### Feature: `modules/features/audio-player/`

**Структура**:
```
features/audio-player/
├── index.ts
├── lib/
│   ├── context/
│   │   └── AudioPlayerContext.tsx     # Глобальный контекст для плеера
│   ├── hook/
│   │   ├── useAudioPlayer.hook.ts      # Основной хук для управления
│   │   ├── useAudioQueue.hook.ts       # Управление очередью треков
│   │   └── useAudioPlayback.hook.ts    # Логика воспроизведения
│   └── utils/
│       ├── audio.utils.ts              # Утилиты для работы с аудио
│       └── queue.utils.ts               # Утилиты для очереди
└── model/
    └── slice/
        └── AudioPlayerSlice.ts          # Redux slice для состояния плеера
```

## Детальная реализация

### 1. AudioPlayerSlice (Redux)

```typescript
interface AudioPlayerState {
    currentTrack: AudioTrack | null;
    queue: AudioTrack[];              // Очередь треков
    currentIndex: number;              // Индекс текущего трека в очереди
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    isLoading: boolean;
}

interface AudioTrack {
    id: string;
    url: string;
    title: string;
    author?: string;
    authorId?: string;
    thumbnail?: string;
    source: 'post' | 'message';        // Откуда трек (пост или сообщение)
    sourceId: string;                   // ID поста или сообщения
}
```

### 2. AudioPlayerContext

- Провайдер для глобального состояния плеера
- Должен быть на верхнем уровне приложения (в layout)
- Управляет HTML5 Audio элементом

### 3. useAudioPlayer hook

```typescript
const {
    currentTrack,
    isPlaying,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    addToQueue,
    removeFromQueue,
    clearQueue
} = useAudioPlayer();
```

### 4. useAudioQueue hook

- Управление очередью треков
- Автоматическое добавление треков из постов/сообщений
- Логика перехода к следующему треку

### 5. GlobalAudioPlayerWidget

- Fixed position в правом нижнем углу
- Компактный вид (минимизируется когда не играет)
- Показывает текущий трек, прогресс, контролы
- При клике - разворачивается в полноэкранный вид

## Поток работы

### 1. Инициализация

```
Пользователь открывает приложение
→ AudioPlayerContext инициализируется
→ GlobalAudioPlayerWidget рендерится в layout
→ Плеер скрыт (пока нет треков)
```

### 2. Воспроизведение трека из поста

```
Пользователь нажимает play на аудио в посте
→ addToQueue вызывается с треком из поста
→ Трек добавляется в очередь
→ Если очередь была пуста, трек начинает играть
→ GlobalAudioPlayerWidget появляется в правом нижнем углу
→ Плеер показывает информацию о треке
```

### 3. Переход между страницами

```
Пользователь переходит из ленты в сообщения
→ GlobalAudioPlayerWidget остается на месте (fixed position)
→ Аудио продолжает играть
→ Состояние плеера сохраняется в Redux
```

### 4. Автопереход к следующему треку

```
Текущий трек заканчивается
→ Событие 'ended' на audio элементе
→ useAudioPlayback обрабатывает событие
→ next() вызывается автоматически
→ Если есть следующий трек в очереди - он начинает играть
→ Если очереди нет - плеер скрывается
```

### 5. Сбор треков из постов/сообщений

```
Пользователь просматривает ленту
→ useAudioQueue автоматически собирает все аудио из видимых постов
→ Треки добавляются в очередь
→ При окончании текущего трека играет следующий из очереди
```

## Интеграция с постами и сообщениями

### В компоненте поста

```typescript
import { useAudioPlayer } from '@/modules/features/audio-player';

const PostAudio = ({ audioUrl, postId, title }: Props) => {
    const { addToQueue, currentTrack, isPlaying } = useAudioPlayer();

    const handlePlay = () => {
        addToQueue({
            id: `post-${postId}`,
            url: audioUrl,
            title,
            source: 'post',
            sourceId: postId
        });
    };

    return (
        <button onClick={handlePlay}>
            {currentTrack?.id === `post-${postId}` && isPlaying ? 'Pause' : 'Play'}
        </button>
    );
};
```

### В компоненте сообщения

```typescript
const MessageAudio = ({ audioUrl, messageId, title }: Props) => {
    const { addToQueue } = useAudioPlayer();

    const handlePlay = () => {
        addToQueue({
            id: `message-${messageId}`,
            url: audioUrl,
            title,
            source: 'message',
            sourceId: messageId
        });
    };
};
```

## UI компоненты

### GlobalAudioPlayerWidget (компактный вид)

- Минимальная ширина: 300px
- Высота: 80px
- Позиция: `fixed bottom-4 right-4 z-50`
- Показывает: миниатюру, название, кнопки play/pause, прогресс
- При клике разворачивается

### Развернутый вид

- Полноэкранный overlay или модальное окно
- Показывает: большую миниатюру, полную информацию, список очереди, контролы

## Файлы для работы

- Создать `modules/widgetes/audio/GlobalAudioPlayer/`
- Создать `modules/features/audio-player/`
- Интегрировать в `app/layout.tsx` или `app/network/layout.tsx`
- Обновить компоненты постов для поддержки аудио
- Обновить компоненты сообщений для поддержки аудио

## Дополнительные требования

- [ ] Сохранение состояния плеера в localStorage (текущий трек, позиция, очередь)
- [ ] Поддержка горячих клавиш (пробел для play/pause, стрелки для next/prev)
- [ ] Уведомления о смене трека (опционально)
- [ ] Адаптивный дизайн для мобильных устройств
- [ ] Обработка ошибок загрузки треков
- [ ] Поддержка разных форматов аудио (mp3, ogg, wav)
