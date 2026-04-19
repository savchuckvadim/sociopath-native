# Модуль новости

## Назначение

Создать модуль новостей (news feed) с лентой постов пользователей, фильтрацией, сортировкой и бесконечной прокруткой.

## Задачи

- [ ] Создать nav item "Лента" в главном меню
- [ ] Создать страницу `/network/feeds` (лента новостей)
- [ ] Реализовать ленту новостей с постами пользователей
- [ ] Реализовать "хитрую" пагинацию с бесконечной прокруткой
- [ ] Добавить кнопку "Наверх" для прокрутки в начало страницы
- [ ] Добавить фильтрацию и сортировку
- [ ] Добавить обновление ленты (pull to refresh)

## Архитектура FSD

### Entity: `modules/entities/news/` (опционально)

Если создавать отдельную entity:
```
entities/news/
├── index.ts
├── ui/
│   └── NewsFeed.tsx
├── lib/
│   ├── api/
│   │   └── news.service.ts
│   └── hook/
│       └── useNewsFeed.hook.ts
└── model/
    └── types.ts
```

### Feature: `modules/features/news/`

```
features/news/
├── index.ts
├── ui/
│   ├── NewsFeedPage.tsx
│   ├── NewsFilters.tsx
│   └── NewsSort.tsx
└── lib/
    └── hook/
        └── useNewsFilters.hook.ts
```

## Использование существующих entities

Можно использовать существующий `entities/post` вместо создания `entities/news`:
- Использовать `usePosts` или создать `useNewsFeed` который использует `usePosts`
- Фильтрация и сортировка на уровне feature

## Лента новостей

- Отображение постов пользователей
- Поддержка различных типов постов (текст, изображения, видео)
- Ленивая загрузка изображений

## Фильтрация

- По типу поста (все, текст, изображения, видео)
- По авторам (подписки, все)
- По дате (сегодня, неделя, месяц)

## Сортировка

- По дате (новые сначала, старые сначала)
- По популярности (лайки, комментарии)
- По релевантности (алгоритм)

## Бесконечная прокрутка (Infinite Scroll)

### Cursor-based пагинация

**Принцип работы**:
- Использовать cursor-based пагинацию (не offset-based)
- Cursor = дата последнего поста (`createdAt`)
- При скролле вниз загружать следующую порцию данных

### Реализация

**Хук**: `useInfinitePosts` или расширить `usePosts`

```typescript
const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
} = useInfiniteQuery({
    queryKey: ['posts', 'feed', filters, sort],
    queryFn: ({ pageParam }) =>
        postService.getFeed({
            cursor: pageParam,
            limit: 20,
            filters,
            sort
        }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined
});
```

**Intersection Observer**:
- Использовать `Intersection Observer API` для определения достижения конца списка
- При появлении триггера в viewport - вызывать `fetchNextPage()`

**Компонент триггера**:
```typescript
const LoadMoreTrigger = () => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <div ref={ref} className="h-20 flex items-center justify-center">
            {isFetchingNextPage && <LoadingSpinner />}
        </div>
    );
};
```

### Оптимизация загрузки

**Стратегия "хитрой" пагинации**:
1. **Первая загрузка**: 20 постов
2. **При скролле вниз**: загружать еще 20 постов
3. **Предзагрузка**: начинать загрузку следующей страницы когда пользователь близко к концу (например, за 3 поста до конца)
4. **Кэширование**: кэшировать загруженные посты в React Query

**Реализация предзагрузки**:
```typescript
// Начинаем загрузку когда осталось 3 поста до конца
const shouldPrefetch = posts.length - visibleIndex < 3;

useEffect(() => {
    if (shouldPrefetch && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
    }
}, [shouldPrefetch, hasNextPage, isFetchingNextPage]);
```

## Страница и навигация

### Nav Item "Лента"

**Расположение**: В главном меню приложения (sidebar или top navigation)

**Иконка**: Иконка ленты новостей (например, Newspaper или Rss из lucide-react)

**URL**: `/network/feeds`

**Компонент**: Добавить в существующую навигацию

**Пример**:
```typescript
<NavItem
    href="/network/feeds"
    icon={<Newspaper />}
    label="Лента"
    isActive={pathname === '/network/feeds'}
/>
```

### Страница `/network/feeds`

**Структура**:
```
app/network/feeds/
├── page.tsx                    # Основная страница ленты
└── components/
    ├── FeedFilters.tsx         # Компонент фильтров
    ├── FeedSort.tsx           # Компонент сортировки
    ├── FeedList.tsx           # Список постов
    └── ScrollToTopButton.tsx  # Кнопка "Наверх"
```

**Компоненты страницы**:
- Заголовок "Лента новостей"
- Фильтры и сортировка (вверху или в sidebar)
- Список постов с бесконечной прокруткой
- Кнопка "Наверх" (fixed position)
- Индикатор загрузки

## Бесконечная прокрутка (Infinite Scroll)

### Cursor-based пагинация

**Принцип работы**:
- Использовать cursor-based пагинацию (не offset-based)
- Cursor = дата последнего поста (`createdAt`)
- При скролле вниз загружать следующую порцию данных

### Реализация

**Хук**: `useInfinitePosts` или расширить `usePosts`

```typescript
const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
} = useInfiniteQuery({
    queryKey: ['posts', 'feed', filters, sort],
    queryFn: ({ pageParam }) =>
        postService.getFeed({
            cursor: pageParam,
            limit: 20,
            filters,
            sort
        }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined
});
```

**Intersection Observer**:
- Использовать `Intersection Observer API` для определения достижения конца списка
- При появлении триггера в viewport - вызывать `fetchNextPage()`

**Компонент триггера**:
```typescript
const LoadMoreTrigger = () => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <div ref={ref} className="h-20 flex items-center justify-center">
            {isFetchingNextPage && <LoadingSpinner />}
        </div>
    );
};
```

### Оптимизация загрузки

**Стратегия "хитрой" пагинации**:
1. **Первая загрузка**: 20 постов
2. **При скролле вниз**: загружать еще 20 постов
3. **Предзагрузка**: начинать загрузку следующей страницы когда пользователь близко к концу (например, за 3 поста до конца)
4. **Кэширование**: кэшировать загруженные посты в React Query

**Реализация предзагрузки**:
```typescript
// Начинаем загрузку когда осталось 3 поста до конца
const shouldPrefetch = posts.length - visibleIndex < 3;

useEffect(() => {
    if (shouldPrefetch && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
    }
}, [shouldPrefetch, hasNextPage, isFetchingNextPage]);
```

## Кнопка "Наверх"

### Компонент ScrollToTop

**Расположение**: Fixed position в правом нижнем углу (или рядом с аудиоплеером)

**Поведение**:
- Появляется при скролле вниз (например, после 300px)
- При клике - плавная прокрутка наверх
- Исчезает когда пользователь наверху

**Реализация**:
```typescript
const ScrollToTopButton = () => {
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

**Интеграция**:
- Добавить в layout страницы `/network/feeds`
- Учесть расположение относительно аудиоплеера (если он есть)

## Pull to refresh

- Обновление ленты при потягивании вниз
- Визуальная обратная связь
- Обновление данных (сброс пагинации, загрузка свежих постов)

**Реализация**:
- Использовать библиотеку `react-pull-to-refresh` или реализовать через touch events
- При pull to refresh - сбросить cursor и загрузить первые посты

## Backend требования

**Текущее состояние**:
- Endpoint `GET /api/posts/feed` уже существует
- Поддерживает cursor-based пагинацию
- Возвращает посты пользователей, на которых подписан текущий пользователь

**Что нужно улучшить**:
- [ ] Добавить поддержку фильтрации (по типу поста, по авторам, по дате)
- [ ] Добавить поддержку сортировки (по дате, по популярности)
- [ ] Добавить поддержку постов из групп (после реализации групп)
- [ ] Оптимизировать запросы (индексы, кэширование)

**Связанная backend задача**: См. [Backend задача по улучшению feed endpoint](../../backend/tasks/news-feed-endpoint.md)

## Задачи

### Этап 1: Навигация и страница

- [ ] Добавить nav item "Лента" в главное меню
- [ ] Создать страницу `/network/feeds`
- [ ] Создать базовую структуру страницы

### Этап 2: Базовая лента

- [ ] Интегрировать существующий endpoint `/api/posts/feed`
- [ ] Реализовать отображение постов
- [ ] Использовать существующие компоненты постов

### Этап 3: Бесконечная прокрутка

- [ ] Реализовать cursor-based пагинацию через `useInfiniteQuery`
- [ ] Добавить Intersection Observer для автоматической загрузки
- [ ] Реализовать предзагрузку (за 3 поста до конца)
- [ ] Добавить индикаторы загрузки

### Этап 4: Кнопка "Наверх"

- [ ] Создать компонент `ScrollToTopButton`
- [ ] Реализовать появление/исчезновение при скролле
- [ ] Добавить плавную прокрутку
- [ ] Интегрировать на страницу

### Этап 5: Фильтрация и сортировка

- [ ] Создать компоненты фильтров
- [ ] Интегрировать с backend endpoint (после обновления)
- [ ] Реализовать UI для фильтров и сортировки

### Этап 6: Pull to refresh

- [ ] Реализовать pull to refresh
- [ ] Добавить визуальную обратную связь
- [ ] Обновление данных при refresh

## Файлы для работы

### Создать

- `app/network/feeds/page.tsx` - страница ленты
- `app/network/feeds/components/FeedFilters.tsx` - фильтры
- `app/network/feeds/components/FeedSort.tsx` - сортировка
- `app/network/feeds/components/FeedList.tsx` - список постов
- `app/network/feeds/components/ScrollToTopButton.tsx` - кнопка "Наверх"
- `modules/features/news/lib/hook/useInfiniteFeed.hook.ts` - хук для бесконечной прокрутки

### Обновить

- Навигация (добавить nav item "Лента")
- `modules/entities/post/lib/api/post.service.ts` - добавить метод `getFeed` с параметрами
