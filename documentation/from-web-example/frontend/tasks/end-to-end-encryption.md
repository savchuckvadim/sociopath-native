# Сквозное шифрование для чатов и звонков

## Назначение

Реализовать сквозное шифрование (End-to-End Encryption, E2EE) для чатов и звонков по типу протокола Signal. Обеспечить полную конфиденциальность сообщений и звонков, чтобы только участники могли видеть содержимое.

## Справочная информация

**Протокол Signal** ([Wikipedia](https://ru.wikipedia.org/wiki/%D0%9F%D1%80%D0%BE%D1%82%D0%BE%D0%BA%D0%BE%D0%BB_Signal)):
- Использует **Double Ratchet Algorithm** для постоянного обновления ключей
- **Prekeys** и расширенный протокол тройного обмена ключами Диффи-Хеллмана (3-DH)
- Криптографические примитивы: **Curve25519**, **AES-256**, **HMAC-SHA256**
- Обеспечивает: конфиденциальность, целостность, аутентификацию, прямую секретность, пост-скомпрометированную безопасность
- Поддерживает асинхронную связь (оффлайновые сообщения)
- Устойчив к искаженному порядку сообщений

## Требования

### Функционал

1. **Сквозное шифрование для чатов**:
   - Шифрование сообщений на клиенте перед отправкой
   - Расшифровка на клиенте получателя
   - Сервер не может видеть содержимое сообщений
   - Поддержка для обычных и секретных чатов

2. **Сквозное шифрование для звонков**:
   - Шифрование медиа-потоков в LiveKit
   - Использование DTLS-SRTP для звонков
   - Защита аудио и видео данных

3. **Управление ключами**:
   - Генерация ключевых пар для каждого пользователя
   - Обмен ключами через сервер (prekeys)
   - Хранение ключей на клиенте (IndexedDB)
   - Ротация ключей (Double Ratchet)

4. **Безопасность**:
   - Forward secrecy (прямая секретность)
   - Post-compromise security (безопасность после компрометации)
   - Аутентификация участников
   - Защита от MITM атак

## Архитектура FSD

### Entity: `modules/entities/encryption/`

**Структура**:
```
entities/encryption/
├── index.ts
├── ui/
│   └── EncryptionStatus/
│       └── EncryptionStatus.tsx        # Индикатор статуса шифрования
├── lib/
│   ├── api/
│   │   └── encryption.service.ts       # API для обмена ключами
│   ├── hook/
│   │   ├── useEncryption.hook.ts       # Хук для работы с шифрованием
│   │   ├── useKeyExchange.hook.ts      # Хук для обмена ключами
│   │   └── useEncryptedMessage.hook.ts # Хук для шифрования/расшифровки сообщений
│   ├── crypto/
│   │   ├── signal-protocol.ts          # Реализация Signal Protocol
│   │   ├── double-ratchet.ts           # Double Ratchet Algorithm
│   │   ├── key-exchange.ts             # Обмен ключами (3-DH)
│   │   ├── prekeys.ts                  # Управление prekeys
│   │   └── storage.ts                   # Хранение ключей (IndexedDB)
│   └── utils/
│       └── encryption.utils.ts        # Утилиты шифрования
└── model/
    └── types.ts                         # Типы для шифрования
```

### Feature: `modules/features/encrypted-chat/`

**Структура**:
```
features/encrypted-chat/
├── index.ts
├── ui/
│   ├── EncryptedChatIndicator/
│   │   └── EncryptedChatIndicator.tsx  # Индикатор зашифрованного чата
│   └── KeyExchangeDialog/
│       └── KeyExchangeDialog.tsx       # Диалог обмена ключами
└── lib/
    └── hook/
        └── useEncryptedChat.hook.ts    # Хук для зашифрованного чата
```

## Детальная реализация

### 1. Signal Protocol Implementation

**Библиотека**: Использовать существующую библиотеку или реализовать упрощенную версию

**Варианты**:
- `@privacyresearch/libsignal-protocol-typescript` - TypeScript реализация Signal Protocol
- `libsignal-protocol-javascript` - JavaScript версия
- Собственная упрощенная реализация

**Основные компоненты**:

```typescript
// signal-protocol.ts
export class SignalProtocol {
    private identityKeyPair: KeyPair;
    private preKeys: PreKey[];
    private signedPreKey: SignedPreKey;
    private sessionStore: SessionStore;
    private preKeyStore: PreKeyStore;

    // Генерация ключевых пар
    async generateIdentityKeyPair(): Promise<KeyPair>
    async generatePreKeys(count: number): Promise<PreKey[]>
    async generateSignedPreKey(): Promise<SignedPreKey>

    // Обмен ключами
    async processPreKeyBundle(bundle: PreKeyBundle): Promise<void>
    async createSession(recipientId: string, bundle: PreKeyBundle): Promise<void>

    // Шифрование/расшифровка
    async encryptMessage(recipientId: string, message: string): Promise<EncryptedMessage>
    async decryptMessage(senderId: string, encryptedMessage: EncryptedMessage): Promise<string>
}
```

### 2. Double Ratchet Algorithm

**Реализация**:

```typescript
// double-ratchet.ts
export class DoubleRatchet {
    private rootKey: Uint8Array;
    private sendingChainKey: Uint8Array;
    private receivingChainKey: Uint8Array;
    private sendingHeaderKey: Uint8Array;
    private receivingHeaderKey: Uint8Array;
    private messageKeys: Map<number, Uint8Array>;

    // Инициализация сессии
    async initialize(sharedSecret: Uint8Array, isInitiator: boolean): Promise<void>

    // Обновление ключей (ratchet)
    async ratchet(): Promise<void>

    // Шифрование сообщения
    async encrypt(plaintext: string): Promise<EncryptedMessage>

    // Расшифровка сообщения
    async decrypt(encryptedMessage: EncryptedMessage): Promise<string>
}
```

### 3. Key Exchange (3-DH)

**Протокол тройного обмена ключами**:

```typescript
// key-exchange.ts
export class KeyExchange {
    // Генерация shared secret через 3-DH
    async performKeyExchange(
        identityKeyA: PublicKey,
        ephemeralKeyA: PublicKey,
        signedPreKeyB: SignedPreKey,
        identityKeyB: PublicKey,
        ephemeralKeyB: PublicKey,
        preKeyB?: PreKey
    ): Promise<Uint8Array>

    // Создание prekey bundle для отправки
    async createPreKeyBundle(userId: string): Promise<PreKeyBundle>
}
```

### 4. Prekeys Management

**Управление prekeys**:

```typescript
// prekeys.ts
export class PreKeyManager {
    // Загрузка prekeys с сервера
    async fetchPreKeys(userId: string): Promise<PreKeyBundle>

    // Загрузка своих prekeys на сервер
    async uploadPreKeys(preKeys: PreKey[]): Promise<void>

    // Обновление prekeys
    async refreshPreKeys(): Promise<void>
}
```

### 5. Key Storage (IndexedDB)

**Хранение ключей на клиенте**:

```typescript
// storage.ts
export class EncryptionStorage {
    private db: IDBDatabase;

    // Сохранение ключей
    async saveIdentityKeyPair(keyPair: KeyPair): Promise<void>
    async savePreKeys(preKeys: PreKey[]): Promise<void>
    async saveSession(userId: string, session: Session): Promise<void>

    // Загрузка ключей
    async loadIdentityKeyPair(): Promise<KeyPair | null>
    async loadPreKeys(): Promise<PreKey[]>
    async loadSession(userId: string): Promise<Session | null>

    // Удаление ключей
    async deleteSession(userId: string): Promise<void>
}
```

### 6. Интеграция с сообщениями

**Шифрование перед отправкой**:

```typescript
// useEncryptedMessage.hook.ts
export const useEncryptedMessage = (chatId: string, recipientId: string) => {
    const signalProtocol = useSignalProtocol();

    const encryptMessage = async (content: string): Promise<string> => {
        // Проверяем, есть ли сессия
        let session = await signalProtocol.getSession(recipientId);

        if (!session) {
            // Создаем новую сессию через обмен ключами
            const bundle = await fetchPreKeyBundle(recipientId);
            await signalProtocol.createSession(recipientId, bundle);
            session = await signalProtocol.getSession(recipientId);
        }

        // Шифруем сообщение
        const encrypted = await signalProtocol.encryptMessage(recipientId, content);
        return JSON.stringify(encrypted);
    };

    const decryptMessage = async (encryptedContent: string, senderId: string): Promise<string> => {
        const encrypted = JSON.parse(encryptedContent);
        return await signalProtocol.decryptMessage(senderId, encrypted);
    };

    return { encryptMessage, decryptMessage };
};
```

**Обновление useSendMessage**:

```typescript
// В entities/messages/lib/hook/useSendMessage.hook.ts
const useSendMessage = (chatId: string) => {
    const { encryptMessage } = useEncryptedMessage(chatId, recipientId);
    const chat = useChat(chatId);
    const isEncrypted = chat?.type === 'SECRET' || chat?.isEncrypted;

    const sendMessage = async (content: string) => {
        let messageContent = content;

        // Шифруем если чат зашифрован
        if (isEncrypted) {
            messageContent = await encryptMessage(content);
        }

        // Отправляем через API
        await api.messagesCreate({
            chatId,
            content: messageContent,
            isEncrypted: isEncrypted
        });
    };

    return { sendMessage };
};
```

**Обновление useChatMessages**:

```typescript
// В entities/messages/lib/hook/useChatMessages.hook.ts
const useChatMessages = (chatId: string) => {
    const { decryptMessage } = useEncryptedMessage(chatId, senderId);
    const chat = useChat(chatId);
    const isEncrypted = chat?.type === 'SECRET' || chat?.isEncrypted;

    const messages = useQuery({
        queryKey: ['messages', chatId],
        queryFn: async () => {
            const messages = await api.messagesGetByChatId(chatId);

            // Расшифровываем если чат зашифрован
            if (isEncrypted) {
                return Promise.all(
                    messages.map(async (msg) => {
                        if (msg.isEncrypted) {
                            const decrypted = await decryptMessage(msg.content, msg.senderId);
                            return { ...msg, content: decrypted, decrypted: true };
                        }
                        return msg;
                    })
                );
            }

            return messages;
        }
    });

    return messages;
};
```

### 7. Интеграция с LiveKit (звонки)

**LiveKit уже поддерживает E2EE**:

```typescript
// В features/call/lib/hook/useLiveKitCall.hook.ts
const useLiveKitCall = (roomName: string) => {
    const { token } = useLivekitToken(roomName);

    const connect = async () => {
        const room = new Room({
            // Включаем E2EE для звонков
            e2ee: {
                keyProvider: new E2EEKeyProvider(),
            },
        });

        await room.connect(LIVEKIT_URL, token);

        // Настройка медиа с шифрованием
        await room.localParticipant.enableCameraAndMicrophone({
            videoCodec: 'vp9', // Поддержка E2EE
        });
    };

    return { connect };
};
```

**Использование E2EE в LiveKit**:

```typescript
import { E2EEKeyProvider, createE2EEKeyProvider } from 'livekit-client';

// Создание key provider
const keyProvider = createE2EEKeyProvider();

// Подключение с E2EE
const room = new Room({
    e2ee: {
        keyProvider: keyProvider,
    },
});
```

### 8. UI компоненты

**EncryptionStatus**:

```typescript
// EncryptionStatus.tsx
export const EncryptionStatus = ({ chatId }: { chatId: string }) => {
    const { isEncrypted, encryptionStatus } = useEncryption(chatId);

    if (!isEncrypted) return null;

    return (
        <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            <span>
                {encryptionStatus === 'verified' && 'Зашифровано и проверено'}
                {encryptionStatus === 'unverified' && 'Зашифровано (не проверено)'}
            </span>
        </div>
    );
};
```

**KeyExchangeDialog**:

```typescript
// KeyExchangeDialog.tsx
export const KeyExchangeDialog = ({
    userId,
    onComplete
}: {
    userId: string;
    onComplete: () => void;
}) => {
    const { exchangeKeys, isLoading } = useKeyExchange();

    const handleExchange = async () => {
        await exchangeKeys(userId);
        onComplete();
    };

    return (
        <Dialog>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Обмен ключами шифрования</DialogTitle>
                    <DialogDescription>
                        Для безопасного общения необходимо обменяться ключами шифрования
                    </DialogDescription>
                </DialogHeader>
                <Button onClick={handleExchange} disabled={isLoading}>
                    {isLoading ? 'Обмен...' : 'Начать обмен ключами'}
                </Button>
            </DialogContent>
        </Dialog>
    );
};
```

## Интеграция с существующими модулями

### Messages

- Обновить `useSendMessage` для шифрования перед отправкой
- Обновить `useChatMessages` для расшифровки при получении
- Добавить флаг `isEncrypted` в сообщения

### Chats

- Добавить поле `isEncrypted` в модель чата
- Показывать индикатор шифрования в UI
- Автоматически включать шифрование для SECRET чатов

### Calls (LiveKit)

- Использовать встроенную поддержку E2EE в LiveKit
- Настроить E2EEKeyProvider
- Включить E2EE при подключении к комнате

## Задачи

### Этап 1: Базовая инфраструктура

- [ ] Выбрать библиотеку Signal Protocol или реализовать упрощенную версию
- [ ] Создать entity `encryption` с базовой структурой
- [ ] Реализовать хранение ключей в IndexedDB
- [ ] Создать API endpoints для обмена prekeys

### Этап 2: Signal Protocol

- [ ] Реализовать Double Ratchet Algorithm
- [ ] Реализовать 3-DH key exchange
- [ ] Реализовать управление prekeys
- [ ] Реализовать шифрование/расшифровку сообщений

### Этап 3: Интеграция с чатами

- [ ] Интегрировать шифрование в `useSendMessage`
- [ ] Интегрировать расшифровку в `useChatMessages`
- [ ] Обновить WebSocket для работы с зашифрованными сообщениями
- [ ] Добавить UI индикаторы шифрования

### Этап 4: Интеграция с звонками

- [ ] Настроить E2EE в LiveKit
- [ ] Реализовать E2EEKeyProvider
- [ ] Протестировать зашифрованные звонки

### Этап 5: Безопасность

- [ ] Реализовать верификацию ключей (fingerprint)
- [ ] Реализовать forward secrecy
- [ ] Реализовать post-compromise security
- [ ] Добавить защиту от MITM атак

### Этап 6: Тестирование

- [ ] Unit тесты для криптографических функций
- [ ] Integration тесты для обмена ключами
- [ ] E2E тесты для зашифрованных чатов и звонков

## Файлы для работы

### Создать

- `modules/entities/encryption/` - новый entity
- `modules/entities/encryption/lib/crypto/signal-protocol.ts`
- `modules/entities/encryption/lib/crypto/double-ratchet.ts`
- `modules/entities/encryption/lib/crypto/key-exchange.ts`
- `modules/entities/encryption/lib/crypto/prekeys.ts`
- `modules/entities/encryption/lib/crypto/storage.ts`
- `modules/features/encrypted-chat/` - новый feature

### Обновить

- `modules/entities/messages/lib/hook/useSendMessage.hook.ts`
- `modules/entities/messages/lib/hook/useChatMessages.hook.ts`
- `modules/features/call/lib/hook/useLiveKitCall.hook.ts`
- `modules/widgetes/chat/` - добавить индикаторы шифрования

## Связанные задачи

- [Backend задача по сквозному шифрованию](../../backend/tasks/end-to-end-encryption.md) - связанная backend задача

## Примечания

- Использовать проверенные криптографические библиотеки
- Не изобретать собственные криптографические алгоритмы
- Следовать принципам Signal Protocol
- Обеспечить совместимость с существующими чатами (постепенное внедрение)
- Тестировать на разных устройствах и браузерах
