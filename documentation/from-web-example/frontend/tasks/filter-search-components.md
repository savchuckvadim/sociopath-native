# Компоненты Filter и Search

## Назначение

Создать универсальные компоненты Filter и Search для использования в:
- Ленте постов (feeds)
- Сообщениях (chats)
- Списке пользователей (People)

Компоненты должны поддерживать:
- Фильтрацию по различным критериям (свои/не свои, подписчики/не подписчики и т.д.)
- Поиск по всему списку (не только по загруженным данным)
- Интеграцию с пагинацией
- Backend фильтрацию и поиск (не только клиентская)

## Требования

### Функционал

1. **Компонент Search**:
   - Универсальный компонент поиска
   - Дебаунсинг для оптимизации запросов
   - Индикатор загрузки
   - Очистка поиска
   - Интеграция с backend API

2. **Компонент Filter**:
   - Универсальный компонент фильтрации
   - Различные типы фильтров (чекбоксы, селекты, радио-кнопки)
   - Множественный выбор
   - Сброс фильтров
   - Интеграция с backend API

3. **Интеграция с пагинацией**:
   - Поиск и фильтрация работают на backend
   - При изменении фильтров/поиска - сброс пагинации
   - Поддержка cursor-based пагинации с фильтрами

## Архитектура FSD

### Shared: `modules/shared/ui/Filter/`

**Структура**:
```
shared/ui/
├── Filter/
│   ├── index.ts
│   ├── Filter.tsx                    # Основной компонент фильтра
│   ├── FilterGroup.tsx               # Группа фильтров
│   ├── FilterItem.tsx                # Отдельный фильтр
│   └── FilterTypes.ts                # Типы фильтров
└── Search/
    ├── index.ts
    ├── Search.tsx                    # Основной компонент поиска
    ├── SearchInput.tsx               # Поле ввода поиска
    └── SearchResults.tsx              # Результаты поиска (опционально)
```

### Feature: `modules/features/filter-search/`

**Структура**:
```
features/filter-search/
├── index.ts
├── ui/
│   ├── PostsFilter/
│   │   └── PostsFilter.tsx           # Фильтры для постов
│   ├── ChatsFilter/
│   │   └── ChatsFilter.tsx           # Фильтры для чатов
│   ├── UsersFilter/
│   │   └── UsersFilter.tsx           # Фильтры для пользователей
│   └── FilterSearchBar/
│       └── FilterSearchBar.tsx       # Комбинированный компонент (Filter + Search)
└── lib/
    ├── hook/
    │   ├── useFilter.hook.ts         # Хук для работы с фильтрами
    │   ├── useSearch.hook.ts         # Хук для работы с поиском
    │   └── useFilterSearch.hook.ts   # Комбинированный хук
    └── utils/
        └── filter-search.utils.ts    # Утилиты
```

## Детальная реализация

### 1. Компонент Search

**Базовый компонент**:

```typescript
// shared/ui/Search/Search.tsx
'use client';

import { Input } from '@workspace/ui/components/input';
import { Search as SearchIcon, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/modules/shared/lib/hooks/useDebounce';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

interface SearchProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    debounceMs?: number;
    isLoading?: boolean;
    className?: string;
    value?: string;
    defaultValue?: string;
}

export const Search = ({
    placeholder = 'Поиск...',
    onSearch,
    debounceMs = 300,
    isLoading = false,
    className,
    value: controlledValue,
    defaultValue = '',
}: SearchProps) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const debouncedValue = useDebounce(value, debounceMs);

    // Вызываем onSearch при изменении debounced значения
    useEffect(() => {
        onSearch(debouncedValue);
    }, [debouncedValue, onSearch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }
    };

    const handleClear = () => {
        if (controlledValue === undefined) {
            setInternalValue('');
        }
        onSearch('');
    };

    return (
        <div className={cn('relative flex-1', className)}>
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                className={cn(
                    'pl-10 pr-10',
                    isLoading && 'opacity-50'
                )}
                disabled={isLoading}
            />
            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={handleClear}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
            {isLoading && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                </div>
            )}
        </div>
    );
};
```

**Хук для поиска**:

```typescript
// features/filter-search/lib/hook/useSearch.hook.ts
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface UseSearchOptions {
    queryKey: string[];
    onSearch: (query: string) => Promise<void> | void;
    debounceMs?: number;
}

export const useSearch = ({ queryKey, onSearch, debounceMs = 300 }: UseSearchOptions) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const queryClient = useQueryClient();

    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        setIsSearching(true);

        try {
            // Инвалидируем кэш при изменении поиска
            queryClient.invalidateQueries({ queryKey });

            // Вызываем callback для поиска
            await onSearch(query);
        } finally {
            setIsSearching(false);
        }
    }, [queryKey, onSearch, queryClient]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        handleSearch('');
    }, [handleSearch]);

    return {
        searchQuery,
        isSearching,
        handleSearch,
        clearSearch,
    };
};
```

### 2. Компонент Filter

**Базовый компонент**:

```typescript
// shared/ui/Filter/Filter.tsx
'use client';

import { Button } from '@workspace/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { Filter as FilterIcon, X } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { cn } from '@workspace/ui/lib/utils';
import { FilterGroup } from './FilterGroup';

export type FilterValue = string | string[] | boolean | number | null;

export interface FilterOption {
    label: string;
    value: string | number;
    count?: number; // Количество результатов для этого фильтра
}

export interface FilterConfig {
    id: string;
    label: string;
    type: 'checkbox' | 'radio' | 'select' | 'multiselect';
    options: FilterOption[];
    defaultValue?: FilterValue;
}

export interface FilterProps {
    filters: FilterConfig[];
    values: Record<string, FilterValue>;
    onChange: (values: Record<string, FilterValue>) => void;
    onReset?: () => void;
    className?: string;
    variant?: 'default' | 'compact';
}

export const Filter = ({
    filters,
    values,
    onChange,
    onReset,
    className,
    variant = 'default',
}: FilterProps) => {
    const activeFiltersCount = Object.values(values).filter(
        (v) => v !== null && v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
    ).length;

    const handleFilterChange = (filterId: string, value: FilterValue) => {
        onChange({
            ...values,
            [filterId]: value,
        });
    };

    const handleReset = () => {
        const resetValues: Record<string, FilterValue> = {};
        filters.forEach((filter) => {
            resetValues[filter.id] = filter.defaultValue ?? null;
        });
        onChange(resetValues);
        onReset?.();
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="relative">
                        <FilterIcon className="h-4 w-4 mr-2" />
                        Фильтры
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Фильтры</h3>
                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Сбросить
                                </Button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {filters.map((filter) => (
                                <FilterGroup
                                    key={filter.id}
                                    filter={filter}
                                    value={values[filter.id]}
                                    onChange={(value) => handleFilterChange(filter.id, value)}
                                />
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
```

**FilterGroup компонент**:

```typescript
// shared/ui/Filter/FilterGroup.tsx
'use client';

import { Label } from '@workspace/ui/components/label';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { FilterConfig, FilterValue } from './Filter';

interface FilterGroupProps {
    filter: FilterConfig;
    value: FilterValue;
    onChange: (value: FilterValue) => void;
}

export const FilterGroup = ({ filter, value, onChange }: FilterGroupProps) => {
    const renderFilter = () => {
        switch (filter.type) {
            case 'checkbox':
                return (
                    <div className="space-y-2">
                        {filter.options.map((option) => {
                            const isChecked = Array.isArray(value)
                                ? value.includes(String(option.value))
                                : false;

                            return (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${filter.id}-${option.value}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            const currentValues = Array.isArray(value) ? value : [];
                                            if (checked) {
                                                onChange([...currentValues, String(option.value)]);
                                            } else {
                                                onChange(currentValues.filter(v => v !== String(option.value)));
                                            }
                                        }}
                                    />
                                    <Label
                                        htmlFor={`${filter.id}-${option.value}`}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {option.label}
                                        {option.count !== undefined && (
                                            <span className="text-muted-foreground ml-1">
                                                ({option.count})
                                            </span>
                                        )}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'radio':
                return (
                    <RadioGroup
                        value={value ? String(value) : undefined}
                        onValueChange={(newValue) => onChange(newValue)}
                    >
                        {filter.options.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={String(option.value)} id={`${filter.id}-${option.value}`} />
                                <Label
                                    htmlFor={`${filter.id}-${option.value}`}
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    {option.label}
                                    {option.count !== undefined && (
                                        <span className="text-muted-foreground ml-1">
                                            ({option.count})
                                        </span>
                                    )}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                );

            case 'select':
                return (
                    <Select
                        value={value ? String(value) : undefined}
                        onValueChange={(newValue) => onChange(newValue)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Выберите..." />
                        </SelectTrigger>
                        <SelectContent>
                            {filter.options.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                    {option.label}
                                    {option.count !== undefined && (
                                        <span className="text-muted-foreground ml-1">
                                            ({option.count})
                                        </span>
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'multiselect':
                // Для multiselect можно использовать кастомный компонент или библиотеку
                // Упрощенная версия через чекбоксы
                return (
                    <div className="space-y-2">
                        {filter.options.map((option) => {
                            const isChecked = Array.isArray(value)
                                ? value.includes(String(option.value))
                                : false;

                            return (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${filter.id}-${option.value}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            const currentValues = Array.isArray(value) ? value : [];
                                            if (checked) {
                                                onChange([...currentValues, String(option.value)]);
                                            } else {
                                                onChange(currentValues.filter(v => v !== String(option.value)));
                                            }
                                        }}
                                    />
                                    <Label
                                        htmlFor={`${filter.id}-${option.value}`}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {option.label}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">{filter.label}</Label>
            {renderFilter()}
        </div>
    );
};
```

### 3. Комбинированный компонент FilterSearchBar

```typescript
// features/filter-search/ui/FilterSearchBar/FilterSearchBar.tsx
'use client';

import { Search } from '@/modules/shared/ui/Search';
import { Filter, FilterConfig, FilterValue } from '@/modules/shared/ui/Filter';
import { useFilterSearch } from '../lib/hook/useFilterSearch';

interface FilterSearchBarProps {
    searchPlaceholder?: string;
    filters: FilterConfig[];
    onSearch: (query: string) => void;
    onFilterChange: (filters: Record<string, FilterValue>) => void;
    isSearching?: boolean;
    className?: string;
}

export const FilterSearchBar = ({
    searchPlaceholder = 'Поиск...',
    filters,
    onSearch,
    onFilterChange,
    isSearching = false,
    className,
}: FilterSearchBarProps) => {
    const { filterValues, handleFilterChange, handleSearch } = useFilterSearch({
        filters,
        onFilterChange,
        onSearch,
    });

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Search
                placeholder={searchPlaceholder}
                onSearch={handleSearch}
                isLoading={isSearching}
                className="flex-1"
            />
            {filters.length > 0 && (
                <Filter
                    filters={filters}
                    values={filterValues}
                    onChange={handleFilterChange}
                />
            )}
        </div>
    );
};
```

### 4. Специфичные фильтры для разных модулей

**Фильтры для постов**:

```typescript
// features/filter-search/ui/PostsFilter/PostsFilter.tsx
'use client';

import { FilterSearchBar } from '../FilterSearchBar';
import { FilterConfig } from '@/modules/shared/ui/Filter';

interface PostsFilterProps {
    onSearch: (query: string) => void;
    onFilterChange: (filters: Record<string, any>) => void;
    isSearching?: boolean;
}

export const PostsFilter = ({ onSearch, onFilterChange, isSearching }: PostsFilterProps) => {
    const filters: FilterConfig[] = [
        {
            id: 'type',
            label: 'Тип поста',
            type: 'multiselect',
            options: [
                { label: 'Все', value: 'all' },
                { label: 'Текст', value: 'text' },
                { label: 'Изображения', value: 'image' },
                { label: 'Видео', value: 'video' },
                { label: 'Аудио', value: 'audio' },
            ],
            defaultValue: ['all'],
        },
        {
            id: 'author',
            label: 'Автор',
            type: 'radio',
            options: [
                { label: 'Все', value: 'all' },
                { label: 'Мои подписки', value: 'following' },
                { label: 'Мои посты', value: 'my' },
            ],
            defaultValue: 'all',
        },
        {
            id: 'date',
            label: 'Дата',
            type: 'select',
            options: [
                { label: 'Все время', value: 'all' },
                { label: 'Сегодня', value: 'today' },
                { label: 'Неделя', value: 'week' },
                { label: 'Месяц', value: 'month' },
            ],
            defaultValue: 'all',
        },
    ];

    return (
        <FilterSearchBar
            searchPlaceholder="Поиск постов..."
            filters={filters}
            onSearch={onSearch}
            onFilterChange={onFilterChange}
            isSearching={isSearching}
        />
    );
};
```

**Фильтры для чатов**:

```typescript
// features/filter-search/ui/ChatsFilter/ChatsFilter.tsx
'use client';

import { FilterSearchBar } from '../FilterSearchBar';
import { FilterConfig } from '@/modules/shared/ui/Filter';

interface ChatsFilterProps {
    onSearch: (query: string) => void;
    onFilterChange: (filters: Record<string, any>) => void;
    isSearching?: boolean;
}

export const ChatsFilter = ({ onSearch, onFilterChange, isSearching }: ChatsFilterProps) => {
    const filters: FilterConfig[] = [
        {
            id: 'type',
            label: 'Тип чата',
            type: 'multiselect',
            options: [
                { label: 'Все', value: 'all' },
                { label: 'Приватные', value: 'private' },
                { label: 'Групповые', value: 'group' },
            ],
            defaultValue: ['all'],
        },
        {
            id: 'unread',
            label: 'Непрочитанные',
            type: 'checkbox',
            options: [
                { label: 'Только непрочитанные', value: 'unread' },
            ],
            defaultValue: null,
        },
    ];

    return (
        <FilterSearchBar
            searchPlaceholder="Поиск чатов..."
            filters={filters}
            onSearch={onSearch}
            onFilterChange={onFilterChange}
            isSearching={isSearching}
        />
    );
};
```

**Фильтры для пользователей**:

```typescript
// features/filter-search/ui/UsersFilter/UsersFilter.tsx
'use client';

import { FilterSearchBar } from '../FilterSearchBar';
import { FilterConfig } from '@/modules/shared/ui/Filter';

interface UsersFilterProps {
    onSearch: (query: string) => void;
    onFilterChange: (filters: Record<string, any>) => void;
    isSearching?: boolean;
}

export const UsersFilter = ({ onSearch, onFilterChange, isSearching }: UsersFilterProps) => {
    const filters: FilterConfig[] = [
        {
            id: 'relationship',
            label: 'Отношения',
            type: 'multiselect',
            options: [
                { label: 'Все', value: 'all' },
                { label: 'Подписчики', value: 'followers' },
                { label: 'Подписки', value: 'following' },
                { label: 'Друзья', value: 'friends' },
                { label: 'Не подписаны', value: 'not_following' },
            ],
            defaultValue: ['all'],
        },
        {
            id: 'online',
            label: 'Онлайн',
            type: 'checkbox',
            options: [
                { label: 'Только онлайн', value: 'online' },
            ],
            defaultValue: null,
        },
    ];

    return (
        <FilterSearchBar
            searchPlaceholder="Поиск пользователей..."
            filters={filters}
            onSearch={onSearch}
            onFilterChange={onFilterChange}
            isSearching={isSearching}
        />
    );
};
```

### 5. Интеграция с пагинацией

**Хук для работы с фильтрами и поиском + пагинация**:

```typescript
// features/filter-search/lib/hook/useFilterSearch.hook.ts
import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FilterConfig, FilterValue } from '@/modules/shared/ui/Filter';

interface UseFilterSearchOptions {
    filters: FilterConfig[];
    onFilterChange: (filters: Record<string, FilterValue>) => void;
    onSearch: (query: string) => void;
    queryKey: string[];
}

export const useFilterSearch = ({
    filters,
    onFilterChange,
    onSearch,
    queryKey,
}: UseFilterSearchOptions) => {
    const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>(() => {
        const initial: Record<string, FilterValue> = {};
        filters.forEach((filter) => {
            initial[filter.id] = filter.defaultValue ?? null;
        });
        return initial;
    });

    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    const handleFilterChange = useCallback((newValues: Record<string, FilterValue>) => {
        setFilterValues(newValues);

        // Инвалидируем кэш при изменении фильтров
        queryClient.invalidateQueries({ queryKey });

        // Вызываем callback
        onFilterChange(newValues);
    }, [queryKey, onFilterChange, queryClient]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);

        // Инвалидируем кэш при изменении поиска
        queryClient.invalidateQueries({ queryKey });

        // Вызываем callback
        onSearch(query);
    }, [queryKey, onSearch, queryClient]);

    return {
        filterValues,
        searchQuery,
        handleFilterChange,
        handleSearch,
    };
};
```

**Интеграция с useInfiniteQuery**:

```typescript
// Пример использования в ленте постов
const { filterValues, searchQuery, handleFilterChange, handleSearch } = useFilterSearch({
    filters: postsFilters,
    onFilterChange: (filters) => {
        // Фильтры передаются в API запрос
    },
    onSearch: (query) => {
        // Поиск передается в API запрос
    },
    queryKey: ['posts', 'feed'],
});

const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['posts', 'feed', filterValues, searchQuery],
    queryFn: ({ pageParam }) =>
        postService.getFeed({
            cursor: pageParam,
            limit: 20,
            filters: filterValues,
            search: searchQuery,
        }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
});
```

## Интеграция с существующими модулями

### Лента постов

```typescript
// app/network/feeds/page.tsx
import { PostsFilter } from '@/modules/features/filter-search';

export default function FeedsPage() {
    return (
        <div>
            <PostsFilter
                onSearch={(query) => {
                    // Поиск передается в API
                }}
                onFilterChange={(filters) => {
                    // Фильтры передаются в API
                }}
            />
            {/* Лента постов */}
        </div>
    );
}
```

### Список чатов

```typescript
// app/network/chats/list/page.tsx
import { ChatsFilter } from '@/modules/features/filter-search';

export default function ChatListPage() {
    return (
        <div>
            <ChatsFilter
                onSearch={(query) => {
                    // Поиск передается в API
                }}
                onFilterChange={(filters) => {
                    // Фильтры передаются в API
                }}
            />
            {/* Список чатов */}
        </div>
    );
}
```

### Список пользователей

```typescript
// app/network/people/page.tsx
import { UsersFilter } from '@/modules/features/filter-search';

export default function PeoplePage() {
    return (
        <div>
            <UsersFilter
                onSearch={(query) => {
                    // Поиск передается в API
                }}
                onFilterChange={(filters) => {
                    // Фильтры передаются в API
                }}
            />
            {/* Список пользователей */}
        </div>
    );
}
```

## Связанные задачи

- [Backend задача по фильтрации и поиску](../../backend/tasks/filter-search-api.md) - **обязательно** - реализация API для фильтрации и поиска
- [Модуль новости](./news-module.md) - интеграция фильтров в ленту постов
- [Страница People](./people-page.md) - интеграция фильтров в список пользователей

## Этапы реализации

### Этап 1: Базовые компоненты

- [ ] Создать компонент `Search` в `shared/ui/Search`
- [ ] Создать компонент `Filter` в `shared/ui/Filter`
- [ ] Создать компонент `FilterGroup` для разных типов фильтров
- [ ] Добавить дебаунсинг для поиска

### Этап 2: Хуки

- [ ] Создать хук `useSearch`
- [ ] Создать хук `useFilter`
- [ ] Создать комбинированный хук `useFilterSearch`

### Этап 3: Специфичные фильтры

- [ ] Создать `PostsFilter` с фильтрами для постов
- [ ] Создать `ChatsFilter` с фильтрами для чатов
- [ ] Создать `UsersFilter` с фильтрами для пользователей

### Этап 4: Интеграция

- [ ] Интегрировать фильтры в ленту постов
- [ ] Интегрировать фильтры в список чатов
- [ ] Интегрировать фильтры в список пользователей
- [ ] Интегрировать с пагинацией (сброс при изменении фильтров/поиска)

### Этап 5: Backend интеграция

- [ ] Обновить API вызовы для передачи фильтров и поиска
- [ ] Обеспечить работу поиска по всему списку (не только загруженным данным)
- [ ] Протестировать работу с пагинацией

### Этап 6: Тестирование

- [ ] Протестировать поиск с дебаунсингом
- [ ] Протестировать фильтрацию
- [ ] Протестировать комбинацию поиска и фильтров
- [ ] Протестировать интеграцию с пагинацией
