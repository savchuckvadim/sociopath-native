# Прикрепление аудиозаписей в посты и сообщения

## Назначение

Добавить возможность прикреплять аудиозаписи к постам и сообщениям.

## Требования

- Запись аудио через микрофон
- Загрузка аудио файлов
- Предпросмотр перед отправкой
- Ограничение по размеру и длительности

## Архитектура FSD

### Feature: `modules/features/audio-recorder/`

**Структура**:
```
features/audio-recorder/
├── index.ts
├── ui/
│   ├── AudioRecorder.tsx               # Компонент записи аудио
│   ├── AudioRecorderButton.tsx         # Кнопка для начала записи
│   └── AudioPreview.tsx                 # Превью записанного аудио
├── lib/
│   ├── hook/
│   │   ├── useAudioRecorder.hook.ts    # Хук для записи аудио
│   │   └── useAudioUpload.hook.ts      # Хук для загрузки аудио
│   └── utils/
│       └── audio-recorder.utils.ts     # Утилиты для работы с MediaRecorder API
└── model/
    └── slice/
        └── AudioRecorderSlice.ts        # Redux slice для состояния записи
```

## Детальная реализация

### 1. useAudioRecorder hook

```typescript
const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    audioBlob,
    audioUrl,
    error
} = useAudioRecorder();
```

### 2. Ограничения

- Максимальная длительность: 5 минут (300 секунд)
- Максимальный размер файла: 10 MB
- Форматы: MP3, OGG, WAV
- Качество: 128 kbps (для MP3)

### 3. Интеграция в CreatePost

- Добавить кнопку "Прикрепить аудио" в форму создания поста
- Показывать AudioRecorder компонент при нажатии
- После записи показывать превью с возможностью удаления
- Отправлять аудио вместе с постом

### 4. Интеграция в ChatInput

- Добавить кнопку "Прикрепить аудио" в поле ввода сообщения
- Показывать AudioRecorder компонент
- После записи отправлять аудио как вложение к сообщению

## Backend требования

- [ ] API endpoint для загрузки аудио файлов
- [ ] Валидация размера и формата на backend
- [ ] Хранение аудио файлов (S3 или локальное хранилище)
- [ ] Обновление схемы БД для постов и сообщений (добавить поле audioUrl)

## Файлы для работы

- Создать `modules/features/audio-recorder/`
- Обновить `modules/features/post/CreatePost/` - добавить поддержку аудио
- Обновить `modules/widgetes/chat/ChatInputWidget/` - добавить поддержку аудио
- Backend: создать endpoint для загрузки аудио
- Backend: обновить DTO для постов и сообщений
