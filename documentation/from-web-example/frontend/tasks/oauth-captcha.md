# OAuth авторизация и CAPTCHA

## Назначение

Добавить возможность регистрации и входа через OAuth провайдеры (Yandex, Google, Telegram) и интегрировать CAPTCHA для защиты от ботов.

## Требования

### Функционал

1. **OAuth авторизация**:
   - Вход через Yandex
   - Вход через Google
   - Вход через Telegram
   - Регистрация через OAuth (если пользователь не существует)
   - Связывание OAuth аккаунтов с существующим аккаунтом

2. **CAPTCHA**:
   - Интеграция CAPTCHA в формы логина и регистрации
   - Валидация CAPTCHA перед отправкой формы
   - Поддержка различных провайдеров CAPTCHA (Google reCAPTCHA, hCaptcha, Turnstile)

## Архитектура FSD

### Shared: `modules/shared/ui/Captcha/`

**Структура**:
```
shared/ui/
└── Captcha/
    ├── index.ts
    ├── Captcha.tsx                    # Универсальный компонент CAPTCHA
    └── CaptchaProvider.tsx            # Провайдер для CAPTCHA
```

### Feature: `modules/features/oauth/`

**Структура**:
```
features/oauth/
├── index.ts
├── ui/
│   ├── OAuthButtons/
│   │   └── OAuthButtons.tsx           # Кнопки OAuth провайдеров
│   ├── OAuthButton/
│   │   └── OAuthButton.tsx            # Отдельная кнопка OAuth
│   └── OAuthCallback/
│       └── OAuthCallback.tsx           # Страница обработки OAuth callback
└── lib/
    ├── hook/
    │   ├── useOAuth.hook.ts           # Хук для OAuth авторизации
    │   └── useOAuthCallback.hook.ts   # Хук для обработки callback
    └── utils/
        └── oauth.utils.ts              # Утилиты для OAuth
```

### Process: `modules/processes/auth/`

**Обновление существующего модуля**:
```
processes/auth/
├── ui/
│   ├── LoginForm/
│   │   └── LoginForm.tsx              # Добавить OAuth кнопки и CAPTCHA
│   └── RegistredForm/
│       └── RegistredForm.tsx          # Добавить OAuth кнопки и CAPTCHA
└── lib/
    └── api/
        └── AuthService.ts             # Добавить методы OAuth
```

## Детальная реализация

### 1. Компонент CAPTCHA

**Универсальный компонент**:

```typescript
// shared/ui/Captcha/Captcha.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';

export type CaptchaProvider = 'recaptcha' | 'hcaptcha' | 'turnstile';

interface CaptchaProps {
    provider?: CaptchaProvider;
    siteKey: string;
    onVerify: (token: string) => void;
    onError?: (error: string) => void;
    onExpire?: () => void;
    theme?: 'light' | 'dark';
    size?: 'normal' | 'compact';
    className?: string;
}

export const Captcha = ({
    provider = 'recaptcha',
    siteKey,
    onVerify,
    onError,
    onExpire,
    theme = 'light',
    size = 'normal',
    className,
}: CaptchaProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const widgetIdRef = useRef<string | number | null>(null);

    useEffect(() => {
        // Загружаем скрипт CAPTCHA
        const loadScript = () => {
            if (isLoaded) return;

            let scriptUrl: string;
            let scriptId: string;

            switch (provider) {
                case 'recaptcha':
                    scriptUrl = `https://www.google.com/recaptcha/api.js?render=explicit`;
                    scriptId = 'recaptcha-script';
                    break;
                case 'hcaptcha':
                    scriptUrl = `https://js.hcaptcha.com/1/api.js?render=explicit`;
                    scriptId = 'hcaptcha-script';
                    break;
                case 'turnstile':
                    scriptUrl = `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`;
                    scriptId = 'turnstile-script';
                    break;
            }

            // Проверяем, не загружен ли уже скрипт
            if (document.getElementById(scriptId)) {
                setIsLoaded(true);
                renderCaptcha();
                return;
            }

            const script = document.createElement('script');
            script.id = scriptId;
            script.src = scriptUrl;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                setIsLoaded(true);
                renderCaptcha();
            };
            script.onerror = () => {
                onError?.('Failed to load CAPTCHA script');
            };
            document.head.appendChild(script);
        };

        const renderCaptcha = () => {
            if (!containerRef.current || !isLoaded) return;

            switch (provider) {
                case 'recaptcha':
                    if (window.grecaptcha) {
                        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
                            sitekey: siteKey,
                            theme,
                            size,
                            callback: (token: string) => {
                                onVerify(token);
                            },
                            'error-callback': () => {
                                onError?.('CAPTCHA verification failed');
                            },
                            'expired-callback': () => {
                                onExpire?.();
                            },
                        });
                    }
                    break;

                case 'hcaptcha':
                    if (window.hcaptcha) {
                        widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
                            sitekey: siteKey,
                            theme,
                            size,
                            callback: (token: string) => {
                                onVerify(token);
                            },
                            'error-callback': () => {
                                onError?.('CAPTCHA verification failed');
                            },
                            'expired-callback': () => {
                                onExpire?.();
                            },
                        });
                    }
                    break;

                case 'turnstile':
                    if (window.turnstile) {
                        widgetIdRef.current = window.turnstile.render(containerRef.current, {
                            sitekey: siteKey,
                            theme,
                            size,
                            callback: (token: string) => {
                                onVerify(token);
                            },
                            'error-callback': () => {
                                onError?.('CAPTCHA verification failed');
                            },
                            'expired-callback': () => {
                                onExpire?.();
                            },
                        });
                    }
                    break;
            }
        };

        loadScript();

        return () => {
            // Очистка при размонтировании
            if (widgetIdRef.current !== null) {
                switch (provider) {
                    case 'recaptcha':
                        if (window.grecaptcha) {
                            window.grecaptcha.reset(widgetIdRef.current);
                        }
                        break;
                    case 'hcaptcha':
                        if (window.hcaptcha) {
                            window.hcaptcha.reset(widgetIdRef.current);
                        }
                        break;
                    case 'turnstile':
                        if (window.turnstile) {
                            window.turnstile.reset(widgetIdRef.current);
                        }
                        break;
                }
            }
        };
    }, [provider, siteKey, theme, size, isLoaded, onVerify, onError, onExpire]);

    return (
        <div
            ref={containerRef}
            className={cn('captcha-container', className)}
        />
    );
};

// Типы для window
declare global {
    interface Window {
        grecaptcha?: {
            render: (container: HTMLElement, options: any) => string;
            reset: (widgetId: string) => void;
            getResponse: (widgetId: string) => string;
        };
        hcaptcha?: {
            render: (container: HTMLElement, options: any) => string;
            reset: (widgetId: string) => void;
            getResponse: (widgetId: string) => string;
        };
        turnstile?: {
            render: (container: HTMLElement, options: any) => string;
            reset: (widgetId: string) => void;
            getResponse: (widgetId: string) => string;
        };
    }
}
```

### 2. Компонент OAuth кнопок

**Кнопки OAuth провайдеров**:

```typescript
// features/oauth/ui/OAuthButtons/OAuthButtons.tsx
'use client';

import { OAuthButton } from '../OAuthButton';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';

interface OAuthButtonsProps {
    onOAuthClick: (provider: 'yandex' | 'google' | 'telegram') => void;
    isLoading?: boolean;
    className?: string;
}

export const OAuthButtons = ({ onOAuthClick, isLoading, className }: OAuthButtonsProps) => {
    return (
        <div className={className}>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Или войти через
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
                <OAuthButton
                    provider="yandex"
                    onClick={() => onOAuthClick('yandex')}
                    disabled={isLoading}
                />
                <OAuthButton
                    provider="google"
                    onClick={() => onOAuthClick('google')}
                    disabled={isLoading}
                />
                <OAuthButton
                    provider="telegram"
                    onClick={() => onOAuthClick('telegram')}
                    disabled={isLoading}
                />
            </div>
        </div>
    );
};
```

**Отдельная кнопка OAuth**:

```typescript
// features/oauth/ui/OAuthButton/OAuthButton.tsx
'use client';

import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

interface OAuthButtonProps {
    provider: 'yandex' | 'google' | 'telegram';
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

const providerConfig = {
    yandex: {
        label: 'Yandex',
        icon: '🔴', // Можно использовать иконки из lucide-react или SVG
        color: 'bg-[#FC3F1D] hover:bg-[#E02E1A]',
    },
    google: {
        label: 'Google',
        icon: '🔵',
        color: 'bg-white hover:bg-gray-50 text-gray-700 border',
    },
    telegram: {
        label: 'Telegram',
        icon: '✈️',
        color: 'bg-[#0088cc] hover:bg-[#0077b3]',
    },
};

export const OAuthButton = ({ provider, onClick, disabled, className }: OAuthButtonProps) => {
    const config = providerConfig[provider];

    return (
        <Button
            type="button"
            variant="outline"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex flex-col items-center justify-center h-16 gap-1',
                config.color,
                className
            )}
        >
            <span className="text-xl">{config.icon}</span>
            <span className="text-xs">{config.label}</span>
        </Button>
    );
};
```

### 3. Хук для OAuth

```typescript
// features/oauth/lib/hook/useOAuth.hook.ts
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from '@workspace/nest-api';

export const useOAuth = () => {
    const router = useRouter();
    const api = getAuth();

    const initiateOAuth = useCallback(async (provider: 'yandex' | 'google' | 'telegram') => {
        try {
            // Получаем URL для редиректа на OAuth провайдера
            const response = await api.authOAuthInitiate({ provider });

            // Редиректим на OAuth провайдера
            window.location.href = response.redirectUrl;
        } catch (error) {
            console.error(`Failed to initiate ${provider} OAuth:`, error);
            throw error;
        }
    }, [api]);

    return {
        initiateOAuth,
    };
};
```

### 4. Страница OAuth callback

```typescript
// app/auth/oauth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOAuthCallback } from '@/modules/features/oauth';
import { LoadingScreen } from '@/modules/shared';

export default function OAuthCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { handleCallback } = useOAuthCallback();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const provider = searchParams.get('provider') as 'yandex' | 'google' | 'telegram';
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError(errorParam);
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
            return;
        }

        if (!code || !state || !provider) {
            setError('Invalid OAuth callback parameters');
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
            return;
        }

        handleCallback({ code, state, provider })
            .then(() => {
                router.push('/network/me');
            })
            .catch((err) => {
                setError(err.message || 'OAuth authentication failed');
                setTimeout(() => {
                    router.push('/auth/login');
                }, 3000);
            });
    }, [searchParams, router, handleCallback]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Ошибка авторизации</h2>
                    <p className="text-gray-600">{error}</p>
                    <p className="text-sm text-gray-500 mt-4">Перенаправление на страницу входа...</p>
                </div>
            </div>
        );
    }

    return <LoadingScreen />;
}
```

**Хук для обработки callback**:

```typescript
// features/oauth/lib/hook/useOAuthCallback.hook.ts
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from '@workspace/nest-api';
import { useAuth } from '@/modules/processes';

export const useOAuthCallback = () => {
    const router = useRouter();
    const api = getAuth();
    const { checkAuth } = useAuth();

    const handleCallback = useCallback(async (params: {
        code: string;
        state: string;
        provider: 'yandex' | 'google' | 'telegram';
    }) => {
        try {
            // Отправляем код на backend для обмена на токены
            const response = await api.authOAuthCallback({
                code: params.code,
                state: params.state,
                provider: params.provider,
            });

            // Проверяем авторизацию
            await checkAuth();

            return response;
        } catch (error) {
            console.error('OAuth callback error:', error);
            throw error;
        }
    }, [api, checkAuth]);

    return {
        handleCallback,
    };
};
```

### 5. Интеграция в формы логина и регистрации

**Обновление LoginForm**:

```typescript
// processes/auth/ui/LoginForm/LoginForm.tsx (обновление)
'use client';

import { Captcha } from '@/modules/shared/ui/Captcha';
import { OAuthButtons } from '@/modules/features/oauth';
import { useOAuth } from '@/modules/features/oauth';
import { useState } from 'react';

export const LoginForm = () => {
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const { initiateOAuth } = useOAuth();
    const { login, isLoading, error } = useAuth();

    // ... существующий код формы

    const handleOAuthClick = async (provider: 'yandex' | 'google' | 'telegram') => {
        await initiateOAuth(provider);
    };

    const handleCaptchaVerify = (token: string) => {
        setCaptchaToken(token);
    };

    const handleCaptchaExpire = () => {
        setCaptchaToken(null);
    };

    const onSubmit: SubmitHandler<ILoginForm> = async (data) => {
        if (!captchaToken) {
            // Показываем ошибку, что нужно пройти CAPTCHA
            return;
        }

        await login({
            ...data,
            captchaToken,
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* ... существующие поля формы */}

            {/* CAPTCHA */}
            <div className="flex justify-center">
                <Captcha
                    provider="recaptcha" // или из env
                    siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                    onVerify={handleCaptchaVerify}
                    onExpire={handleCaptchaExpire}
                />
            </div>

            {/* Кнопка входа */}
            <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
                {/* ... */}
            </Button>

            {/* OAuth кнопки */}
            <OAuthButtons
                onOAuthClick={handleOAuthClick}
                isLoading={isLoading}
            />
        </form>
    );
};
```

**Обновление RegistrationForm**:

```typescript
// processes/auth/ui/RegistredForm/RegistredForm.tsx (обновление)
'use client';

import { Captcha } from '@/modules/shared/ui/Captcha';
import { OAuthButtons } from '@/modules/features/oauth';
import { useOAuth } from '@/modules/features/oauth';
import { useState } from 'react';

export const RegistrationForm = () => {
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const { initiateOAuth } = useOAuth();
    const { register: registerUser, isLoading, error } = useAuth();

    // ... существующий код формы

    const handleOAuthClick = async (provider: 'yandex' | 'google' | 'telegram') => {
        await initiateOAuth(provider);
    };

    const handleCaptchaVerify = (token: string) => {
        setCaptchaToken(token);
    };

    const handleCaptchaExpire = () => {
        setCaptchaToken(null);
    };

    const onSubmit: SubmitHandler<IRegisterForm> = async (data) => {
        if (!captchaToken) {
            // Показываем ошибку, что нужно пройти CAPTCHA
            return;
        }

        await registerUser({
            ...data,
            captchaToken,
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* ... существующие поля формы */}

            {/* CAPTCHA */}
            <div className="flex justify-center">
                <Captcha
                    provider="recaptcha" // или из env
                    siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                    onVerify={handleCaptchaVerify}
                    onExpire={handleCaptchaExpire}
                />
            </div>

            {/* Кнопка регистрации */}
            <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
                {/* ... */}
            </Button>

            {/* OAuth кнопки */}
            <OAuthButtons
                onOAuthClick={handleOAuthClick}
                isLoading={isLoading}
            />
        </form>
    );
};
```

### 6. Переменные окружения

```env
# CAPTCHA
NEXT_PUBLIC_CAPTCHA_PROVIDER=recaptcha # или hcaptcha, turnstile
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-hcaptcha-site-key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key

# OAuth (опционально, если нужны прямые ссылки)
NEXT_PUBLIC_OAUTH_YANDEX_URL=/api/auth/oauth/yandex
NEXT_PUBLIC_OAUTH_GOOGLE_URL=/api/auth/oauth/google
NEXT_PUBLIC_OAUTH_TELEGRAM_URL=/api/auth/oauth/telegram
```

## Интеграция с существующими модулями

### Использование компонентов

- Использовать существующие формы `LoginForm` и `RegistrationForm`
- Добавить OAuth кнопки и CAPTCHA в формы
- Использовать существующий `AuthService` для OAuth методов

### API обновление

**Нужны новые endpoints** (см. Backend задачу):
- `GET /api/auth/oauth/:provider/initiate` - инициация OAuth
- `GET /api/auth/oauth/:provider/callback` - обработка OAuth callback
- `POST /api/auth/login` - добавить параметр `captchaToken`
- `POST /api/auth/registration` - добавить параметр `captchaToken`
- `POST /api/auth/captcha/verify` - верификация CAPTCHA на backend

## Связанные задачи

- [Backend задача по OAuth и CAPTCHA](../../backend/tasks/oauth-captcha.md) - **обязательно** - реализация backend функционала
- [Унификация форм логина и регистрации](./auth-forms-unification.md) - интеграция OAuth и CAPTCHA в унифицированные формы

## Этапы реализации

### Этап 1: CAPTCHA компонент

- [ ] Создать компонент `Captcha` в `shared/ui/Captcha`
- [ ] Поддержка разных провайдеров (reCAPTCHA, hCaptcha, Turnstile)
- [ ] Загрузка скриптов CAPTCHA
- [ ] Обработка верификации и ошибок

### Этап 2: OAuth компоненты

- [ ] Создать компонент `OAuthButtons`
- [ ] Создать компонент `OAuthButton`
- [ ] Создать хук `useOAuth`
- [ ] Создать страницу OAuth callback

### Этап 3: Интеграция в формы

- [ ] Добавить CAPTCHA в `LoginForm`
- [ ] Добавить CAPTCHA в `RegistrationForm`
- [ ] Добавить OAuth кнопки в `LoginForm`
- [ ] Добавить OAuth кнопки в `RegistrationForm`
- [ ] Обновить валидацию форм (проверка CAPTCHA)

### Этап 4: Backend интеграция

- [ ] Обновить `AuthService` для поддержки OAuth
- [ ] Обновить `AuthService` для поддержки CAPTCHA
- [ ] Интегрировать с backend API

### Этап 5: Тестирование

- [ ] Протестировать CAPTCHA (разные провайдеры)
- [ ] Протестировать OAuth Yandex
- [ ] Протестировать OAuth Google
- [ ] Протестировать OAuth Telegram
- [ ] Протестировать комбинацию CAPTCHA + OAuth
