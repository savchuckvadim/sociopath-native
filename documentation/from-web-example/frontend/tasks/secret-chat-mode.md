# Секретный режим в чате

## Назначение

Реализовать возможность переключения обычного чата в секретный режим, где сообщения:
- Не сохраняются на сервере
- Хранятся только на клиенте (IndexedDB)
- Шифруются через Signal Protocol
- Расшифровываются только на клиенте
- Синхронизируются между устройствами через Signal Protocol (peer-to-peer)

## Требования

### Функционал

1. **Кнопка переключения в секретный режим**:
   - В заголовке чата (рядом с кнопками звонков)
   - Визуальная индикация активного секретного режима
   - Возможность выключить секретный режим (с предупреждением)

2. **Секретные сообщения**:
   - Не отправляются на сервер через REST API
   - Шифруются через Signal Protocol перед отправкой
   - Отправляются через WebSocket (или Signal Protocol peer-to-peer)
   - Сохраняются только в IndexedDB на клиенте
   - Расшифровываются только на клиенте получателя

3. **Синхронизация между устройствами**:
   - Использовать Signal Protocol для синхронизации
   - Ключи хранятся в IndexedDB
   - Сообщения синхронизируются через Signal Protocol (peer-to-peer или через сервер для обмена ключами)

4. **Безопасность**:
   - Использовать Signal Protocol (Double Ratchet, 3-DH)
   - Ключи хранятся только на клиенте
   - Сервер не видит содержимое сообщений
   - Forward secrecy и post-compromise security

## Зависимости

**Обязательно выполнить перед началом**:
- [Сквозное шифрование для чатов и звонков](./end-to-end-encryption.md) - базовая реализация Signal Protocol

## Архитектура FSD

### Entity: `modules/entities/secret-messages/`

**Структура**:
```
entities/secret-messages/
├── index.ts
├── ui/
│   └── SecretMessage/
│       └── SecretMessage.tsx           # Компонент секретного сообщения
├── lib/
│   ├── api/
│   │   └── secret-message.service.ts    # API для обмена ключами (не для сообщений!)
│   ├── hook/
│   │   ├── useSecretMessages.hook.ts    # Хук для работы с секретными сообщениями
│   │   ├── useSecretMode.hook.ts        # Хук для управления секретным режимом
│   │   └── useSecretStorage.hook.ts     # Хук для работы с IndexedDB
│   ├── storage/
│   │   ├── secret-messages-db.ts        # IndexedDB для секретных сообщений
│   │   └── secret-keys-db.ts             # IndexedDB для ключей (используется из encryption)
│   └── utils/
│       └── secret-message.utils.ts      # Утилиты для секретных сообщений
└── model/
    └── types.ts                          # Типы для секретных сообщений
```

### Feature: `modules/features/secret-chat-mode/`

**Структура**:
```
features/secret-chat-mode/
├── index.ts
├── ui/
│   ├── SecretModeToggle/
│   │   └── SecretModeToggle.tsx         # Кнопка переключения секретного режима
│   ├── SecretModeIndicator/
│   │   └── SecretModeIndicator.tsx     # Индикатор активного секретного режима
│   └── SecretModeWarning/
│       └── SecretModeWarning.tsx        # Предупреждение при выключении
└── lib/
    └── hook/
        └── useSecretChatMode.hook.ts     # Хук для управления секретным режимом чата
```

### Widget: `modules/widgetes/chat/SecretChatMessagesWidget/`

**Структура**:
```
widgetes/chat/SecretChatMessagesWidget/
├── index.ts
└── SecretChatMessagesWidget.tsx         # Виджет для отображения секретных сообщений
```

## Детальная реализация

### 1. IndexedDB для секретных сообщений

**Структура базы данных**:

```typescript
// secret-messages-db.ts
interface SecretMessageDB {
    id: string;                    // Уникальный ID сообщения
    chatId: string;                 // ID чата
    senderId: string;              // ID отправителя
    receiverId: string;             // ID получателя
    encryptedContent: string;      // Зашифрованное содержимое
    timestamp: number;             // Временная метка
    messageType: 'TEXT' | 'IMAGE' | 'FILE'; // Тип сообщения
    isRead: boolean;                // Прочитано ли
    isDelivered: boolean;           // Доставлено ли
}

// Структура IndexedDB
const DB_NAME = 'secret-messages-db';
const STORE_NAME = 'secret-messages';
const VERSION = 1;

export class SecretMessagesDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('chatId', 'chatId', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('senderId', 'senderId', { unique: false });
                }
            };
        });
    }

    async saveMessage(message: SecretMessageDB): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(message);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getMessages(chatId: string, limit: number = 50): Promise<SecretMessageDB[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('chatId');
            const request = index.getAll(chatId);

            request.onsuccess = () => {
                const messages = request.result
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, limit)
                    .reverse();
                resolve(messages);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async deleteMessage(messageId: string): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(messageId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteChatMessages(chatId: string): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('chatId');
            const request = index.openCursor(IDBKeyRange.only(chatId));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => reject(request.error);
        });
    }
}
```

### 2. Хук для секретного режима

```typescript
// useSecretMode.hook.ts
import { useState, useEffect } from 'react';
import { useSecretChatMode } from '@/modules/features/secret-chat-mode';

export const useSecretMode = (chatId: string) => {
    const [isSecretMode, setIsSecretMode] = useState(false);
    const { toggleSecretMode } = useSecretChatMode(chatId);

    // Загружаем состояние из localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`secret-mode-${chatId}`);
        if (saved === 'true') {
            setIsSecretMode(true);
        }
    }, [chatId]);

    const toggle = async () => {
        if (isSecretMode) {
            // Показываем предупреждение
            const confirmed = window.confirm(
                'Выключение секретного режима удалит все секретные сообщения из этого чата. Продолжить?'
            );
            if (!confirmed) return;
        }

        await toggleSecretMode(!isSecretMode);
        setIsSecretMode(!isSecretMode);
        localStorage.setItem(`secret-mode-${chatId}`, String(!isSecretMode));
    };

    return {
        isSecretMode,
        toggle,
    };
};
```

### 3. Хук для секретных сообщений

```typescript
// useSecretMessages.hook.ts
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEncryptedMessage } from '@/modules/entities/encryption';
import { SecretMessagesDB } from '../storage/secret-messages-db';
import { useSignalProtocol } from '@/modules/entities/encryption';

export const useSecretMessages = (chatId: string, isSecretMode: boolean) => {
    const [db] = useState(() => new SecretMessagesDB());
    const { encryptMessage, decryptMessage } = useEncryptedMessage();
    const { sendSignalMessage } = useSignalProtocol();

    // Загружаем сообщения из IndexedDB
    const { data: messages, refetch } = useQuery({
        queryKey: ['secret-messages', chatId],
        queryFn: async () => {
            if (!isSecretMode) return [];
            await db.init();
            const encryptedMessages = await db.getMessages(chatId);

            // Расшифровываем сообщения
            const decryptedMessages = await Promise.all(
                encryptedMessages.map(async (msg) => {
                    try {
                        const decrypted = await decryptMessage(msg.encryptedContent, msg.senderId);
                        return {
                            ...msg,
                            content: decrypted,
                            isDecrypted: true,
                        };
                    } catch (error) {
                        console.error('Failed to decrypt message:', error);
                        return {
                            ...msg,
                            content: 'Не удалось расшифровать сообщение',
                            isDecrypted: false,
                        };
                    }
                })
            );

            return decryptedMessages;
        },
        enabled: isSecretMode,
    });

    // Отправка секретного сообщения
    const sendSecretMessage = useMutation({
        mutationFn: async (content: string) => {
            if (!isSecretMode) throw new Error('Secret mode is not enabled');

            // Получаем ID получателя (из чата)
            const receiverId = await getReceiverId(chatId);

            // Шифруем сообщение
            const encrypted = await encryptMessage(content, receiverId);

            // Создаем объект сообщения
            const message: SecretMessageDB = {
                id: `secret-${Date.now()}-${Math.random()}`,
                chatId,
                senderId: currentUserId,
                receiverId,
                encryptedContent: encrypted,
                timestamp: Date.now(),
                messageType: 'TEXT',
                isRead: false,
                isDelivered: false,
            };

            // Сохраняем в IndexedDB
            await db.saveMessage(message);

            // Отправляем через Signal Protocol (peer-to-peer или через сервер для обмена ключами)
            await sendSignalMessage({
                chatId,
                receiverId,
                encryptedContent: encrypted,
                messageId: message.id,
            });

            return message;
        },
        onSuccess: () => {
            refetch();
        },
    });

    return {
        messages: messages || [],
        sendSecretMessage: sendSecretMessage.mutateAsync,
        isSending: sendSecretMessage.isPending,
    };
};
```

### 4. Компонент переключения секретного режима

```typescript
// SecretModeToggle.tsx
import { Lock, LockOpen } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useSecretMode } from '@/modules/entities/secret-messages';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface SecretModeToggleProps {
    chatId: string;
}

export const SecretModeToggle = ({ chatId }: SecretModeToggleProps) => {
    const { isSecretMode, toggle } = useSecretMode(chatId);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggle}
                        className={isSecretMode ? 'text-yellow-500' : ''}
                    >
                        {isSecretMode ? (
                            <Lock className="h-4 w-4" />
                        ) : (
                            <LockOpen className="h-4 w-4" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    {isSecretMode ? 'Выключить секретный режим' : 'Включить секретный режим'}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
```

### 5. Интеграция в ChatMessagesWidget

```typescript
// ChatMessagesWidget.tsx (обновление)
import { SecretModeToggle } from '@/modules/features/secret-chat-mode';
import { SecretChatMessagesWidget } from '@/modules/widgetes/chat/SecretChatMessagesWidget';
import { useSecretMode } from '@/modules/entities/secret-messages';

export const ChatMessagesWidget = ({ chatId, currentUserId, selectedChat }: ChatMessagesWidgetProps) => {
    const { isSecretMode } = useSecretMode(chatId || '');

    // Если секретный режим - показываем секретные сообщения
    if (isSecretMode && chatId) {
        return (
            <div className="flex flex-col h-full">
                <div className="sticky top-0 z-40 border-b p-4 bg-card flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/network/chats/list">
                            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <h3 className="font-semibold">Секретный чат</h3>
                        <span className="text-xs text-yellow-500">🔒 Зашифровано</span>
                    </div>
                    <SecretModeToggle chatId={chatId} />
                </div>
                <SecretChatMessagesWidget chatId={chatId} currentUserId={currentUserId} />
            </div>
        );
    }

    // Обычный режим - существующая логика
    return (
        // ... существующий код
        <div className="sticky top-0 z-40 border-b p-4 bg-card flex-shrink-0 flex items-center justify-between">
            {/* ... */}
            <div className="flex gap-2 justify-center">
                <SecretModeToggle chatId={chatId || ''} />
                {/* ... существующие кнопки звонков */}
            </div>
        </div>
        // ...
    );
};
```

### 6. Интеграция в ChatInputWidget

```typescript
// ChatInputWidget.tsx (обновление)
import { useSecretMode } from '@/modules/entities/secret-messages';
import { useSecretMessages } from '@/modules/entities/secret-messages';

export const ChatInputWidget = ({ chatId, ...props }: ChatInputWidgetProps & { chatId: string }) => {
    const { isSecretMode } = useSecretMode(chatId);
    const { sendSecretMessage, isSending } = useSecretMessages(chatId, isSecretMode);

    const handleSend = async () => {
        if (isSecretMode) {
            // Отправляем секретное сообщение
            await sendSecretMessage(messageText);
        } else {
            // Обычная отправка
            onSendMessage();
        }
    };

    return (
        <div className="border-t p-4 bg-card flex-shrink-0">
            {isSecretMode && (
                <div className="mb-2 text-xs text-yellow-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Секретный режим: сообщения не сохраняются на сервере
                </div>
            )}
            {/* ... существующий код */}
        </div>
    );
};
```

### 7. WebSocket для секретных сообщений

**Вариант 1: Через существующий WebSocket (для обмена ключами и метаданными)**

```typescript
// Использовать существующий WebSocket для:
// 1. Обмена ключами Signal Protocol
// 2. Уведомления о новых секретных сообщениях (только метаданные: messageId, timestamp)
// 3. Статусы доставки и прочтения

// События:
// - 'secret-message:key-exchange' - обмен ключами
// - 'secret-message:notification' - уведомление о новом сообщении (только ID)
// - 'secret-message:delivered' - сообщение доставлено
// - 'secret-message:read' - сообщение прочитано
```

**Вариант 2: Peer-to-peer через Signal Protocol**

```typescript
// Использовать Signal Protocol для прямой передачи зашифрованных сообщений
// Сервер используется только для обмена ключами (prekeys)
// Сообщения передаются напрямую между клиентами
```

## Поток работы

### Включение секретного режима

1. Пользователь нажимает кнопку "Секретный режим"
2. Проверяется наличие ключей Signal Protocol для собеседника
3. Если ключей нет - инициируется обмен ключами
4. Состояние сохраняется в localStorage
5. UI переключается на секретный режим

### Отправка секретного сообщения

1. Пользователь вводит сообщение
2. При отправке сообщение шифруется через Signal Protocol
3. Зашифрованное сообщение сохраняется в IndexedDB
4. Зашифрованное сообщение отправляется через Signal Protocol (peer-to-peer или через сервер для обмена ключами)
5. Сообщение отображается в чате (расшифрованное)

### Получение секретного сообщения

1. Получаем уведомление о новом секретном сообщении (через WebSocket или Signal Protocol)
2. Загружаем зашифрованное сообщение из IndexedDB (или получаем через Signal Protocol)
3. Расшифровываем сообщение через Signal Protocol
4. Отображаем в чате

### Выключение секретного режима

1. Пользователь нажимает кнопку "Выключить секретный режим"
2. Показывается предупреждение о удалении всех секретных сообщений
3. При подтверждении - удаляются все секретные сообщения из IndexedDB
4. Состояние сохраняется в localStorage
5. UI переключается на обычный режим

## Синхронизация между устройствами

### Проблема

Секретные сообщения хранятся только на клиенте. При входе с другого устройства сообщения не видны.

### Решение

1. **Использовать Signal Protocol для синхронизации**:
   - Ключи хранятся в IndexedDB и синхронизируются через сервер (зашифрованные)
   - Сообщения синхронизируются через Signal Protocol (peer-to-peer или через сервер для обмена ключами)

2. **Опционально: Синхронизация через сервер (зашифрованные)**:
   - Сообщения шифруются на клиенте
   - Зашифрованные сообщения сохраняются на сервере (сервер не может их расшифровать)
   - При входе с другого устройства - загружаются зашифрованные сообщения
   - Расшифровываются на клиенте

## Ограничения

1. **Секретные сообщения не синхронизируются между устройствами по умолчанию** (только через Signal Protocol peer-to-peer)
2. **При очистке IndexedDB все секретные сообщения теряются**
3. **Секретный режим работает только для приватных чатов (не для групповых)**
4. **Требуется реализация Signal Protocol перед началом работы**

## Связанные задачи

- [Сквозное шифрование для чатов и звонков](./end-to-end-encryption.md) - **обязательно** перед началом
- [Backend задача по секретному режиму](../../backend/tasks/secret-chat-mode.md) - обмен ключами и метаданными

## Этапы реализации

### Этап 1: Подготовка

- [ ] Убедиться, что Signal Protocol реализован
- [ ] Создать структуру IndexedDB для секретных сообщений
- [ ] Создать хуки для работы с IndexedDB

### Этап 2: UI компоненты

- [ ] Создать компонент `SecretModeToggle`
- [ ] Создать компонент `SecretModeIndicator`
- [ ] Создать компонент `SecretModeWarning`
- [ ] Интегрировать в `ChatMessagesWidget`

### Этап 3: Логика секретного режима

- [ ] Реализовать хук `useSecretMode`
- [ ] Реализовать хук `useSecretMessages`
- [ ] Интегрировать отправку секретных сообщений
- [ ] Интегрировать получение секретных сообщений

### Этап 4: Интеграция с Signal Protocol

- [ ] Интегрировать шифрование/расшифровку через Signal Protocol
- [ ] Реализовать обмен ключами
- [ ] Реализовать отправку через Signal Protocol

### Этап 5: Тестирование

- [ ] Протестировать включение/выключение секретного режима
- [ ] Протестировать отправку и получение секретных сообщений
- [ ] Протестировать синхронизацию между устройствами
- [ ] Протестировать безопасность (сервер не видит содержимое)
