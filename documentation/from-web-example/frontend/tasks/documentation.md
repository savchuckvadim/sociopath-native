# Документация

## Назначение

Улучшить документацию кода: добавить JSDoc комментарии, создать Storybook и обновить README.

## Задачи

- [ ] Добавить JSDoc комментарии к функциям
- [ ] Создать Storybook для UI компонентов
- [ ] Обновить README с примерами использования

## JSDoc комментарии

### Что документировать
- Публичные функции и методы
- Компоненты и их props
- Хуки и их возвращаемые значения
- Сложная бизнес-логика

### Формат
```typescript
/**
 * Создает новый пост
 * @param postData - Данные поста для создания
 * @returns Promise с созданным постом
 * @throws {Error} Если пользователь не авторизован
 */
async function createPost(postData: CreatePostDto): Promise<PostDto> {
    // ...
}
```

### Компоненты
```typescript
/**
 * Компонент поста
 * @param post - Данные поста
 * @param onLike - Колбэк при лайке
 */
export const Post: FC<PostProps> = ({ post, onLike }) => {
    // ...
}
```

### Приоритет
- Начать с публичных API
- Затем критичные компоненты
- Затем хуки и утилиты

## Storybook

### Назначение
- Документация UI компонентов
- Визуальное тестирование компонентов
- Демонстрация различных состояний

### Настройка
- Установить Storybook для Next.js
- Настроить конфигурацию
- Создать stories для компонентов

### Компоненты для Storybook
- Компоненты из `@workspace/ui`
- Компоненты из дизайн-системы (после создания)
- Переиспользуемые компоненты из `modules/shared/ui/`

### Структура
```
stories/
├── components/
│   ├── Button.stories.tsx
│   ├── Input.stories.tsx
│   └── Card.stories.tsx
└── design-system/
    ├── Avatar.stories.tsx
    └── UserCard.stories.tsx
```

## README

### Что добавить
- Описание проекта
- Установка и запуск
- Структура проекта
- Примеры использования компонентов
- Ссылки на документацию

### Структура README
```markdown
# Project Name

## Описание
...

## Установка
...

## Запуск
...

## Структура проекта
...

## Примеры использования
...

## Документация
- [Архитектура](./documentation/frontend/docs/architecture.md)
- [Features](./documentation/frontend/docs/features.md)
- ...
```

### Файлы для работы
- `README.md` в корне проекта
- `apps/front/README.md` - документация frontend приложения
- `packages/*/README.md` - документация пакетов
