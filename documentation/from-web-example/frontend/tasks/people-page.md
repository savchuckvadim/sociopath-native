# Страница People (Пользователи)

## Назначение

Привести страницу People в соответствие с дизайн-макетом: обновить карточку пользователя (UserCard), добавить пагинацию с бесконечным скроллом, кнопку "Наверх", и обеспечить фиксированный header и left navigation при скролле.

## Текущее состояние

**Страница**: `/network/people`

**Компоненты**:
- `modules/entities/user/ui/Users.tsx` - список пользователей
- `modules/entities/user/ui/UserCard.tsx` - карточка пользователя

**API**:
- `GET /api/user` - получение всех пользователей (без пагинации)

## Требования

### 1. UserCard по дизайн-макету

- Привести карточку пользователя в соответствие с дизайн-макетом
- Обновить структуру, стили, расположение элементов
- Использовать компоненты из дизайн-системы

### 2. Пагинация с бесконечным скроллом

- Cursor-based пагинация (как в ленте новостей)
- Бесконечный скролл вниз
- Предзагрузка следующей страницы (за 3 карточки до конца)
- Индикатор загрузки

### 3. Кнопка "Наверх"

- Fixed position в правом нижнем углу
- Появляется при скролле вниз (после 300px)
- Плавная прокрутка наверх
- Исчезает когда пользователь наверху

### 4. Фиксированный layout

- Header остается неподвижным при скролле
- Left navigation остается неподвижным при скролле
- Список пользователей перемещается при скролле
- Аналогично страницам feeds и posts профиля

## Архитектура FSD

### Entity: `modules/entities/user/`

**Обновление существующего entity**:
```
entities/user/
├── ui/
│   ├── UserCard/
│   │   ├── UserCard.tsx              # Обновить по дизайн-макету
│   │   └── index.ts
│   └── Users/
│       ├── Users.tsx                 # Обновить с пагинацией
│       └── index.ts
├── lib/
│   ├── api/
│   │   └── user.service.ts           # Обновить для пагинации
│   └── hook/
│       ├── useUsers.hook.ts          # Обновить с infinite query
│       └── useUser.hook.ts
└── model/
    └── types.ts
```

### Feature: `modules/features/users-list/` (опционально)

Если нужна дополнительная функциональность:
```
features/users-list/
├── ui/
│   ├── UsersListPage/
│   │   └── UsersListPage.tsx
│   └── UsersFilters/
│       └── UsersFilters.tsx         # Фильтры
└── lib/
    └── hook/
        └── useUsersList.hook.ts
```

## Детальная реализация

### 1. Обновление UserCard

**Привести к дизайн-макету**:
- Проверить дизайн-макет
- Обновить структуру компонента
- Использовать компоненты из `@workspace/design-system`
- Обновить стили (Tailwind)

**Пример структуры**:
```typescript
// UserCard.tsx
export const UserCard = ({ user }: { user: UserDto }) => {
    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar src={user.avatarUrl} alt={user.name} />
                    <div>
                        <CardTitle>
                            <Link href={`/network/people/${user.id}`}>
                                {user.name}
                            </Link>
                        </CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Статус, кнопки и т.д. по дизайн-макету */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        {user.isFriend ? 'Друг' : user.isFollower ? 'Подписан' : ''}
                    </span>
                    {user.isFollowing ? (
                        <Button onClick={() => unfollow(user.id)}>
                            Отписаться
                        </Button>
                    ) : (
                        <Button onClick={() => follow(user.id)}>
                            Подписаться
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
```

### 2. Пагинация с бесконечным скроллом

**Стратегия предзагрузки для плавного скролла**:

**Важно**: Нужно заранее загружать больше элементов, чем помещается на экране, чтобы скролл был без швов и пользователь не видел пустого пространства.

**Принцип**:
1. **Первая загрузка**: Загружать достаточно элементов, чтобы заполнить экран + запас (например, 2-3 экрана)
2. **При скролле**: Начинать загрузку следующей страницы заранее (за 3-5 карточек до конца)
3. **Буферизация**: Держать в памяти больше элементов, чем видно на экране

**Использование useInfiniteQuery**:

```typescript
// useUsers.hook.ts
export const useUsers = (currentUserId: string) => {
    const api = getUser();

    return useInfiniteQuery({
        queryKey: ['users', 'list', currentUserId],
        queryFn: ({ pageParam }) =>
            api.userGet({
                cursor: pageParam,
                limit: 30 // Загружаем больше для плавного скролла
            }),
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined,
        // Настройки для плавного скролла
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 минут
    });
};
```

**Компонент с бесконечным скроллом**:

```typescript
// Users.tsx
export const Users = ({ userId }: { userId: string }) => {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useUsers(userId);

    const users = data?.pages.flatMap(page => page.users) ?? [];

    // Intersection Observer для автоматической загрузки
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Предзагрузка для плавного скролла (за 5 карточек до конца)
    useEffect(() => {
        // Вычисляем видимые карточки
        const cardHeight = 200; // Примерная высота карточки
        const viewportHeight = window.innerHeight;
        const scrollTop = window.scrollY;
        const visibleStart = Math.floor(scrollTop / cardHeight);
        const visibleEnd = Math.ceil((scrollTop + viewportHeight) / cardHeight);
        const totalVisible = visibleEnd - visibleStart;

        // Начинаем загрузку за 5 карточек до конца видимой области
        const prefetchThreshold = visibleEnd + 5;
        const shouldPrefetch = users.length < prefetchThreshold;

        if (shouldPrefetch && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [users.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="space-y-4">
            {users.map((user) => (
                <UserCard key={user.id} user={user} />
            ))}

            {/* Триггер для загрузки */}
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                {isFetchingNextPage && <LoadingSpinner />}
            </div>
        </div>
    );
};
```

### 3. Кнопка "Наверх"

**Использовать компонент из news-module**:

```typescript
// ScrollToTopButton.tsx (можно вынести в shared)
import { ArrowUp } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useState, useEffect } from 'react';

export const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!isVisible) return null;

    return (
        <Button
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 z-40 rounded-full p-3 shadow-lg"
            size="icon"
        >
            <ArrowUp className="w-5 h-5" />
        </Button>
    );
};
```

**Интеграция на странице**:

```typescript
// app/network/people/page.tsx
export default function PeoplePage() {
    const { currentUser } = useAuth();

    return (
        <div>
            <Users userId={currentUser.id} />
            <ScrollToTopButton />
        </div>
    );
}
```

### 4. Фиксированный layout

**Структура страницы**:

```typescript
// app/network/people/page.tsx
export default function PeoplePage() {
    const { currentUser } = useAuth();

    return (
        <div className="flex h-screen">
            {/* Left Navigation - фиксированная */}
            <aside className="fixed left-0 top-0 h-full w-64 border-r">
                <Navigation />
            </aside>

            {/* Main Content - с отступом для navigation */}
            <main className="ml-64 flex-1 overflow-y-auto">
                {/* Header - фиксированный */}
                <header className="sticky top-0 z-30 bg-background border-b">
                    <div className="px-4 py-4">
                        <h1 className="text-2xl font-bold">Пользователи</h1>
                    </div>
                </header>

                {/* Список пользователей - скроллится */}
                <div className="px-4 py-4">
                    <Users userId={currentUser.id} />
                </div>
            </main>

            {/* Кнопка "Наверх" */}
            <ScrollToTopButton />
        </div>
    );
}
```

**Альтернатива через layout**:

Если header и navigation уже в layout, нужно убедиться, что они имеют `sticky` или `fixed` позиционирование:

```typescript
// app/network/layout.tsx (если есть)
export default function NetworkLayout({ children }) {
    return (
        <div className="flex h-screen">
            <aside className="sticky top-0 h-screen w-64 border-r">
                <Navigation />
            </aside>
            <main className="flex-1 overflow-y-auto">
                <header className="sticky top-0 z-30 bg-background border-b">
                    {/* Header content */}
                </header>
                {children}
            </main>
        </div>
    );
}
```

## Оптимизации производительности

### Проблемы при быстром скролле

1. **Большое количество DOM элементов**:
   - При быстром скролле и загрузке большого количества элементов DOM становится тяжелым
   - Медленный рендеринг и обновление
   - Задержки при скролле

2. **Множественные перерисовки**:
   - Каждый новый элемент вызывает перерисовку
   - React перерисовывает весь список при обновлении

3. **Память**:
   - Хранение большого количества элементов в памяти
   - Утечки памяти при быстром скролле

### Решения

#### 1. Виртуализация списка

**Использование react-window или @tanstack/react-virtual**:

```typescript
// Users.tsx с виртуализацией
import { useVirtualizer } from '@tanstack/react-virtual';

export const Users = ({ userId }: { userId: string }) => {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useUsers(userId);

    const users = data?.pages.flatMap(page => page.users) ?? [];
    const parentRef = useRef<HTMLDivElement>(null);

    // Виртуализация - рендерим только видимые элементы
    const virtualizer = useVirtualizer({
        count: users.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 200, // Высота карточки
        overscan: 5, // Рендерим 5 дополнительных элементов сверху и снизу
    });

    // Автоматическая загрузка при приближении к концу
    useEffect(() => {
        const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
        if (!lastItem) return;

        // Если последний видимый элемент близко к концу, загружаем следующую страницу
        if (lastItem.index >= users.length - 5 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, users.length, virtualizer]);

    return (
        <div ref={parentRef} className="h-full overflow-auto">
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const user = users[virtualItem.index];
                    return (
                        <div
                            key={virtualItem.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <UserCard user={user} />
                        </div>
                    );
                })}
            </div>

            {isFetchingNextPage && (
                <div className="flex justify-center p-4">
                    <LoadingSpinner />
                </div>
            )}
        </div>
    );
};
```

**Преимущества виртуализации**:
- Рендерится только видимые элементы (10-20 вместо 100+)
- Плавный скролл даже при большом количестве элементов
- Низкое потребление памяти
- Быстрый рендеринг

#### 2. Мемоизация компонентов

**React.memo для UserCard**:

```typescript
// UserCard.tsx
export const UserCard = React.memo(({ user }: { user: UserDto }) => {
    // ... компонент
}, (prevProps, nextProps) => {
    // Кастомная функция сравнения
    return prevProps.user.id === nextProps.user.id &&
           prevProps.user.isFollowing === nextProps.user.isFollowing;
});
```

**useMemo для вычисляемых значений**:

```typescript
// Users.tsx
const users = useMemo(
    () => data?.pages.flatMap(page => page.users) ?? [],
    [data]
);

const filteredUsers = useMemo(
    () => users.filter(/* фильтрация */),
    [users, search]
);
```

#### 3. Дебаунсинг скролла

**Оптимизация обработчиков скролла**:

```typescript
// useScrollHandler.ts
import { useCallback, useEffect, useRef } from 'react';

export const useScrollHandler = (callback: () => void, delay: number = 100) => {
    const timeoutRef = useRef<NodeJS.Timeout>();

    const handleScroll = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback();
        }, delay);
    }, [callback, delay]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [handleScroll]);
};
```

#### 4. Ленивая загрузка изображений

**Lazy loading для аватаров**:

```typescript
// UserCard.tsx
<Avatar
    src={user.avatarUrl}
    alt={user.name}
    loading="lazy" // Нативный lazy loading
    className="lazy-load" // Для Intersection Observer
/>
```

**Или через Intersection Observer**:

```typescript
// useLazyImage.ts
export const useLazyImage = (src: string) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setImageSrc(src);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [src]);

    return { imageSrc, imgRef };
};
```

#### 5. Ограничение количества элементов в памяти

**Очистка старых страниц**:

```typescript
// useUsers.hook.ts
return useInfiniteQuery({
    // ... настройки
    maxPages: 10, // Максимум 10 страниц в памяти (300 элементов при limit=30)
    // При превышении старые страницы удаляются
});
```

#### 6. Оптимизация React Query

**Настройки кэширования**:

```typescript
// useUsers.hook.ts
return useInfiniteQuery({
    // ... настройки
    staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
    gcTime: 10 * 60 * 1000, // 10 минут - время хранения в кэше
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    refetchOnMount: false, // Не обновлять при монтировании
});
```

### Стратегия загрузки для плавного скролла

**Многоуровневая предзагрузка**:

1. **Первая загрузка**: 30-50 элементов (заполняет 2-3 экрана)
2. **При скролле вниз**: Загружать следующую страницу за 5 карточек до конца
3. **Буферизация**: Держать в памяти 10-15 страниц (300-450 элементов)
4. **Очистка**: Удалять старые страницы при превышении лимита

**Реализация**:

```typescript
// Users.tsx
const PREFETCH_THRESHOLD = 5; // За сколько карточек до конца начинать загрузку
const INITIAL_LOAD_COUNT = 50; // Первая загрузка
const MAX_PAGES_IN_MEMORY = 15; // Максимум страниц в памяти

// Вычисление видимых элементов
const calculateVisibleRange = () => {
    const cardHeight = 200;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const visibleStart = Math.floor(scrollTop / cardHeight);
    const visibleEnd = Math.ceil((scrollTop + viewportHeight) / cardHeight);
    return { visibleStart, visibleEnd };
};

// Предзагрузка
useEffect(() => {
    const { visibleEnd } = calculateVisibleRange();
    const shouldPrefetch = users.length - visibleEnd < PREFETCH_THRESHOLD;

    if (shouldPrefetch && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
    }
}, [users.length, hasNextPage, isFetchingNextPage, fetchNextPage]);
```

## Интеграция с существующими модулями

### Использование компонентов

- Использовать `ScrollToTopButton` из `news-module` или вынести в `shared`
- Использовать паттерны пагинации из `news-module`
- Использовать компоненты из дизайн-системы
- Использовать виртуализацию из `performance-optimization` задачи

### API обновление

**Текущий endpoint**: `GET /api/user` (без пагинации)

**Нужно обновить** (или создать новый):
- `GET /api/user?cursor=...&limit=30` - с cursor-based пагинацией
- Возвращать `{ users: UserDto[], nextCursor?: string, hasNext: boolean }`
- Поддержка параметра `limit` (по умолчанию 20, максимум 50)

**Связанная backend задача**: См. [Backend задача по пагинации пользователей](../../backend/tasks/users-pagination.md)

**Или использовать существующий**:
- Если endpoint уже поддерживает пагинацию, использовать его

## Задачи

### Этап 1: Обновление UserCard

- [ ] Проверить дизайн-макет
- [ ] Обновить структуру UserCard
- [ ] Привести стили в соответствие с дизайн-макетом
- [ ] Использовать компоненты из дизайн-системы

### Этап 2: Пагинация и оптимизация

- [ ] Обновить API endpoint для поддержки пагинации (см. [Backend задачу](../../backend/tasks/users-pagination.md))
- [ ] Реализовать `useUsers` с `useInfiniteQuery`
- [ ] Настроить первую загрузку (30-50 элементов для плавного скролла)
- [ ] Добавить Intersection Observer для автоматической загрузки
- [ ] Реализовать предзагрузку (за 5 карточек до конца)
- [ ] Добавить индикаторы загрузки
- [ ] Реализовать виртуализацию списка (react-window или @tanstack/react-virtual)
- [ ] Добавить мемоизацию UserCard (React.memo)
- [ ] Оптимизировать обработчики скролла (дебаунсинг)
- [ ] Добавить lazy loading для аватаров
- [ ] Настроить ограничение количества элементов в памяти

### Этап 3: Кнопка "Наверх"

- [ ] Создать или использовать `ScrollToTopButton`
- [ ] Интегрировать на страницу people
- [ ] Протестировать появление/исчезновение

### Этап 4: Фиксированный layout

- [ ] Проверить текущий layout
- [ ] Обеспечить фиксированный header
- [ ] Обеспечить фиксированную left navigation
- [ ] Убедиться, что список пользователей скроллится
- [ ] Проверить на разных размерах экрана

### Этап 5: Тестирование

- [ ] Протестировать пагинацию
- [ ] Протестировать кнопку "Наверх"
- [ ] Протестировать фиксированный layout
- [ ] Проверить соответствие дизайн-макету

## Файлы для работы

### Обновить

- `modules/entities/user/ui/UserCard/UserCard.tsx` - привести к дизайн-макету
- `modules/entities/user/ui/Users/Users.tsx` - добавить пагинацию
- `modules/entities/user/lib/hook/useUsers.hook.ts` - обновить с infinite query
- `modules/entities/user/lib/api/user.service.ts` - обновить для пагинации
- `app/network/people/page.tsx` - обновить layout и добавить кнопку "Наверх"

### Создать (если нужно)

- `modules/shared/ui/ScrollToTopButton/ScrollToTopButton.tsx` - вынести в shared

## Связанные задачи

- [Модуль новости](./news-module.md) - использовать паттерны пагинации и кнопку "Наверх"
- [Backend задача по пагинации пользователей](../../backend/tasks/users-pagination.md) - **обязательно** - реализация пагинации на backend
- [Оптимизация производительности](./performance-optimization.md) - использовать виртуализацию и мемоизацию

## Примечания

- Использовать те же паттерны, что и в ленте новостей (feeds)
- Обеспечить единообразие с другими страницами (posts профиля)
- Следовать принципам FSD архитектуры
- Использовать компоненты из дизайн-системы
- Тестировать на разных устройствах
