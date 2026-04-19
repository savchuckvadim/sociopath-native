# Feature-Sliced Design (FSD) Architecture

## Overview

The project uses **Feature-Sliced Design (FSD)** - a methodology for organizing code that separates the application into layers by level of abstraction and isolation.

FSD helps create:
- **Maintainable** codebase
- **Scalable** architecture
- **Clear** structure
- **Testable** modules

## Layer Structure

FSD consists of the following layers (from low to high level of abstraction):

```
app/
├── shared/      # Reusable components and utilities (lowest level)
├── entities/    # Business entities (data and their representation)
├── features/    # Functional capabilities (use-cases)
├── widgets/     # Large UI blocks, composition of features and entities
├── processes/   # Global business processes (routing, authentication)
└── screens/     # Screen components (composition of all layers)
```

## Detailed Layer Description

### 1. `shared/` - Shared Resources

**Purpose**: Reusable components, utilities, constants that are not tied to business logic.

**What it contains**:
- UI components for general use (buttons, inputs, modals)
- Utilities (date formatting, validation, helpers)
- General-purpose hooks
- Configurations (WebRTC config, socket config)
- Types and interfaces for general use
- Styles and colors

**Import Rules**:
- ✅ Can import only from `shared`
- ❌ CANNOT import from other layers

**Examples**:
```typescript
// shared/ui/Button/Button.tsx
// shared/lib/utils/formatDate.ts
// shared/hooks/useDebounce.ts
// shared/style/colors.tsx
```

**Structure**:
```
shared/
├── hooks/           # Shared hooks
├── lib/             # Shared utilities
│   ├── socket/      # WebSocket utilities
│   ├── notifications/ # Notification utilities
│   └── utils/       # General utilities
├── style/           # Styles and colors
└── ui/              # Shared UI components
    ├── Avatar/
    ├── Button/
    ├── Field/
    ├── Icon/
    └── Empty/
```

### 2. `entities/` - Business Entities

**Purpose**: Business entities of the application (User, Post, Chat, Message, etc.). Contains data and their representation.

**What it contains**:
- Data models (types, interfaces)
- API services for working with the entity
- Hooks for working with data (`useUser`, `usePost`)
- UI components for displaying the entity (`PostCard`, `UserAvatar`)
- Business logic of the entity

**Structure**:
```
entities/
├── user/
│   ├── index.ts          # Public API
│   ├── lib/
│   │   ├── api/          # API services
│   │   │   └── UserService.ts
│   │   └── hook/         # React hooks
│   │       └── user.hook.ts
│   ├── ui/               # UI components
│   │   └── UserAvatar/
│   └── interface/        # Types
│       └── user.interface.tsx
├── post/
├── chat/
└── message/
```

**Import Rules**:
- ✅ Can import from `shared` and other `entities`
- ❌ CANNOT import from `features`, `widgets`, `processes`, `screens`

**Examples**:
```typescript
// entities/user/lib/api/UserService.ts
// entities/user/lib/hook/user.hook.ts
// entities/post/ui/PostCard/PostCard.tsx
```

**Key Points**:
- Entities are independent and can be used by multiple features
- Entities don't know about features that use them
- Each entity has its own API service and hooks

### 3. `features/` - Functional Capabilities (Use-Cases)

**Purpose**: Specific functional capabilities of the application that manage entities. These are use-cases - user actions.

**What it contains**:
- Logic for performing an action (creating a post, sending a message, initiating a call)
- UI for performing an action (forms, action buttons)
- State models for the feature (if needed)
- Hooks for working with the feature

**Structure**:
```
features/
├── post/
│   └── CreatePost/
│       ├── index.ts
│       ├── CreatePost.tsx
│       ├── lib/          # Logic for creating a post
│       └── ui/           # UI components
```

**Import Rules**:
- ✅ Can import from `shared`, `entities`, and other `features`
- ❌ CANNOT import from `widgets`, `processes`, `screens`

**Examples**:
```typescript
// features/post/CreatePost/CreatePost.tsx - creating a post
// features/call/lib/context/global-call-provider.tsx - managing calls
```

**Key Points**:
- Features are use-cases - specific user actions
- Features can use multiple entities
- Features manage entities, not vice versa

### 4. `widgets/` - Widgets

**Purpose**: Large composite UI blocks that combine several features and entities.

**What it contains**:
- Composition of features and entities
- Complex UI blocks (Header, Navigation, Chat Widget)
- Widgets that can be used on different screens

**Structure**:
```
widgets/
├── bottom-menu/      # Bottom navigation menu
├── call/              # Call widget
├── chat/              # Chat widget
└── profile/           # Profile widget
```

**Import Rules**:
- ✅ Can import from `shared`, `entities`, `features`, and other `widgets`
- ❌ CANNOT import from `processes`, `screens`

**Examples**:
```typescript
// widgets/bottom-menu/BottomMenu.tsx - bottom navigation
// widgets/chat/ChatListWidget/ChatListWidget.tsx - chat list
```

**Key Points**:
- Widgets are complex compositions
- Widgets can be reused across different screens
- Widgets combine features and entities

### 5. `processes/` - Business Processes

**Purpose**: Global business processes that manage application state at a high level. Can manage which screens to show, global states.

**What it contains**:
- Authentication processes (auth)
- Routing and navigation
- Global application states
- Application initialization logic

**Structure**:
```
processes/
├── auth/
│   ├── index.ts
│   ├── lib/
│   │   ├── api/          # AuthService
│   │   ├── hooks/         # Auth hooks
│   │   ├── services/      # Global auth service
│   │   └── utils/         # Auth utilities
│   ├── providers/         # AuthProvider (React Context)
│   ├── ui/                # Auth UI (LoginForm, RegisterForm)
│   └── interface/         # Auth types
└── navigation/
    ├── index.ts
    ├── interface/         # Navigation types
    └── ui/                # Navigation components
        ├── Navigation.tsx
        ├── routes.ts
        └── components/
            └── PrivateNavigator.tsx
```

**Import Rules**:
- ✅ Can import from `shared`, `entities`, `features`, `widgets`, and other `processes`
- ❌ CANNOT import from `screens`

**Examples**:
```typescript
// processes/auth/ - authentication process
// processes/navigation/ - navigation management
```

**Key Points**:
- Processes are more global than features
- Processes can manage which screens to show
- Processes manage global application state

### 6. `screens/` - Screens

**Purpose**: Entry points of the application, composition of all layers.

**What it contains**:
- Composition of widgets, features, entities
- Application screens
- Error pages

**Structure**:
```
screens/
├── auth/          # Auth screen
├── chats/         # Chat screens
├── home/          # Home screen
├── me/            # Profile screen
├── people/        # People screen
└── settings/      # Settings screen
```

**Import Rules**:
- ✅ Can import from all layers
- ✅ Can import from other `screens`

**Examples**:
```typescript
// screens/auth/Auth.tsx
// screens/chats/ChatListScreen.tsx
```

**Key Points**:
- Screens are the top-level components
- Screens compose all layers together
- Screens are the entry points for navigation

## Index Files (Public API)

Each module should have an `index.ts` file that exports only the public API.

**Purpose**:
- Control what can be imported from the module
- Hide internal implementation
- Simplify imports

**Example**:
```typescript
// entities/user/index.ts
export * from './lib/hook/user.hook';
export * from './ui/UserAvatar';
export * from './interface/user.interface';

// ❌ DO NOT export internal files:
// export * from './lib/api/UserService'; // Internal implementation
```

**Rule**: All imports should go through `index.ts`:
```typescript
// ✅ Correct
import { useUser } from '@/entities/user';
import { UserAvatar } from '@/entities/user';

// ❌ Incorrect
import { useUser } from '@/entities/user/lib/hook/user.hook';
import { UserAvatar } from '@/entities/user/ui/UserAvatar/UserAvatar';
```

## Import Rules Between Layers

### Allowed Imports:

```
shared     → (nothing)
entities   → shared, entities
features   → shared, entities, features
widgets    → shared, entities, features, widgets
processes  → shared, entities, features, widgets, processes
screens    → all layers
```

### Forbidden Imports:

- ❌ `shared` cannot import from other layers
- ❌ `entities` cannot import from `features`, `widgets`, `processes`, `screens`
- ❌ `features` cannot import from `widgets`, `processes`, `screens`
- ❌ `widgets` cannot import from `processes`, `screens`
- ❌ `processes` cannot import from `screens`

### Examples of Correct Imports:

```typescript
// ✅ entities/user can import entities/post
import { Post } from '@/entities/post';

// ✅ features/post can import multiple entities
import { Post } from '@/entities/post';
import { User } from '@/entities/user';

// ✅ widgets/Header can import features and entities
import { CreatePost } from '@/features/post';
import { User } from '@/entities/user';

// ❌ entities/post CANNOT import features/post
import { CreatePost } from '@/features/post'; // ERROR!
```

## Naming Conventions

### Hooks

**ALL** React hooks in the project must have the `.hook.ts` suffix, without exception:

```typescript
// ✅ Correct
// entities/post/lib/hook/post.hook.ts
// entities/post/lib/hook/posts.hook.ts
// features/call/lib/hook/call-controls.hook.ts
// processes/auth/lib/hooks/auth.hook.ts

// ❌ Incorrect
// entities/post/lib/hook/post.ts
// entities/post/lib/hook/usePost.ts
// features/post/CreatePost/lib/useCreatePostForm.ts
```

**Examples from the project**:
- `user.hook.ts` - hook for working with one user
- `posts.hook.ts` - hook for working with a list of posts
- `auth.hook.ts` - authentication hook
- `useCreatePostForm.hook.ts` - hook for post creation form

### Components

- Use PascalCase: `UserAvatar.tsx`, `CreatePost.tsx`
- Component file name should match component name

### Services

- Use PascalCase with `Service` suffix: `UserService.ts`, `AuthService.ts`

### Types

- Use descriptive names: `user.types.ts`, `auth.interface.ts`
- Or use `.interface.ts` for interfaces

### Constants

- Use `.consts.ts` or `.const.ts`: `auth.consts.ts`

## Module Structure

Each module in a layer should follow a unified structure:

```
module-name/
├── index.ts          # Public API - what can be imported
├── lib/              # Module logic
│   ├── api/          # API services
│   ├── hook/         # React hooks (name: *.hook.ts)
│   ├── util/         # Utilities
│   └── ...
├── ui/               # UI components
├── model/            # State models (if needed)
├── type/             # Types and interfaces
└── consts/           # Constants
```

## FSD Benefits

1. **Isolation**: Each layer is isolated from higher layers
2. **Reusability**: Lower layers can be reused
3. **Scalability**: Easy to add new features and entities
4. **Clarity**: Clear structure, easy to find things
5. **Testability**: Easy to test isolated modules

## Important Principles

1. **One Module = One Responsibility**: A module should solve one task
2. **Public API through index.ts**: All imports through public API
3. **No Reverse Imports**: Lower layers don't know about higher layers
4. **Features Manage Entities**: Features are use-cases that use entities
5. **Processes Manage Global State**: Processes are more global than features

## Real Project Examples

### Entity Example: `entities/user`

```typescript
// entities/user/index.ts
export * from './lib/hook/user.hook';
export * from './ui/UserAvatar';
export * from './interface/user.interface';

// entities/user/lib/hook/user.hook.ts
import { useQuery } from '@tanstack/react-query';
import { UserService } from '../api/UserService';

export const useUser = (userId: string) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => UserService.getUser(userId),
    });
    return { user: data, isLoading, error };
};
```

### Feature Example: `features/post/CreatePost`

```typescript
// features/post/CreatePost/CreatePost.tsx
import { Post } from '@/entities/post';
import { User } from '@/entities/user';

export const CreatePost = () => {
    // Uses entities/post and entities/user
    // Implements the use-case of creating a post
};
```

### Process Example: `processes/auth`

```typescript
// processes/auth/providers/AuthProvider.tsx
import { createContext, useState } from 'react';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Manages global authentication state
    return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
};
```

## Common Mistakes to Avoid

1. **❌ Importing from higher layers in lower layers**
   ```typescript
   // ❌ Wrong: entities/user importing from features
   import { CreatePost } from '@/features/post';
   ```

2. **❌ Not using index.ts for imports**
   ```typescript
   // ❌ Wrong
   import { useUser } from '@/entities/user/lib/hook/user.hook';

   // ✅ Correct
   import { useUser } from '@/entities/user';
   ```

3. **❌ Not following hook naming convention**
   ```typescript
   // ❌ Wrong
   // entities/user/lib/hook/useUser.ts

   // ✅ Correct
   // entities/user/lib/hook/user.hook.ts
   ```

4. **❌ Exporting internal implementation**
   ```typescript
   // ❌ Wrong: exporting internal service
   export * from './lib/api/UserService';

   // ✅ Correct: only export public API
   export * from './lib/hook/user.hook';
   ```

## Summary

FSD provides a clear, scalable architecture for organizing code. By following the layer structure, import rules, and naming conventions, you can create a maintainable and understandable codebase.

For questions or clarifications, refer to:
- [Main Documentation](../documentation.md)
- [FSD Official Documentation](https://feature-sliced.design/)
