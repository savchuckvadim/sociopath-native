# Редактирование профиля

## Назначение

Создать функционал редактирования профиля с модальным окном. При нажатии на "Edit profile" появляется большое окно поверх профиля, где можно изменить about me, hero и avatar.

## Требования

### UI/UX

1. **Кнопка "Edit profile"**:
   - Расположение: на странице профиля
   - При клике открывает модальное окно

2. **Модальное окно редактирования**:
   - Большое окно поверх профиля
   - Можно изменить:
     - About me (текстовое поле, до 1000 символов)
     - Hero изображение (загрузка нового)
     - Avatar (загрузка нового)
   - Чекбокс "Уведомлять подписчиков об изменениях"
   - Кнопки "Сохранить" и "Отмена"

3. **Загрузка изображений**:
   - Предпросмотр перед загрузкой
   - Кроп изображений (опционально)
   - Индикатор загрузки

## Архитектура FSD

### Feature: `modules/features/profile-edit/`

**Структура**:
```
features/profile-edit/
├── index.ts
├── ui/
│   ├── EditProfileModal/
│   │   ├── EditProfileModal.tsx          # Модальное окно
│   │   ├── EditProfileForm.tsx           # Форма редактирования
│   │   ├── AvatarUpload.tsx              # Загрузка аватара
│   │   ├── HeroUpload.tsx                # Загрузка hero
│   │   └── AboutMeField.tsx              # Поле "About me"
│   └── EditProfileButton/
│       └── EditProfileButton.tsx         # Кнопка "Edit profile"
├── lib/
│   ├── hook/
│   │   ├── useEditProfile.hook.ts       # Хук для редактирования
│   │   └── useProfileImageUpload.hook.ts # Хук для загрузки изображений
│   └── utils/
│       └── image-validation.utils.ts    # Валидация изображений
└── model/
    └── EditProfileSlice.ts               # Redux slice (если нужен)
```

## Детальная реализация

### 1. EditProfileModal

**Компонент модального окна**:
- Использовать существующий компонент модального окна из UI библиотеки
- Или создать собственный с использованием Dialog/Modal

```typescript
interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: ProfileDto;
    onSave: (data: UpdateProfileDto) => Promise<void>;
}
```

**Структура модального окна**:
- Заголовок "Редактировать профиль"
- Форма с полями
- Чекбокс "Уведомлять подписчиков"
- Кнопки действий

### 2. EditProfileForm

**Поля формы**:
- About me (textarea, max 1000 символов)
- Avatar (file input с предпросмотром)
- Hero (file input с предпросмотром)
- Checkbox "notifyFollowers" (уведомлять подписчиков)

**Валидация**:
- About me: максимум 1000 символов
- Изображения: только jpg, png, webp, максимум 5MB
- Размеры: avatar (минимум 200x200), hero (минимум 1200x400)

### 3. AvatarUpload

**Компонент загрузки аватара**:
- Кнопка "Загрузить аватар"
- Предпросмотр текущего аватара
- Предпросмотр нового аватара перед загрузкой
- Индикатор загрузки
- Кнопка "Удалить" (опционально)

**Реализация**:
```typescript
const AvatarUpload = ({
    currentAvatar,
    onUpload,
    isLoading
}: AvatarUploadProps) => {
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Валидация
            if (!validateImage(file)) return;

            // Предпросмотр
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Загрузка
            onUpload(file);
        }
    };

    return (
        <div className="space-y-2">
            <Label>Аватар</Label>
            <div className="flex items-center gap-4">
                {preview || currentAvatar ? (
                    <img
                        src={preview || currentAvatar}
                        alt="Avatar preview"
                        className="w-24 h-24 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                    </div>
                )}
                <div>
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isLoading}
                    />
                    {isLoading && <LoadingSpinner />}
                </div>
            </div>
        </div>
    );
};
```

### 4. HeroUpload

**Компонент загрузки hero**:
- Аналогично AvatarUpload
- Предпросмотр hero изображения
- Рекомендуемые размеры: 1200x400px

### 5. AboutMeField

**Поле "About me"**:
- Textarea с ограничением 1000 символов
- Счетчик символов
- Валидация

```typescript
const AboutMeField = ({
    value,
    onChange,
    error
}: AboutMeFieldProps) => {
    const maxLength = 1000;
    const remaining = maxLength - (value?.length || 0);

    return (
        <div className="space-y-2">
            <Label htmlFor="about">О себе</Label>
            <Textarea
                id="about"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                maxLength={maxLength}
                rows={5}
                placeholder="Расскажите о себе..."
            />
            <div className="flex justify-between text-sm text-gray-500">
                <span>{error}</span>
                <span>{remaining} символов осталось</span>
            </div>
        </div>
    );
};
```

### 6. useEditProfile Hook

**Хук для редактирования профиля**:
```typescript
export const useEditProfile = () => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const api = getProfile();

    const updateProfileMutation = useMutation({
        mutationFn: async (data: UpdateProfileDto & { notifyFollowers?: boolean }) => {
            const { notifyFollowers, ...updateData } = data;

            // Обновляем профиль
            const profile = await api.profilePatchMe(updateData);

            // Если нужно уведомить подписчиков, создаем пост
            if (notifyFollowers) {
                await createProfileUpdatePost(updateData);
            }

            return profile;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
    });

    return {
        updateProfile: updateProfileMutation.mutate,
        isLoading: updateProfileMutation.isPending,
        error: updateProfileMutation.error
    };
};
```

### 7. Интеграция с существующим профилем

**Использование**:
- На странице профиля добавить кнопку "Edit profile"
- При клике открывать модальное окно
- После сохранения обновлять данные профиля

## Задачи

### Этап 1: Базовая структура

- [ ] Создать feature `profile-edit`
- [ ] Создать компонент `EditProfileModal`
- [ ] Создать компонент `EditProfileButton`
- [ ] Интегрировать кнопку на страницу профиля

### Этап 2: Форма редактирования

- [ ] Создать компонент `EditProfileForm`
- [ ] Реализовать поле "About me"
- [ ] Реализовать загрузку аватара
- [ ] Реализовать загрузку hero
- [ ] Добавить валидацию

### Этап 3: Загрузка изображений

- [ ] Реализовать предпросмотр изображений
- [ ] Интегрировать с backend API для загрузки
- [ ] Добавить индикаторы загрузки
- [ ] Обработка ошибок загрузки

### Этап 4: Чекбокс уведомлений

- [ ] Добавить чекбокс "Уведомлять подписчиков"
- [ ] Интегрировать с backend (создание поста при изменении)
- [ ] Обработка состояния чекбокса

### Этап 5: Тестирование

- [ ] Протестировать редактирование профиля
- [ ] Протестировать загрузку изображений
- [ ] Протестировать создание поста при уведомлении

## Файлы для работы

### Создать

- `modules/features/profile-edit/` - новый feature
- `modules/features/profile-edit/ui/EditProfileModal/EditProfileModal.tsx`
- `modules/features/profile-edit/ui/EditProfileModal/EditProfileForm.tsx`
- `modules/features/profile-edit/ui/EditProfileModal/AvatarUpload.tsx`
- `modules/features/profile-edit/ui/EditProfileModal/HeroUpload.tsx`
- `modules/features/profile-edit/ui/EditProfileButton/EditProfileButton.tsx`
- `modules/features/profile-edit/lib/hook/useEditProfile.hook.ts`

### Обновить

- Страница профиля (добавить кнопку "Edit profile")

## Связанные задачи

- [Backend задача по истории аватаров](../../backend/tasks/profile-avatar-history.md)
- [Backend задача по уведомлениям подписчиков](../../backend/tasks/profile-update-notifications.md)
