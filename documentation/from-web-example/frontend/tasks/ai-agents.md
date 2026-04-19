# AI Агенты (Джарвисы)

## Назначение

Реализовать функционал AI агентов (типа "Джарвисов") - персональных AI ассистентов, которые могут:
- Вести активность в социальной сети (подписываться, лайкать, постить, писать сообщения)
- Общаться с пользователем через голосовые/видео звонки (LiveKit)
- Общаться через текстовые и голосовые сообщения
- Выполнять задания пользователя в соцсети
- Иметь свой профиль с постами (как обычный пользователь)
- Использовать RAG (Retrieval-Augmented Generation) для загрузки знаний
- Настраиваемый root промпт

## Требования

### Функционал

1. **Страница Agents**:
   - Nav item "Агенты" → `/network/agents`
   - Список всех агентов пользователя
   - Кнопка "Создать агента"
   - Карточки агентов с превью

2. **Профиль агента**:
   - Выглядит как профиль обычного пользователя
   - Посты агента (как на стене пользователя)
   - Информация об агенте (имя, описание, avatar, hero)
   - Кнопка "Настроить" (вместо "Edit Profile") → открывает настройки агента

3. **Настройки агента**:
   - Модальное окно (как Edit Profile)
   - Настройка профиля (имя, описание, avatar, hero)
   - Настройка root промпта (текстовое поле)
   - Загрузка знаний для RAG (файлы, текст)
   - Выбор LLM (Ollama, GigaChat, ChatGPT/OpenAI)
   - Настройка API ключей (для внешних LLM)

4. **Голосовое общение с агентом**:
   - Кнопка "Позвонить агенту" (аудио/видео)
   - Интеграция с LiveKit для звонков
   - Голосовой ввод (speech-to-text)
   - Голосовой ответ агента (text-to-speech)
   - Видео звонки (опционально)

5. **Текстовое общение с агентом**:
   - Чат с агентом (как обычный чат)
   - Отправка текстовых сообщений
   - Отправка голосовых сообщений
   - Получение ответов от агента

6. **Задания агенту**:
   - Интерфейс для создания заданий
   - Типы заданий: "Подписаться на пользователя", "Лайкнуть пост", "Написать пост", "Написать сообщение"
   - История выполненных заданий
   - Статус выполнения заданий

## Архитектура FSD

### Entity: `modules/entities/agent/`

**Структура**:
```
entities/agent/
├── index.ts
├── ui/
│   ├── AgentCard/
│   │   └── AgentCard.tsx              # Карточка агента в списке
│   ├── AgentProfile/
│   │   └── AgentProfile.tsx           # Профиль агента (как ProfileInformation)
│   └── AgentPosts/
│       └── AgentPosts.tsx             # Посты агента (как ProfilePosts)
├── lib/
│   ├── api/
│   │   └── agent.service.ts           # API для работы с агентами
│   ├── hook/
│   │   ├── useAgent.hook.ts           # Хук для получения агента
│   │   ├── useAgents.hook.ts          # Хук для списка агентов
│   │   ├── useCreateAgent.hook.ts     # Хук для создания агента
│   │   └── useUpdateAgent.hook.ts     # Хук для обновления агента
│   └── utils/
│       └── agent.utils.ts             # Утилиты для агентов
└── model/
    └── types.ts                        # Типы для агентов
```

### Feature: `modules/features/agent/`

**Структура**:
```
features/agent/
├── index.ts
├── ui/
│   ├── CreateAgent/
│   │   └── CreateAgent.tsx             # Создание нового агента
│   ├── AgentSettings/
│   │   └── AgentSettings.tsx          # Настройки агента (модальное окно)
│   ├── AgentPromptEditor/
│   │   └── AgentPromptEditor.tsx      # Редактор root промпта
│   ├── AgentKnowledgeUpload/
│   │   └── AgentKnowledgeUpload.tsx   # Загрузка знаний для RAG
│   ├── AgentLLMSelector/
│   │   └── AgentLLMSelector.tsx       # Выбор LLM
│   ├── AgentTasks/
│   │   └── AgentTasks.tsx             # Интерфейс заданий агенту
│   ├── AgentCall/
│   │   └── AgentCall.tsx              # Компонент звонка агенту (LiveKit)
│   └── AgentChat/
│       └── AgentChat.tsx               # Чат с агентом
└── lib/
    ├── hook/
    │   ├── useAgentCall.hook.ts       # Хук для звонка агенту
    │   ├── useAgentChat.hook.ts       # Хук для чата с агентом
    │   ├── useAgentTasks.hook.ts      # Хук для заданий агенту
    │   └── useAgentVoice.hook.ts      # Хук для голосового общения
    └── utils/
        └── agent.utils.ts              # Утилиты для агентов
```

### Widget: `modules/widgetes/agent/`

**Структура**:
```
widgetes/agent/
├── index.ts
├── AgentsListWidget/
│   └── AgentsListWidget.tsx           # Виджет списка агентов
└── AgentProfileWidget/
    └── AgentProfileWidget.tsx           # Виджет профиля агента
```

### Page: `app/network/agents/`

**Структура**:
```
app/network/agents/
├── page.tsx                            # Страница списка агентов
└── [agentId]/
    └── page.tsx                        # Страница профиля агента
```

## Детальная реализация

### 1. Страница списка агентов

**Расположение**: `app/network/agents/page.tsx`

```typescript
'use client';

import { AgentsListWidget } from '@/modules/widgetes/agent';
import { useAuth } from '@/modules/processes';
import { LoadingScreen } from '@/modules/shared';

export default function AgentsPage() {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <LoadingScreen />;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Мои агенты</h1>
            <AgentsListWidget userId={currentUser.id} />
        </div>
    );
}
```

**Виджет списка агентов**:

```typescript
// AgentsListWidget.tsx
'use client';

import { useAgents } from '@/modules/entities/agent';
import { AgentCard } from '@/modules/entities/agent';
import { CreateAgent } from '@/modules/features/agent';
import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export const AgentsListWidget = ({ userId }: { userId: string }) => {
    const { agents, isLoading } = useAgents(userId);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Агенты</h2>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать агента
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents?.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                ))}
            </div>

            {isCreateOpen && (
                <CreateAgent
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={() => {
                        setIsCreateOpen(false);
                        // Refetch agents
                    }}
                />
            )}
        </div>
    );
};
```

### 2. Профиль агента

**Расположение**: `app/network/agents/[agentId]/page.tsx`

```typescript
'use client';

import { AgentProfileWidget } from '@/modules/widgetes/agent';
import { useParams } from 'next/navigation';
import { LoadingScreen } from '@/modules/shared';

export default function AgentProfilePage() {
    const params = useParams();
    const agentId = params.agentId as string;

    if (!agentId) {
        return <LoadingScreen />;
    }

    return <AgentProfileWidget agentId={agentId} />;
}
```

**Виджет профиля агента**:

```typescript
// AgentProfileWidget.tsx
'use client';

import { useAgent } from '@/modules/entities/agent';
import { AgentProfile } from '@/modules/entities/agent';
import { AgentPosts } from '@/modules/entities/agent';
import { AgentSettings } from '@/modules/features/agent';
import { AgentCall } from '@/modules/features/agent';
import { AgentChat } from '@/modules/features/agent';
import { AgentTasks } from '@/modules/features/agent';
import { useAuth } from '@/modules/processes';
import { Button } from '@workspace/ui/components/button';
import { Settings, Phone, MessageSquare, ListTodo } from 'lucide-react';
import { useState } from 'react';

export const AgentProfileWidget = ({ agentId }: { agentId: string }) => {
    const { currentUser } = useAuth();
    const { agent, isLoading } = useAgent(agentId);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCallOpen, setIsCallOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isTasksOpen, setIsTasksOpen] = useState(false);

    if (isLoading || !agent) {
        return <div>Загрузка...</div>;
    }

    const isOwner = currentUser?.id === agent.ownerId;

    return (
        <div className="container mx-auto p-4">
            {/* Заголовок с кнопками */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">{agent.name}</h1>
                <div className="flex gap-2">
                    {isOwner && (
                        <Button
                            variant="outline"
                            onClick={() => setIsSettingsOpen(true)}
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Настроить
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => setIsCallOpen(true)}
                    >
                        <Phone className="h-4 w-4 mr-2" />
                        Позвонить
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsChatOpen(true)}
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Чат
                    </Button>
                    {isOwner && (
                        <Button
                            variant="outline"
                            onClick={() => setIsTasksOpen(true)}
                        >
                            <ListTodo className="h-4 w-4 mr-2" />
                            Задания
                        </Button>
                    )}
                </div>
            </div>

            {/* Профиль агента */}
            <AgentProfile agentId={agentId} />

            {/* Посты агента */}
            <AgentPosts agentId={agentId} />

            {/* Модальные окна */}
            {isSettingsOpen && (
                <AgentSettings
                    agentId={agentId}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}

            {isCallOpen && (
                <AgentCall
                    agentId={agentId}
                    onClose={() => setIsCallOpen(false)}
                />
            )}

            {isChatOpen && (
                <AgentChat
                    agentId={agentId}
                    onClose={() => setIsChatOpen(false)}
                />
            )}

            {isTasksOpen && (
                <AgentTasks
                    agentId={agentId}
                    onClose={() => setIsTasksOpen(false)}
                />
            )}
        </div>
    );
};
```

### 3. Настройки агента

**Компонент настроек**:

```typescript
// AgentSettings.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { AgentPromptEditor } from './AgentPromptEditor';
import { AgentKnowledgeUpload } from './AgentKnowledgeUpload';
import { AgentLLMSelector } from './AgentLLMSelector';
import { useAgent } from '@/modules/entities/agent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { useUpdateAgent } from '@/modules/entities/agent';

interface AgentSettingsProps {
    agentId: string;
    onClose: () => void;
}

export const AgentSettings = ({ agentId, onClose }: AgentSettingsProps) => {
    const { agent } = useAgent(agentId);
    const updateAgent = useUpdateAgent();

    const handleSave = async (data: any) => {
        await updateAgent.mutateAsync({
            agentId,
            ...data,
        });
        onClose();
    };

    if (!agent) return null;

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Настройки агента: {agent.name}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList>
                        <TabsTrigger value="profile">Профиль</TabsTrigger>
                        <TabsTrigger value="prompt">Промпт</TabsTrigger>
                        <TabsTrigger value="knowledge">Знания (RAG)</TabsTrigger>
                        <TabsTrigger value="llm">LLM</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <ProfileSettings agent={agent} onSave={handleSave} />
                    </TabsContent>

                    <TabsContent value="prompt">
                        <AgentPromptEditor
                            agentId={agentId}
                            initialPrompt={agent.rootPrompt}
                            onSave={(prompt) => handleSave({ rootPrompt: prompt })}
                        />
                    </TabsContent>

                    <TabsContent value="knowledge">
                        <AgentKnowledgeUpload
                            agentId={agentId}
                            knowledgeFiles={agent.knowledgeFiles || []}
                        />
                    </TabsContent>

                    <TabsContent value="llm">
                        <AgentLLMSelector
                            agentId={agentId}
                            currentLLM={agent.llmProvider}
                            apiKey={agent.apiKey}
                            onSave={(llm, apiKey) => handleSave({ llmProvider: llm, apiKey })}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
```

### 4. Голосовое общение с агентом (LiveKit)

**Полезные ресурсы**:
- [LiveKit Tutorial - Voice AI Assistant](https://www.youtube.com/watch?v=YkV14teUYlo&list=PLkNKgOpMwm0su_pPeINN7eRG_rjHy0FNn) - пример реализации голосового AI ассистента с LiveKit
- [LiveKit Tutorial - Voice AI Assistant](https://www.youtube.com/watch?v=78JFdQd04Kg&t=63s)


**Важно**: LiveKit сам по себе НЕ делает STT (speech-to-text) и TTS (text-to-speech). LiveKit - это платформа для передачи аудио/видео потоков.

**Как это работает**:
1. Пользователь говорит в микрофон → LiveKit передает аудио на backend
2. Backend получает аудио через LiveKit Egress API
3. Backend транскрибирует аудио через Whisper (STT) → получает текст
4. Backend обрабатывает текст через агента (LLM + RAG) → получает ответ
5. Backend синтезирует речь через TTS → получает аудио ответ
6. Backend отправляет аудио обратно в LiveKit через Ingress API
7. LiveKit передает аудио пользователю → пользователь слышит ответ агента

**На frontend**:
- Используем `LiveKitRoom` для подключения к комнате агента
- Публикуем свой аудио трек (микрофон)
- Подписываемся на аудио трек агента
- Воспроизводим аудио через `RoomAudioRenderer`

**Компонент звонка агенту**:

```typescript
// AgentCall.tsx
'use client';

import { LiveKitRoom, useRoom, RoomAudioRenderer, useTracks } from '@livekit/components-react';
import '@livekit/components-styles';
import { useLivekitToken } from '@/app/network/calls/useLivekitToken';
import { useAgentVoice } from '@/modules/features/agent';
import { Button } from '@workspace/ui/components/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@workspace/ui/components/dialog';

interface AgentCallProps {
    agentId: string;
    onClose: () => void;
}

export const AgentCall = ({ agentId, onClose }: AgentCallProps) => {
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const roomName = `agent-${agentId}`;
    const { data: tokenData, isLoading: tokenLoading } = useLivekitToken(roomName);
    const { startVoiceInteraction, stopVoiceInteraction, isListening, agentResponse } = useAgentVoice(agentId);

    if (tokenLoading || !tokenData?.token) {
        return <div>Подключение...</div>;
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <LiveKitRoom
                    video={isVideoEnabled}
                    audio={isAudioEnabled}
                    token={tokenData.token}
                    serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
                    connect={true}
                    onDisconnected={onClose}
                >
                    <AgentCallContent
                        agentId={agentId}
                        isAudioEnabled={isAudioEnabled}
                        isVideoEnabled={isVideoEnabled}
                        onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
                        onToggleVideo={() => setIsVideoEnabled(!isVideoEnabled)}
                        onEndCall={onClose}
                        onStartVoice={startVoiceInteraction}
                        onStopVoice={stopVoiceInteraction}
                        isListening={isListening}
                        agentResponse={agentResponse}
                    />
                    <RoomAudioRenderer />
                </LiveKitRoom>
            </DialogContent>
        </Dialog>
    );
};

const AgentCallContent = ({
    agentId,
    isAudioEnabled,
    isVideoEnabled,
    onToggleAudio,
    onToggleVideo,
    onEndCall,
    onStartVoice,
    onStopVoice,
    isListening,
    agentResponse,
}: any) => {
    const room = useRoom();
    const tracks = useTracks([{ source: 'camera', withPlaceholder: true }]);

    return (
        <div className="flex flex-col h-full">
            {/* Видео (если включено) */}
            {isVideoEnabled && (
                <div className="flex-1 grid grid-cols-2 gap-4 p-4">
                    {tracks.map((track) => (
                        <div key={track.participant.identity}>
                            {track.publication?.isSubscribed && (
                                <video
                                    ref={(el) => {
                                        if (el && track.publication?.track) {
                                            track.publication.track.attach(el);
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Аудио режим */}
            {!isVideoEnabled && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-2xl font-bold mb-4">Разговор с агентом</div>
                        {isListening && (
                            <div className="text-green-500 mb-2">Слушаю...</div>
                        )}
                        {agentResponse && (
                            <div className="text-gray-600 mb-2">{agentResponse}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Контролы */}
            <div className="flex justify-center gap-4 p-4 border-t">
                <Button
                    variant={isAudioEnabled ? 'default' : 'destructive'}
                    onClick={onToggleAudio}
                >
                    {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                    variant={isVideoEnabled ? 'default' : 'outline'}
                    onClick={onToggleVideo}
                >
                    {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                    variant="destructive"
                    onClick={onEndCall}
                >
                    <PhoneOff className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
```

**Хук для голосового общения**:

```typescript
// useAgentVoice.hook.ts
import { useState, useEffect } from 'react';
import { useRoom, useRemoteParticipant } from '@livekit/components-react';

export const useAgentVoice = (agentId: string) => {
    const room = useRoom();
    const [isListening, setIsListening] = useState(false);
    const [agentResponse, setAgentResponse] = useState<string | null>(null);

    // Получаем участника-агента
    const agentParticipant = useRemoteParticipant(`agent-${agentId}`);

    useEffect(() => {
        if (!room) return;

        // Слушаем события комнаты
        const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
            if (participant.identity === `agent-${agentId}` && track.kind === 'audio') {
                // Агент начал говорить
                setIsListening(false);
            }
        };

        const handleTrackUnsubscribed = (track: any, publication: any, participant: any) => {
            if (participant.identity === `agent-${agentId}` && track.kind === 'audio') {
                // Агент закончил говорить
                setIsListening(true);
            }
        };

        room.on('trackSubscribed', handleTrackSubscribed);
        room.on('trackUnsubscribed', handleTrackUnsubscribed);

        return () => {
            room.off('trackSubscribed', handleTrackSubscribed);
            room.off('trackUnsubscribed', handleTrackUnsubscribed);
        };
    }, [room, agentId]);

    // Когда пользователь говорит, LiveKit автоматически передает аудио на backend
    // Backend обрабатывает через Whisper → LLM → TTS → отправляет обратно
    // Аудио ответ агента автоматически воспроизводится через RoomAudioRenderer

    return {
        isListening,
        agentResponse, // Можно получать через WebSocket от backend (опционально, для отображения текста)
    };
};
```

**Важно**:
- **STT/TTS происходит на backend**, а не на frontend
- Frontend только передает аудио через LiveKit и воспроизводит ответ
- Если нужно показывать текст ответа, можно получать его через WebSocket от backend

### 5. Чат с агентом

**Компонент чата**:

```typescript
// AgentChat.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { useAgentChat } from '@/modules/features/agent';
import { MessageList } from '@/modules/entities/messages';
import { ChatInputWidget } from '@/modules/widgetes/chat/ChatInputWidget';
import { useState } from 'react';

interface AgentChatProps {
    agentId: string;
    onClose: () => void;
}

export const AgentChat = ({ agentId, onClose }: AgentChatProps) => {
    const [messageText, setMessageText] = useState('');
    const { messages, sendMessage, isSending } = useAgentChat(agentId);

    const handleSend = async () => {
        if (!messageText.trim()) return;

        await sendMessage(messageText);
        setMessageText('');
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Чат с агентом</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto mb-4">
                    <MessageList
                        messages={messages || []}
                        currentUserId={currentUser?.id || ''}
                    />
                </div>

                <ChatInputWidget
                    messageText={messageText}
                    onMessageTextChange={setMessageText}
                    onSendMessage={handleSend}
                    isPending={isSending}
                />
            </DialogContent>
        </Dialog>
    );
};
```

**Хук для чата с агентом**:

```typescript
// useAgentChat.hook.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAgents } from '@workspace/nest-api';
import { useAuth } from '@/modules/processes';

export const useAgentChat = (agentId: string) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const api = getAgents();

    // Получаем сообщения чата с агентом
    const { data: messages } = useQuery({
        queryKey: ['agent-chat', agentId],
        queryFn: () => api.agentsGetChatMessages({ agentId }),
    });

    // Отправка сообщения агенту
    const sendMessage = useMutation({
        mutationFn: async (content: string) => {
            return await api.agentsSendMessage({
                agentId,
                content,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-chat', agentId] });
        },
    });

    return {
        messages: messages?.messages || [],
        sendMessage: sendMessage.mutateAsync,
        isSending: sendMessage.isPending,
    };
};
```

### 6. Задания агенту

**Компонент заданий**:

```typescript
// AgentTasks.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { useAgentTasks } from '@/modules/features/agent';
import { Button } from '@workspace/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { useState } from 'react';

interface AgentTasksProps {
    agentId: string;
    onClose: () => void;
}

type TaskType = 'FOLLOW' | 'LIKE' | 'POST' | 'MESSAGE';

export const AgentTasks = ({ agentId, onClose }: AgentTasksProps) => {
    const [taskType, setTaskType] = useState<TaskType>('FOLLOW');
    const [taskParams, setTaskParams] = useState<any>({});
    const { tasks, createTask, isLoading } = useAgentTasks(agentId);

    const handleCreateTask = async () => {
        await createTask({
            type: taskType,
            params: taskParams,
        });
        setTaskParams({});
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Задания агенту</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Создание задания */}
                    <div className="border p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Создать задание</h3>
                        <Select value={taskType} onValueChange={(value) => setTaskType(value as TaskType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FOLLOW">Подписаться на пользователя</SelectItem>
                                <SelectItem value="LIKE">Лайкнуть пост</SelectItem>
                                <SelectItem value="POST">Написать пост</SelectItem>
                                <SelectItem value="MESSAGE">Написать сообщение</SelectItem>
                            </SelectContent>
                        </Select>

                        {taskType === 'FOLLOW' && (
                            <Input
                                placeholder="ID пользователя"
                                value={taskParams.userId || ''}
                                onChange={(e) => setTaskParams({ ...taskParams, userId: e.target.value })}
                                className="mt-2"
                            />
                        )}

                        {taskType === 'LIKE' && (
                            <Input
                                placeholder="ID поста"
                                value={taskParams.postId || ''}
                                onChange={(e) => setTaskParams({ ...taskParams, postId: e.target.value })}
                                className="mt-2"
                            />
                        )}

                        {taskType === 'POST' && (
                            <Textarea
                                placeholder="Текст поста"
                                value={taskParams.text || ''}
                                onChange={(e) => setTaskParams({ ...taskParams, text: e.target.value })}
                                className="mt-2"
                            />
                        )}

                        {taskType === 'MESSAGE' && (
                            <>
                                <Input
                                    placeholder="ID пользователя"
                                    value={taskParams.userId || ''}
                                    onChange={(e) => setTaskParams({ ...taskParams, userId: e.target.value })}
                                    className="mt-2"
                                />
                                <Textarea
                                    placeholder="Текст сообщения"
                                    value={taskParams.text || ''}
                                    onChange={(e) => setTaskParams({ ...taskParams, text: e.target.value })}
                                    className="mt-2"
                                />
                            </>
                        )}

                        <Button onClick={handleCreateTask} className="mt-2" disabled={isLoading}>
                            Создать задание
                        </Button>
                    </div>

                    {/* Список заданий */}
                    <div>
                        <h3 className="font-semibold mb-2">История заданий</h3>
                        <div className="space-y-2">
                            {tasks?.map((task) => (
                                <div key={task.id} className="border p-2 rounded">
                                    <div className="flex justify-between">
                                        <span>{task.type}</span>
                                        <span className={task.status === 'COMPLETED' ? 'text-green-500' : 'text-yellow-500'}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
```

## Интеграция с существующими модулями

### Использование компонентов

- Использовать `ProfileInformation` и `ProfilePosts` как основу для профиля агента
- Использовать `ChatInputWidget` и `MessageList` для чата с агентом
- Использовать `LiveKitRoom` для голосовых/видео звонков
- Использовать существующие компоненты дизайн-системы

### API обновление

**Нужны новые endpoints** (см. Backend задачу):
- `GET /api/agents` - список агентов пользователя
- `GET /api/agents/:id` - получение агента
- `POST /api/agents` - создание агента
- `PATCH /api/agents/:id` - обновление агента
- `POST /api/agents/:id/chat` - отправка сообщения агенту
- `GET /api/agents/:id/chat/messages` - получение сообщений чата
- `POST /api/agents/:id/tasks` - создание задания
- `GET /api/agents/:id/tasks` - список заданий

## Связанные задачи

- [Backend задача по AI агентам](../../backend/tasks/ai-agents.md) - **обязательно** - реализация backend функционала
- [Переход чатов с WebRTC на LiveKit](./livekit-migration.md) - использование LiveKit для звонков

## Этапы реализации

### Этап 1: Базовая структура

- [ ] Создать entity `agent` с базовыми типами и хуками
- [ ] Создать страницу `/network/agents`
- [ ] Создать виджет списка агентов
- [ ] Создать страницу профиля агента

### Этап 2: Профиль агента

- [ ] Создать компонент `AgentProfile` (на основе `ProfileInformation`)
- [ ] Создать компонент `AgentPosts` (на основе `ProfilePosts`)
- [ ] Интегрировать с существующими компонентами постов

### Этап 3: Настройки агента

- [ ] Создать компонент `AgentSettings` (модальное окно)
- [ ] Создать компонент `AgentPromptEditor`
- [ ] Создать компонент `AgentKnowledgeUpload`
- [ ] Создать компонент `AgentLLMSelector`

### Этап 4: Голосовое общение

- [ ] Интегрировать LiveKit для звонков с агентом
- [ ] Реализовать speech-to-text (Web Speech API или Whisper)
- [ ] Реализовать text-to-speech (Web Speech API или TTS)
- [ ] Создать компонент `AgentCall`

### Этап 5: Чат с агентом

- [ ] Создать компонент `AgentChat`
- [ ] Реализовать отправку сообщений агенту
- [ ] Реализовать получение ответов от агента
- [ ] Интегрировать с существующим чатом

### Этап 6: Задания агенту

- [ ] Создать компонент `AgentTasks`
- [ ] Реализовать создание заданий
- [ ] Реализовать отображение истории заданий
- [ ] Интегрировать с backend для выполнения заданий

### Этап 7: Тестирование

- [ ] Протестировать создание и настройку агентов
- [ ] Протестировать голосовое общение
- [ ] Протестировать чат с агентом
- [ ] Протестировать задания агенту
