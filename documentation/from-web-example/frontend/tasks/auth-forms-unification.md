# Унификация форм логина и регистрации

## Назначение

Сделать формы логина и регистрации одинаковыми по дизайну. Единственное отличие - форма регистрации не использует фамилию (только имя).

## Текущее состояние

### LoginForm
**Расположение**: `modules/processes/auth/ui/LoginForm/LoginForm.tsx`

**Поля**:
- Email
- Пароль

**Особенности**:
- Кнопка показа/скрытия пароля
- Обработка ошибок
- Loading state

### RegistrationForm
**Расположение**: `modules/processes/auth/ui/RegistredForm/RegistredForm.tsx`

**Поля**:
- Имя
- Email
- Пароль
- Подтверждение пароля

**Особенности**:
- Кнопка показа/скрытия пароля
- Обработка ошибок
- Loading state
- Ссылка на форму логина

## Требования

### Единый дизайн

1. **Визуальное единообразие**:
   - Одинаковые отступы и spacing
   - Одинаковые размеры полей
   - Одинаковые стили кнопок
   - Одинаковые стили ошибок
   - Одинаковые иконки и их расположение

2. **Структура форм**:
   - Одинаковый порядок полей (где применимо)
   - Одинаковое расположение элементов
   - Одинаковые placeholder'ы (где применимо)

3. **Интерактивность**:
   - Одинаковые анимации
   - Одинаковые состояния (hover, focus, disabled)
   - Одинаковые переходы

### Отличия

- **Форма регистрации** содержит дополнительные поля:
  - Имя (без фамилии)
  - Подтверждение пароля
- **Форма логина** содержит только:
  - Email
  - Пароль

## Архитектура FSD

### Feature: `modules/features/auth-forms/`

**Структура**:
```
features/auth-forms/
├── index.ts
├── ui/
│   ├── AuthFormLayout.tsx              # Общий layout для форм
│   ├── AuthFormField.tsx               # Переиспользуемое поле формы
│   ├── AuthPasswordField.tsx           # Поле пароля с кнопкой показа/скрытия
│   └── AuthFormError.tsx                # Компонент ошибки
├── lib/
│   ├── hook/
│   │   └── useAuthForm.hook.ts         # Общий хук для форм
│   └── utils/
│       ├── form-validation.utils.ts    # Валидация форм
│       └── form-styles.utils.ts        # Общие стили
└── constants/
    └── auth-form.constants.ts          # Константы (placeholder'ы, labels)
```

### Обновление существующих форм

**LoginForm**:
- Использовать общие компоненты из `features/auth-forms`
- Применить единый дизайн

**RegistrationForm**:
- Использовать общие компоненты из `features/auth-forms`
- Применить единый дизайн
- Убедиться, что используется только имя (без фамилии)

## Детальная реализация

### 1. AuthFormLayout

Общий layout для обеих форм:
- Единая структура контейнера
- Единые отступы
- Единое расположение элементов

```typescript
interface AuthFormLayoutProps {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode; // Ссылка на другую форму
}
```

### 2. AuthFormField

Переиспользуемое поле формы:
- Единый стиль для всех полей
- Единая обработка ошибок
- Единые состояния

```typescript
interface AuthFormFieldProps {
    label: string;
    id: string;
    type: string;
    placeholder: string;
    error?: string;
    required?: boolean;
    autoComplete?: string;
    // ... другие props
}
```

### 3. AuthPasswordField

Специальное поле для пароля:
- Кнопка показа/скрытия пароля
- Единый стиль
- Единое поведение

```typescript
interface AuthPasswordFieldProps {
    label: string;
    id: string;
    placeholder: string;
    error?: string;
    required?: boolean;
    autoComplete?: string;
    // ... другие props
}
```

### 4. Единые константы

```typescript
export const AUTH_FORM_CONSTANTS = {
    placeholders: {
        email: 'your@email.com',
        password: 'Введите пароль',
        confirmPassword: 'Подтвердите пароль',
        name: 'Имя'
    },
    labels: {
        email: 'Email',
        password: 'Пароль',
        confirmPassword: 'Подтвердите пароль',
        name: 'Имя'
    },
    buttons: {
        login: 'Войти',
        register: 'Зарегистрироваться',
        loading: {
            login: 'Вход...',
            register: 'Регистрация...'
        }
    }
};
```

### 5. Обновление LoginForm

```typescript
import { AuthFormLayout, AuthFormField, AuthPasswordField } from '@/modules/features/auth-forms';

export const LoginForm = () => {
    // ... существующая логика

    return (
        <AuthFormLayout
            title="Вход"
            footer={
                <div className="text-right mt-4 flex items-center justify-start">
                    <p className="text-sm text-gray-500">Нет аккаунта? </p>
                    <Link href="/auth/register" className="text-sm text-blue-500 hover:text-blue-700 ml-2">
                        Зарегистрироваться
                    </Link>
                </div>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <AuthFormField
                    label={AUTH_FORM_CONSTANTS.labels.email}
                    id="login-email"
                    type="email"
                    placeholder={AUTH_FORM_CONSTANTS.placeholders.email}
                    error={errors.email?.message}
                    autoComplete="email"
                    {...register("email")}
                    required
                />

                <AuthPasswordField
                    label={AUTH_FORM_CONSTANTS.labels.password}
                    id="login-password"
                    placeholder={AUTH_FORM_CONSTANTS.placeholders.password}
                    error={errors.password?.message}
                    autoComplete="current-password"
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    {...register("password")}
                    required
                />

                {/* Ошибки */}
                {error && <AuthFormError message={error} />}

                {/* Кнопка */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            {AUTH_FORM_CONSTANTS.buttons.loading.login}
                        </>
                    ) : (
                        <>
                            <LogIn className="w-4 h-4 mr-2" />
                            {AUTH_FORM_CONSTANTS.buttons.login}
                        </>
                    )}
                </Button>
            </form>
        </AuthFormLayout>
    );
};
```

### 6. Обновление RegistrationForm

```typescript
import { AuthFormLayout, AuthFormField, AuthPasswordField } from '@/modules/features/auth-forms';

export const RegistrationForm = () => {
    // ... существующая логика

    return (
        <AuthFormLayout
            title="Регистрация"
            footer={
                <div className="text-right mt-4 flex items-center justify-start">
                    <p className="text-sm text-gray-500">Уже есть аккаунт? </p>
                    <Link href="/auth/login" className="text-sm text-blue-500 hover:text-blue-700 ml-2">
                        Войти
                    </Link>
                </div>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <AuthFormField
                    label={AUTH_FORM_CONSTANTS.labels.name}
                    id="register-name"
                    type="text"
                    placeholder={AUTH_FORM_CONSTANTS.placeholders.name}
                    error={errors.name?.message}
                    autoComplete="name"
                    {...register("name")}
                    required
                />

                <AuthFormField
                    label={AUTH_FORM_CONSTANTS.labels.email}
                    id="register-email"
                    type="email"
                    placeholder={AUTH_FORM_CONSTANTS.placeholders.email}
                    error={errors.email?.message}
                    autoComplete="email"
                    {...register("email")}
                    required
                />

                <AuthPasswordField
                    label={AUTH_FORM_CONSTANTS.labels.password}
                    id="register-password"
                    placeholder={AUTH_FORM_CONSTANTS.placeholders.password}
                    error={errors.password?.message}
                    autoComplete="new-password"
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    {...register("password")}
                    required
                />

                <AuthPasswordField
                    label={AUTH_FORM_CONSTANTS.labels.confirmPassword}
                    id="register-confirm"
                    placeholder={AUTH_FORM_CONSTANTS.placeholders.confirmPassword}
                    error={errors.confirmPassword?.message}
                    autoComplete="new-password"
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    {...register("confirmPassword")}
                    required
                />

                {/* Ошибки */}
                {error && <AuthFormError message={error} />}

                {/* Кнопка */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            {AUTH_FORM_CONSTANTS.buttons.loading.register}
                        </>
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            {AUTH_FORM_CONSTANTS.buttons.register}
                        </>
                    )}
                </Button>
            </form>
        </AuthFormLayout>
    );
};
```

## Единый дизайн

### Стили

**Отступы**:
- `space-y-4` для формы
- `space-y-2` для полей

**Размеры**:
- Одинаковая ширина полей (`w-full`)
- Одинаковая высота полей
- Одинаковые размеры кнопок

**Цвета**:
- Единая цветовая схема для всех элементов
- Единые цвета ошибок
- Единые цвета состояний (hover, focus)

**Типографика**:
- Единые размеры шрифтов
- Единые веса шрифтов
- Единые цвета текста

### Валидация

**Единые правила валидации**:
- Email: стандартная валидация email
- Пароль: минимальная длина, требования к сложности
- Подтверждение пароля: совпадение с паролем
- Имя: минимальная длина, только буквы (опционально)

**Единые сообщения об ошибках**:
- Одинаковый формат сообщений
- Одинаковые стили ошибок
- Одинаковое расположение ошибок

## Задачи

### Этап 1: Создание общих компонентов

- [ ] Создать feature `auth-forms`
- [ ] Создать `AuthFormLayout` компонент
- [ ] Создать `AuthFormField` компонент
- [ ] Создать `AuthPasswordField` компонент
- [ ] Создать `AuthFormError` компонент
- [ ] Создать константы для форм

### Этап 2: Обновление LoginForm

- [ ] Использовать общие компоненты
- [ ] Применить единый дизайн
- [ ] Убедиться в единообразии стилей
- [ ] Добавить ссылку на регистрацию в footer

### Этап 3: Обновление RegistrationForm

- [ ] Использовать общие компоненты
- [ ] Применить единый дизайн
- [ ] Убедиться, что используется только имя (без фамилии)
- [ ] Убедиться в единообразии стилей
- [ ] Добавить ссылку на логин в footer

### Этап 4: Валидация и тестирование

- [ ] Проверить валидацию обеих форм
- [ ] Проверить единообразие дизайна
- [ ] Протестировать на разных устройствах
- [ ] Проверить accessibility

## Файлы для работы

### Создать

- `modules/features/auth-forms/` - новый feature
- `modules/features/auth-forms/ui/AuthFormLayout.tsx`
- `modules/features/auth-forms/ui/AuthFormField.tsx`
- `modules/features/auth-forms/ui/AuthPasswordField.tsx`
- `modules/features/auth-forms/ui/AuthFormError.tsx`
- `modules/features/auth-forms/lib/hook/useAuthForm.hook.ts`
- `modules/features/auth-forms/constants/auth-form.constants.ts`

### Обновить

- `modules/processes/auth/ui/LoginForm/LoginForm.tsx`
- `modules/processes/auth/ui/RegistredForm/RegistredForm.tsx`

## Проверка дизайна

### Критерии единообразия

1. **Визуальное сравнение**:
   - Формы должны выглядеть идентично (кроме количества полей)
   - Отступы должны совпадать
   - Размеры элементов должны совпадать

2. **Интерактивность**:
   - Поведение при фокусе должно быть одинаковым
   - Анимации должны быть одинаковыми
   - Состояния должны быть одинаковыми

3. **Типографика**:
   - Размеры шрифтов должны совпадать
   - Цвета текста должны совпадать
   - Веса шрифтов должны совпадать

## Примечания

- **Важно**: Форма регистрации использует только **имя** (без фамилии)
- Backend уже поддерживает только `name` в `CreateUserDto`, поэтому изменений на backend не требуется
- Использовать существующие компоненты из `@workspace/ui` (Input, Label, Button, Alert)
- Следовать принципам FSD архитектуры
