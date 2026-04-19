# Project Structure

## Overview

The project follows **Feature-Sliced Design (FSD)** architecture, organizing code into layers by abstraction level. This document describes the complete project structure and what each directory contains.

## Root Structure

```
mobile/
├── app/                    # Application code (FSD structure)
├── assets/                 # Static assets (images, icons, fonts)
├── documentation/          # Project documentation
├── .env                    # Environment variables
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
├── orval.config.ts        # API code generation config
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project overview
```

## App Directory Structure

```
app/
├── api/                   # API client and interceptors
├── config/                # App configuration
├── entities/              # Business entities
├── features/              # Feature use-cases
├── hooks/                 # Global hooks (legacy)
├── processes/             # Business processes
├── screens/               # Screen components
├── shared/                # Shared resources
└── widgets/               # Complex UI widgets
```

## Detailed Structure

### `app/api/` - API Client

```
api/
├── generated/             # Auto-generated API code (Orval)
│   ├── auth/
│   │   └── auth.ts       # Authentication API
│   ├── calls/
│   │   └── calls.ts      # Calls API
│   ├── chats/
│   │   └── chats.ts      # Chats API
│   ├── messages/
│   │   └── messages.ts   # Messages API
│   ├── posts/
│   │   └── posts.ts      # Posts API
│   ├── profile/
│   │   └── profile.ts    # Profile API
│   ├── user/
│   │   └── user.ts       # User API
│   ├── model/             # TypeScript types (DTOs)
│   │   ├── userDto.ts
│   │   ├── postDto.ts
│   │   └── ...
│   └── index.ts           # Main export
├── lib/
│   ├── auth/              # Auth utilities
│   │   ├── auth-errors.const.ts
│   │   ├── auth.type.ts
│   │   ├── helper-auth.api.ts
│   │   └── helper-storage.api.ts
│   ├── interceptors/      # Axios interceptors
│   │   ├── with-token.interceptor.ts
│   │   ├── refresh.interceptor.ts
│   │   └── error-toast.interceptor.ts
│   ├── utils/             # API utilities
│   │   ├── error.util.ts
│   │   └── request.util.ts
│   └── back-api.ts        # Custom axios instance
└── index.ts               # Public API
```

**Purpose**: API client, interceptors, and generated code from Orval.

### `app/config/` - Configuration

```
config/
└── api.config.ts          # API URLs and configuration
```

**Purpose**: App-wide configuration (API URLs, environment settings).

### `app/entities/` - Business Entities

```
entities/
├── call/                  # Call entity
│   ├── index.ts
│   ├── lib/
│   │   ├── api/
│   │   ├── hooks/
│   │   └── ...
│   └── ui/
├── chats/                 # Chat entity
│   ├── index.ts
│   ├── lib/
│   │   ├── api/
│   │   │   └── ChatService.ts
│   │   ├── hooks/
│   │   │   └── useGlobalMessagesSocket.ts
│   │   └── ...
│   └── ui/
├── messages/              # Message entity
│   ├── index.ts
│   ├── lib/
│   │   ├── api/
│   │   ├── hooks/
│   │   └── ...
│   └── ui/
├── posts/                 # Post entity
│   ├── index.ts
│   ├── lib/
│   │   ├── api/
│   │   └── hook/
│   │       └── posts.hook.ts
│   └── ui/
├── presence/              # Presence entity
│   ├── index.ts
│   ├── lib/
│   │   ├── constants/
│   │   ├── hooks/
│   │   │   ├── usePresence.hook.ts
│   │   │   └── usePresenceSocket.hook.ts
│   │   └── types/
│   └── ui/
├── profile/               # Profile entity
│   ├── index.ts
│   ├── lib/
│   │   ├── api/
│   │   │   └── ProfileService.ts
│   │   └── hook/
│   │       └── profile.hook.ts
│   └── ui/
└── user/                  # User entity
    ├── index.ts
    ├── interface/
    ├── lib/
    │   ├── api/
    │   │   └── UserService.ts
    │   └── hook/
    │       └── user.hook.ts
    └── ui/
        └── UserAvatar/
```

**Purpose**: Business entities with their data models, API services, hooks, and UI components.

### `app/features/` - Feature Use-Cases

```
features/
└── post/
    └── CreatePost/
        ├── index.ts
        ├── CreatePost.tsx
        ├── lib/
        └── ui/
```

**Purpose**: Specific user actions (use-cases) that manage entities.

### `app/processes/` - Business Processes

```
processes/
├── auth/                  # Authentication process
│   ├── index.ts
│   ├── interface/
│   │   └── auth-provider.interface.ts
│   ├── lib/
│   │   ├── api/
│   │   │   └── AuthService.ts
│   │   ├── hooks/
│   │   │   ├── auth.hook.ts
│   │   │   ├── auth-check.hook.tsx
│   │   │   ├── auth-logout.hook.ts
│   │   │   └── auth-mutations.hook.ts
│   │   ├── services/
│   │   │   └── auth-global.service.ts
│   │   └── utils/
│   ├── providers/
│   │   └── AuthProvider.tsx
│   ├── type/
│   │   └── auth.type.ts
│   └── ui/
│       ├── LoginForm/
│       ├── RegisterForm/
│       └── Logout/
└── navigation/             # Navigation process
    ├── index.ts
    ├── interface/
    │   └── navigation.interface.ts
    └── ui/
        ├── Navigation.tsx
        ├── routes.ts
        └── components/
            └── PrivateNavigator.tsx
```

**Purpose**: Global business processes (authentication, navigation, routing).

### `app/screens/` - Screen Components

```
screens/
├── auth/
│   └── Auth.tsx          # Auth screen
├── chats/
│   ├── ChatListScreen.tsx
│   ├── Chats.tsx
│   └── ChatScreen.tsx
├── home/
│   └── Home.tsx          # Home screen
├── me/
│   └── Me.tsx            # Profile screen
├── people/
│   └── People.tsx        # People list screen
├── settings/
│   └── Settings.tsx      # Settings screen
├── user-profile/
│   └── UserProfile.tsx   # User profile screen
└── index.ts              # Screen exports
```

**Purpose**: Top-level screen components that compose widgets, features, and entities.

### `app/shared/` - Shared Resources

```
shared/
├── hooks/
│   └── usePermissions.ts  # Shared hooks
├── lib/
│   ├── notifications/
│   │   └── sound-notification.ts
│   ├── socket/
│   │   ├── messages-socket.ts
│   │   └── websocket.ts
│   └── utils/
│       ├── is-dev.util.ts
│       └── ...
├── style/
│   └── colors.tsx        # Color constants
└── ui/                   # Shared UI components
    ├── Avatar/
    ├── Button/
    ├── Empty/
    ├── Field/
    ├── Icon/
    ├── icons/
    ├── illustrations/
    ├── Loader/
    ├── Loading/
    └── Toast/
```

**Purpose**: Reusable components, utilities, and styles not tied to business logic.

### `app/widgets/` - Complex UI Widgets

```
widgets/
├── bottom-menu/           # Bottom navigation menu
│   ├── index.ts
│   ├── BottomMenu.tsx
│   ├── components/
│   └── interface/
├── call/                  # Call widget
│   └── CallWrapper/
│       ├── CallWrapper.tsx
│       └── index.ts
├── chat/                  # Chat widget
│   ├── ChatListWidget/
│   ├── ChatMessagesWidget/
│   └── ChatInputWidget/
└── profile/                # Profile widget
    ├── ProfileInformation/
    └── ProfilePosts/
```

**Purpose**: Complex composite UI blocks that combine features and entities.

## File Naming Conventions

### Hooks
- **Pattern**: `*.hook.ts`
- **Examples**: `user.hook.ts`, `auth.hook.ts`, `posts.hook.ts`

### Components
- **Pattern**: `ComponentName.tsx` (PascalCase)
- **Examples**: `UserAvatar.tsx`, `CreatePost.tsx`

### Services
- **Pattern**: `*Service.ts` (PascalCase with Service suffix)
- **Examples**: `UserService.ts`, `AuthService.ts`

### Types
- **Pattern**: `*.types.ts` or `*.interface.ts`
- **Examples**: `user.types.ts`, `auth.interface.ts`

### Constants
- **Pattern**: `*.consts.ts` or `*.const.ts`
- **Examples**: `auth.consts.ts`, `presence.consts.ts`

### Utilities
- **Pattern**: `*.util.ts`
- **Examples**: `error.util.ts`, `is-dev.util.ts`

## Index Files (Public API)

Each module should have an `index.ts` file that exports only the public API:

```typescript
// app/entities/user/index.ts
export * from './lib/hook/user.hook';
export * from './ui/UserAvatar';
export * from './interface/user.interface';
```

**Rule**: All imports should go through `index.ts`:

```typescript
// ✅ Correct
import { useUser } from '@/entities/user';

// ❌ Incorrect
import { useUser } from '@/entities/user/lib/hook/user.hook';
```

## Import Paths

The project uses path aliases configured in `tsconfig.json`:

```typescript
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./app/*"]
    }
  }
}
```

**Usage**:
```typescript
import { useAuth } from '@/processes/auth';
import { useUser } from '@/entities/user';
import { Button } from '@/shared/ui/Button';
```

## Module Structure Template

Each module follows this structure:

```
module-name/
├── index.ts          # Public API
├── lib/              # Module logic
│   ├── api/          # API services
│   ├── hook/         # React hooks (*.hook.ts)
│   ├── util/         # Utilities
│   └── ...
├── ui/               # UI components
├── model/            # State models (if needed)
├── type/             # Types and interfaces
└── consts/           # Constants
```

## Key Directories Summary

| Directory | Purpose | Can Import From |
|-----------|---------|-----------------|
| `shared/` | Reusable resources | `shared` only |
| `entities/` | Business entities | `shared`, `entities` |
| `features/` | Use-cases | `shared`, `entities`, `features` |
| `widgets/` | Complex UI blocks | `shared`, `entities`, `features`, `widgets` |
| `processes/` | Business processes | `shared`, `entities`, `features`, `widgets`, `processes` |
| `screens/` | Screen components | All layers |

## Assets

```
assets/
├── 404.svg
├── empty.svg
├── logo.svg
├── icons/            # Icon assets
└── splash-icon.png
```

**Purpose**: Static assets (images, icons, fonts) used throughout the app.

## Configuration Files

### `app.json`
Expo configuration (app name, version, permissions, etc.)

### `eas.json`
EAS Build configuration (build profiles, distribution settings)

### `orval.config.ts`
API code generation configuration

### `tsconfig.json`
TypeScript configuration with path aliases

### `.env`
Environment variables (API URLs, keys, etc.)

## Documentation

```
documentation/
├── arcitecture/
│   └── fsd.md           # FSD architecture guide
├── auth.md               # Authentication guide
├── api.md                # API & code generation
├── state-management.md   # State management
├── websockets.md         # WebSockets & real-time
├── hooks.md              # Hooks guide
├── project-structure.md  # This file
└── documentation.md      # Main documentation index
```

## Summary

The project structure:
- **Follows FSD** - Clear layer separation
- **Consistent naming** - Hooks use `.hook.ts`, services use `*Service.ts`
- **Public API** - Each module exports through `index.ts`
- **Path aliases** - Clean imports with `@/` prefix
- **Organized** - Easy to find and understand code

This structure ensures maintainability, scalability, and clarity throughout the codebase.
