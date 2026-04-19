# Создание дизайн-системы

## Цель

Создать централизованную дизайн-систему для обеспечения единообразия UI компонентов, стилей и токенов дизайна во всем приложении. Дизайн-система должна быть выделена в отдельный пакет монорепо и обеспечивать простое переиспользование компонентов с правильной инкапсуляцией внутренних деталей.

## Проблема текущей архитектуры

**Текущее состояние**:
- UI компоненты находятся в `packages/ui/` и используются напрямую
- Внутренние части компонентов (например, `CardContent`, `CardHeader`) экспортируются и используются напрямую в приложении
- Нет централизованного управления дизайн-токенами (цвета, типографика, spacing)
- Нет единой системы тем
- Сложно поддерживать единообразие стилей

**Проблемы**:
1. Разработчики могут использовать внутренние части компонентов напрямую, что нарушает инкапсуляцию
2. Нет контроля над тем, как компоненты используются
3. Сложно обновлять компоненты без breaking changes
4. Нет единого источника правды для дизайн-токенов

## Архитектура дизайн-системы (как на реальных проектах)

### Принципы организации

1. **Многоуровневая архитектура**:
   - **Примитивы** (primitives) - базовые компоненты без бизнес-логики (Button, Input, Card)
   - **Композиты** (composites) - составные компоненты из примитивов (UserCard, MessageCard)
   - **Паттерны** (patterns) - готовые UI паттерны (FormField с иконкой, Filter компонент)

2. **Инкапсуляция**:
   - Внутренние части компонентов (CardContent, CardHeader) **не экспортируются** из публичного API
   - Компоненты предоставляют только высокоуровневый API
   - Для кастомизации используются props и slots

3. **Дизайн-токены**:
   - Все цвета, размеры, spacing, типографика вынесены в токены
   - Токены используются через CSS переменные или константы
   - Поддержка тем через переопределение токенов

4. **Структура пакетов**:
   ```
   packages/
   ├── ui/                    # Базовые примитивы (остается, но упрощается)
   │   ├── src/
   │   │   ├── components/    # Примитивные компоненты
   │   │   ├── tokens/         # Дизайн-токены
   │   │   └── utils/
   │   └── package.json
   │
   └── design-system/         # НОВЫЙ: Дизайн-система (композиты и паттерны)
       ├── src/
       │   ├── components/    # Композитные компоненты
       │   │   ├── Avatar/    # Avatar с online/offline
       │   │   ├── UserCard/
       │   │   ├── MessageCard/
       │   │   ├── FormField/ # Field с иконками
       │   │   ├── Filter/
       │   │   ├── Grid/
       │   │   ├── Pagination/
       │   │   └── ...
       │   ├── patterns/       # UI паттерны
       │   ├── tokens/         # Расширенные токены
       │   └── index.ts        # Public API (только высокоуровневые компоненты)
       ├── package.json
       └── README.md
   ```

### Как это работает на реальных проектах

**Пример: Card компонент**

**Неправильно** (текущий подход):
```tsx
// ❌ Разработчик использует внутренние части напрямую
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>Content</CardContent>
    </Card>
  );
}
```

**Правильно** (дизайн-система):
```tsx
// ✅ Дизайн-система предоставляет готовый компонент
import { UserCard } from '@workspace/design-system';

function MyComponent() {
  return (
    <UserCard
      user={user}
      showActions={true}
      variant="default"
    />
  );
}
```

**Для кастомизации**:
```tsx
// ✅ Если нужна кастомизация, используем slots
import { UserCard } from '@workspace/design-system';

function MyComponent() {
  return (
    <UserCard
      user={user}
      headerSlot={<CustomHeader />}
      footerSlot={<CustomFooter />}
    />
  );
}
```

**Или используем примитивы напрямую** (для сложных случаев):
```tsx
// ✅ Для сложных случаев используем примитивы из @workspace/ui
import { Card } from '@workspace/ui';

function MyCustomCard() {
  return (
    <Card className="custom-styles">
      {/* Кастомная реализация */}
    </Card>
  );
}
```

## Структура нового пакета `packages/design-system/`

```
packages/design-system/
├── src/
│   ├── components/           # Композитные компоненты
│   │   ├── Avatar/
│   │   │   ├── Avatar.tsx
│   │   │   ├── Avatar.stories.tsx  # Storybook (опционально)
│   │   │   └── index.ts
│   │   ├── UserCard/
│   │   ├── MessageCard/
│   │   ├── FormField/
│   │   ├── Filter/
│   │   ├── Grid/
│   │   ├── Pagination/
│   │   └── ...
│   │
│   ├── patterns/              # UI паттерны (переиспользуемые композиции)
│   │   ├── FormFieldWithIcon/
│   │   ├── SearchInput/
│   │   └── ...
│   │
│   ├── tokens/                # Дизайн-токены
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── shadows.ts
│   │   └── index.ts
│   │
│   ├── themes/                # Темы
│   │   ├── light.ts
│   │   ├── dark.ts
│   │   └── index.ts
│   │
│   ├── utils/                 # Утилиты
│   │   └── cn.ts
│   │
│   └── index.ts               # Public API (только экспорт высокоуровневых компонентов)
│
├── stories/                   # Storybook stories (опционально)
├── package.json
├── tsconfig.json
└── README.md
```

### Public API (`src/index.ts`)

**Важно**: Экспортируем только высокоуровневые компоненты, скрывая внутренние детали:

```typescript
// ✅ Экспортируем готовые компоненты
export { Avatar } from './components/Avatar';
export { UserCard } from './components/UserCard';
export { MessageCard } from './components/MessageCard';
export { FormField } from './components/FormField';
export { Filter } from './components/Filter';
export { Grid } from './components/Grid';
export { Pagination } from './components/Pagination';

// ✅ Экспортируем токены для кастомизации
export { tokens } from './tokens';
export { themes } from './themes';

// ❌ НЕ экспортируем внутренние части
// export { CardContent } from '@workspace/ui'; // НЕТ!
```

## Компоненты для включения в дизайн-систему

### 1. Avatar (с online/offline индикатором)

**Текущее расположение**: `apps/front/modules/shared/ui/Avatar/Avatar.tsx`

**Что нужно сделать**:
- Перенести в `packages/design-system/src/components/Avatar/`
- Использовать примитив `Avatar` из `@workspace/ui` внутри
- Добавить поддержку online/offline индикатора
- Скрыть внутренние детали (AvatarImage, AvatarFallback не экспортируются)

**API**:
```tsx
<Avatar
  src={string}
  name={string}
  size="sm" | "md" | "lg"
  isOnline={boolean}
  showIndicator={boolean}
/>
```

**Внутренняя реализация** (скрыта):
- Использует `Avatar`, `AvatarImage`, `AvatarFallback` из `@workspace/ui`
- Добавляет индикатор online/offline
- Обрабатывает fallback для отсутствующих изображений

---

### 2. Card компоненты

**Текущее расположение**: `packages/ui/src/components/card.tsx`

**Что нужно сделать**:
- Оставить примитив `Card` в `@workspace/ui` (базовый компонент)
- Создать композитные компоненты в дизайн-системе:
  - `UserCard` - карточка пользователя
  - `MessageCard` - карточка сообщения
  - `PostCard` - карточка поста (опционально)

**UserCard API**:
```tsx
<UserCard
  user={UserDto}
  showActions={boolean}
  variant="default" | "compact" | "detailed"
  onFollow={() => void}
  onUnfollow={() => void}
/>
```

**Внутренняя реализация** (скрыта):
- Использует `Card`, `CardHeader`, `CardContent` из `@workspace/ui`
- Внутренние части не экспортируются из дизайн-системы

---

### 3. Form компоненты

**Текущее расположение**: `packages/ui/src/components/form.tsx`

**Что нужно сделать**:
- Оставить примитивы `Form`, `FormField`, `FormItem` в `@workspace/ui`
- Создать `FormField` компонент в дизайн-системе с поддержкой:
  - Иконок в инпуте (слева/справа)
  - Валидации
  - Ошибок
  - Лейблов

**FormField API**:
```tsx
<FormField
  name={string}
  label={string}
  placeholder={string}
  iconLeft={ReactNode}
  iconRight={ReactNode}
  error={string}
  required={boolean}
/>
```

**Внутренняя реализация** (скрыта):
- Использует `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` из `@workspace/ui`
- Добавляет поддержку иконок
- Обрабатывает валидацию

---

### 4. Filter компонент

**Текущее расположение**: Не найден (нужно создать)

**Что нужно сделать**:
- Создать компонент для фильтрации данных
- Поддержка различных типов фильтров (текст, выбор, дата и т.д.)

**Filter API**:
```tsx
<Filter
  filters={FilterConfig[]}
  onFilterChange={(filters) => void}
  variant="default" | "compact"
/>
```

---

### 5. UserCard

**Текущее расположение**: `apps/front/modules/entities/user/ui/UserCard.tsx`

**Что нужно сделать**:
- Перенести в `packages/design-system/src/components/UserCard/`
- Использовать `Card` из `@workspace/ui` внутри
- Добавить варианты (default, compact, detailed)
- Скрыть внутренние детали

**API**:
```tsx
<UserCard
  user={UserDto}
  showActions={boolean}
  variant="default" | "compact" | "detailed"
  onFollow={() => void}
  onUnfollow={() => void}
/>
```

---

### 6. MessageCard / MessageItem

**Текущее расположение**: `apps/front/modules/entities/messages/ui/MessageItem/MessageItem.tsx`

**Что нужно сделать**:
- Перенести в `packages/design-system/src/components/MessageCard/`
- Добавить поддержку различных типов сообщений
- Добавить поддержку статусов (отправлено, доставлено, прочитано)

**API**:
```tsx
<MessageCard
  message={Message}
  isOwn={boolean}
  showAvatar={boolean}
  showTimestamp={boolean}
  variant="default" | "compact"
/>
```

---

### 7. Grid компоненты

**Текущее расположение**: Используется в `apps/front/modules/entities/user/ui/Users.tsx`

**Что нужно сделать**:
- Создать переиспользуемый Grid компонент
- Поддержка различных breakpoints
- Поддержка различных колонок

**Grid API**:
```tsx
<Grid
  cols={1 | 2 | 3 | 4}
  gap="sm" | "md" | "lg"
  responsive={boolean}
>
  {children}
</Grid>
```

---

### 8. Pagination

**Текущее расположение**: Не найден (нужно создать)

**Что нужно сделать**:
- Создать компонент пагинации
- Поддержка различных стилей
- Интеграция с TanStack Query

**Pagination API**:
```tsx
<Pagination
  currentPage={number}
  totalPages={number}
  onPageChange={(page) => void}
  variant="default" | "compact"
/>
```

---

### 9. Online/Offline индикатор

**Текущее расположение**: Используется в `Avatar` компоненте

**Что нужно сделать**:
- Выделить в отдельный компонент `StatusIndicator`
- Поддержка различных статусов (online, offline, away, busy)

**StatusIndicator API**:
```tsx
<StatusIndicator
  status="online" | "offline" | "away" | "busy"
  size="sm" | "md" | "lg"
  showLabel={boolean}
/>
```

---

### 10. Дополнительные компоненты

**Из `packages/ui/`** (примитивы, остаются там):
- Button
- Input
- Textarea
- Select
- Checkbox
- Radio
- Dialog
- Dropdown
- Tooltip
- Badge
- и другие базовые компоненты

**Новые компоненты для дизайн-системы**:
- Loading states (LoadingScreen, Skeleton)
- Empty states (Empty)
- Error states (Error)
- SearchInput (с иконкой поиска)
- MediaUpload (для загрузки медиа)

## Дизайн-токены

### Структура токенов

**Файл**: `packages/design-system/src/tokens/colors.ts`
```typescript
export const colors = {
  primary: {
    50: '...',
    100: '...',
    // ...
    900: '...',
  },
  // ...
} as const;
```

**Файл**: `packages/design-system/src/tokens/typography.ts`
```typescript
export const typography = {
  fontFamily: {
    sans: '...',
    mono: '...',
  },
  fontSize: {
    xs: '...',
    sm: '...',
    // ...
  },
  // ...
} as const;
```

**Файл**: `packages/design-system/src/tokens/spacing.ts`
```typescript
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  // ...
} as const;
```

**Использование в компонентах**:
```tsx
import { tokens } from '@workspace/design-system/tokens';

const styles = {
  padding: tokens.spacing.md,
  color: tokens.colors.primary[500],
  fontSize: tokens.typography.fontSize.sm,
};
```

## Темы

### Структура тем

**Файл**: `packages/design-system/src/themes/light.ts`
```typescript
export const lightTheme = {
  colors: {
    background: '#ffffff',
    foreground: '#000000',
    // ...
  },
  // ...
} as const;
```

**Файл**: `packages/design-system/src/themes/dark.ts`
```typescript
export const darkTheme = {
  colors: {
    background: '#000000',
    foreground: '#ffffff',
    // ...
  },
  // ...
} as const;
```

**Интеграция с next-themes**:
- Использовать существующий `@workspace/theme` пакет
- Расширить его токенами из дизайн-системы

## Миграция

### Этап 1: Создание структуры

1. Создать пакет `packages/design-system/`
2. Настроить `package.json` с зависимостями:
   ```json
   {
     "name": "@workspace/design-system",
     "version": "0.1.0",
     "dependencies": {
       "@workspace/ui": "workspace:*",
       "@workspace/theme": "workspace:*",
       "react": "^19.0.0",
       "react-dom": "^19.0.0"
     }
   }
   ```
3. Настроить TypeScript конфигурацию
4. Создать базовую структуру папок

### Этап 2: Миграция компонентов

1. **Avatar**:
   - Перенести из `apps/front/modules/shared/ui/Avatar/`
   - Обернуть примитив из `@workspace/ui`
   - Добавить в Public API

2. **UserCard**:
   - Перенести из `apps/front/modules/entities/user/ui/UserCard.tsx`
   - Использовать `Card` из `@workspace/ui`
   - Скрыть внутренние детали

3. **MessageCard**:
   - Перенести из `apps/front/modules/entities/messages/ui/MessageItem/`
   - Рефакторинг для переиспользования

4. **FormField**:
   - Создать новый компонент
   - Использовать `FormField` из `@workspace/ui`
   - Добавить поддержку иконок

### Этап 3: Создание новых компонентов

1. **Filter** - создать с нуля
2. **Grid** - создать с нуля
3. **Pagination** - создать с нуля
4. **StatusIndicator** - выделить из Avatar

### Этап 4: Дизайн-токены

1. Создать структуру токенов
2. Мигрировать цвета из `packages/ui/src/styles/themes/`
3. Создать токены для типографики, spacing, shadows
4. Интегрировать с темами

### Этап 5: Обновление приложения

1. Заменить импорты в `apps/front/`:
   ```tsx
   // Было
   import { Avatar } from '@/modules/shared/ui/Avatar';
   import { UserCard } from '@/modules/entities/user/ui/UserCard';

   // Стало
   import { Avatar, UserCard } from '@workspace/design-system';
   ```

2. Обновить все использования компонентов
3. Удалить старые компоненты из `apps/front/`

### Этап 6: Документация

1. Создать Storybook (опционально)
2. Написать README с примерами использования
3. Добавить JSDoc комментарии к компонентам

## Чеклист выполнения

### Подготовка

- [ ] Создать пакет `packages/design-system/`
- [ ] Настроить `package.json` с зависимостями
- [ ] Настроить TypeScript конфигурацию
- [ ] Создать базовую структуру папок
- [ ] Настроить сборку пакета

### Компоненты

- [ ] **Avatar**
  - [ ] Перенести из `apps/front/modules/shared/ui/Avatar/`
  - [ ] Обернуть примитив из `@workspace/ui`
  - [ ] Добавить поддержку online/offline
  - [ ] Добавить в Public API

- [ ] **UserCard**
  - [ ] Перенести из `apps/front/modules/entities/user/ui/UserCard.tsx`
  - [ ] Использовать `Card` из `@workspace/ui`
  - [ ] Скрыть внутренние детали
  - [ ] Добавить варианты (default, compact, detailed)
  - [ ] Добавить в Public API

- [ ] **MessageCard**
  - [ ] Перенести из `apps/front/modules/entities/messages/ui/MessageItem/`
  - [ ] Рефакторинг для переиспользования
  - [ ] Добавить поддержку статусов
  - [ ] Добавить в Public API

- [ ] **FormField**
  - [ ] Создать новый компонент
  - [ ] Использовать `FormField` из `@workspace/ui`
  - [ ] Добавить поддержку иконок (слева/справа)
  - [ ] Добавить в Public API

- [ ] **Filter**
  - [ ] Создать компонент с нуля
  - [ ] Поддержка различных типов фильтров
  - [ ] Добавить в Public API

- [ ] **Grid**
  - [ ] Создать компонент с нуля
  - [ ] Поддержка breakpoints
  - [ ] Добавить в Public API

- [ ] **Pagination**
  - [ ] Создать компонент с нуля
  - [ ] Интеграция с TanStack Query
  - [ ] Добавить в Public API

- [ ] **StatusIndicator**
  - [ ] Выделить из Avatar
  - [ ] Поддержка различных статусов
  - [ ] Добавить в Public API

### Дизайн-токены

- [ ] Создать структуру токенов
- [ ] Мигрировать цвета
- [ ] Создать токены типографики
- [ ] Создать токены spacing
- [ ] Создать токены shadows
- [ ] Интегрировать с темами

### Миграция приложения

- [ ] Обновить импорты в `apps/front/`
- [ ] Заменить все использования компонентов
- [ ] Удалить старые компоненты
- [ ] Протестировать все страницы

### Документация

- [ ] Написать README
- [ ] Добавить примеры использования
- [ ] Добавить JSDoc комментарии
- [ ] Настроить Storybook (опционально)

## Примеры использования

### Avatar

```tsx
import { Avatar } from '@workspace/design-system';

function UserProfile() {
  return (
    <Avatar
      src="/avatar.jpg"
      name="John Doe"
      size="lg"
      isOnline={true}
      showIndicator={true}
    />
  );
}
```

### UserCard

```tsx
import { UserCard } from '@workspace/design-system';

function UsersList() {
  return (
    <div>
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          showActions={true}
          variant="default"
          onFollow={() => handleFollow(user.id)}
          onUnfollow={() => handleUnfollow(user.id)}
        />
      ))}
    </div>
  );
}
```

### FormField

```tsx
import { FormField } from '@workspace/design-system';
import { Search, User } from 'lucide-react';

function SearchForm() {
  return (
    <FormField
      name="search"
      label="Поиск"
      placeholder="Введите запрос"
      iconLeft={<Search />}
      required={true}
    />
  );
}
```

### Grid

```tsx
import { Grid } from '@workspace/design-system';

function UsersGrid() {
  return (
    <Grid cols={4} gap="md" responsive={true}>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </Grid>
  );
}
```

## Преимущества

1. **Единообразие**: Все компоненты используют единые токены и стили
2. **Переиспользование**: Компоненты можно использовать в других проектах
3. **Инкапсуляция**: Внутренние детали скрыты, API простой и понятный
4. **Поддержка**: Легче обновлять и поддерживать компоненты
5. **Документация**: Централизованная документация всех компонентов
6. **Тестирование**: Легче тестировать изолированные компоненты

## Связанные файлы

### Текущие компоненты для миграции

- `apps/front/modules/shared/ui/Avatar/Avatar.tsx`
- `apps/front/modules/entities/user/ui/UserCard.tsx`
- `apps/front/modules/entities/messages/ui/MessageItem/MessageItem.tsx`
- `apps/front/modules/entities/chats/ui/ChatCard/ChatCard.tsx`
- `apps/front/modules/entities/post/ui/Post/Post.tsx`

### Примитивы (остаются в `@workspace/ui`)

- `packages/ui/src/components/card.tsx`
- `packages/ui/src/components/form.tsx`
- `packages/ui/src/components/avatar.tsx`
- `packages/ui/src/components/button.tsx`
- `packages/ui/src/components/input.tsx`
- И другие базовые компоненты

### Токены и темы

- `packages/ui/src/styles/themes/` - текущие темы
- `packages/theme/` - пакет тем (интегрировать)

## Примечания

- Дизайн-система **не заменяет** `@workspace/ui`, а **расширяет** его
- Примитивы остаются в `@workspace/ui` для прямого использования в сложных случаях
- Дизайн-система предоставляет готовые композитные компоненты для типичных случаев
- Все компоненты должны быть полностью типизированы с TypeScript
- Компоненты должны поддерживать темную тему через токены
