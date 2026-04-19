# Sociopath Network - Mobile App

Mobile version of the Sociopath Network social media platform built with React Native and Expo.

## 📋 Project Description

Sociopath Network Mobile is a full-featured social media mobile application with:
- **Authentication** - registration, login, email confirmation
- **Social Network** - posts, likes, reposts, followers
- **Messenger** - chats, messages, real-time updates
- **Calls** - video and audio calls via LiveKit
- **Profiles** - user profile management
- **Notifications** - real-time notifications about events
- **Presence** - online/offline status tracking

## 🏗️ Technology Stack

### Core
- **React Native 0.81.5** - mobile framework
- **Expo SDK 54** - development platform
- **React 19.1.0** - UI library
- **TypeScript 5.9.2** - type safety

### State Management & Data Fetching
- **TanStack Query 5.90.16** - server state management and caching
- **React Context API** - client state (authentication)

### Navigation
- **React Navigation 7** - navigation library
- **Native Stack Navigator** - stack navigation

### Networking
- **Axios 1.13.2** - HTTP client
- **Socket.IO Client 4.8.3** - WebSocket connections
- **Orval 7.13.0** - API code generation from OpenAPI

### Real-time Communication
- **LiveKit 2.9.6** - video/audio calls
- **WebRTC** - peer-to-peer communication

### UI & Styling
- **NativeWind** - Tailwind CSS for React Native
- **React Native SVG 15.12.1** - SVG rendering
- **Lucide React Native** - icon library

### Storage
- **AsyncStorage 2.2.0** - key-value storage
- **Expo Secure Store** - secure token storage

### Forms
- **React Hook Form 7.70.0** - form management

### Other
- **Expo Notifications** - push notifications
- **Expo Camera** - camera access
- **Expo Image Picker** - image selection
- **React Native Reanimated** - animations

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- **Expo CLI** (installed globally or via npx)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   DEV_API_URL=http://10.0.2.2:3000
   PROD_API_URL=https://api.sociopath-network.ru
   LIVEKIT_URL=https://ws.sociopath-network.ru
   EXPO_PUBLIC_API_URL=https://api.sociopath-network.ru
   ```

   **Note for Android Emulator**: Use `10.0.2.2` instead of `localhost` to access your local development server.

4. **Generate API client**
   ```bash
   npm run api:generate
   ```

   This generates TypeScript types and API functions from the backend OpenAPI specification.

### Running Locally

#### Development Mode

1. **Start the Expo development server**
   ```bash
   npm start
   # or
   npm run start
   ```

2. **Run on device/emulator**

   **Android:**
   ```bash
   npm run android
   ```

   **iOS (macOS only):**
   ```bash
   npm run ios
   ```

   **Web (for testing):**
   ```bash
   npm run web
   ```

#### Using Expo Go

For quick testing without building native code:

```bash
npm run start:go
```

Then scan the QR code with Expo Go app on your device.

### Building for Production

#### Android

1. **Build APK/AAB**
   ```bash
   # Development build
   eas build --platform android --profile development

   # Preview build (internal distribution)
   eas build --platform android --profile preview

   # Production build (for Play Store)
   eas build --platform android --profile production
   ```

2. **Submit to Google Play Store**
   ```bash
   eas submit --platform android --profile production
   ```

#### iOS

1. **Build IPA**
   ```bash
   # Development build
   eas build --platform ios --profile development

   # Preview build (internal distribution)
   eas build --platform ios --profile preview

   # Production build (for App Store)
   eas build --platform ios --profile production
   ```

2. **Submit to App Store**
   ```bash
   eas submit --platform ios --profile production
   ```

### EAS Build Profiles

The project uses EAS Build with the following profiles (configured in `eas.json`):

- **development** - Development builds with development client
- **preview** - Internal distribution builds (APK for Android, TestFlight for iOS)
- **production** - Store builds (AAB for Android, App Store for iOS)

## 📁 Project Structure

The project follows **Feature-Sliced Design (FSD)** architecture. See [Architecture Documentation](./documentation/arcitecture/fsd.md) for details.

```
app/
├── api/              # API client and interceptors
│   ├── generated/    # Auto-generated API code (from Orval)
│   └── lib/          # API configuration and interceptors
├── config/           # App configuration
├── entities/         # Business entities (user, post, chat, message, etc.)
├── features/         # Feature use-cases (create post, etc.)
├── processes/        # Business processes (auth, navigation)
├── screens/          # Screen components
├── shared/           # Shared components and utilities
└── widgets/          # Complex UI widgets
```

## 📖 Documentation

Comprehensive documentation is available in the [`documentation/`](./documentation/) directory:

- **[General Documentation](./documentation/documentation.md)** - Overview, principles, and links to detailed docs
- **[FSD Architecture](./documentation/arcitecture/fsd.md)** - Detailed Feature-Sliced Design architecture guide
- **Authentication** - How authentication works (coming soon)
- **API & Code Generation** - API client generation with Orval (coming soon)

## 🔧 Available Scripts

```bash
# Development
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on web

# Code Generation
npm run api:generate   # Generate API client from OpenAPI spec

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier

# Build
npm run prebuild       # Generate native code
npm run clean          # Clean build cache
```

## 🔐 Authentication

The app uses JWT tokens (access token + refresh token) stored in secure storage (AsyncStorage/SecureStore).

- **Access Token** - Short-lived (15 minutes), used for API requests
- **Refresh Token** - Long-lived (7 days), used to refresh access token

Authentication flow:
1. User logs in → receives tokens
2. Tokens stored in secure storage
3. Access token automatically attached to requests via interceptor
4. On 401 error → refresh token used to get new access token
5. If refresh fails → user redirected to login

See [Authentication Documentation](./documentation/documentation.md#authentication) for details.

## 🌐 API Integration

The app uses **Orval** to generate TypeScript API client from the backend OpenAPI specification.

- **API Base URL**: Configured in `app/config/api.config.ts`
- **Code Generation**: Run `npm run api:generate` after backend API changes
- **Generated Code**: Located in `app/api/generated/`

See [API Documentation](./documentation/documentation.md#api--code-generation) for details.

## 🔄 State Management

- **TanStack Query** - Server state (API data, caching)
- **React Context** - Client state (authentication, global app state)

No Redux is used in the mobile version (unlike the web version).

## 📡 WebSockets

The app uses Socket.IO for real-time features:

- **Messages** - Real-time message delivery
- **Presence** - Online/offline status tracking
- **Notifications** - Real-time event notifications

WebSocket connections are managed in:
- `app/shared/lib/socket/` - WebSocket utilities
- `app/entities/chats/lib/hooks/useGlobalMessagesSocket.ts` - Messages socket
- `app/entities/presence/lib/hooks/usePresenceSocket.hook.ts` - Presence socket

## 🎨 Styling

The app uses **NativeWind** (Tailwind CSS for React Native) for styling.

- Utility-first CSS classes
- Dark mode support (configured)
- Responsive design

## 📱 Platform-Specific Notes

### Android

- **Emulator**: Use `10.0.2.2` instead of `localhost` for local API
- **Permissions**: Camera, microphone, storage permissions configured in `app.json`
- **Build**: Uses Gradle, builds APK or AAB

### iOS

- **Simulator**: `localhost` works for local API
- **Permissions**: Camera and microphone permissions configured in `app.json`
- **Build**: Uses Xcode, builds IPA
- **Background Modes**: Audio and VoIP configured for calls

## 🐛 Troubleshooting

### API Connection Issues

**Android Emulator:**
- Use `10.0.2.2` instead of `localhost` in API URL
- Check that backend is running and accessible

**iOS Simulator:**
- Use `localhost` or `127.0.0.1`
- Check network permissions

### Build Issues

- Clear cache: `npm run clean`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Clear Expo cache: `expo start -c`

### WebSocket Issues

- Check that backend WebSocket server is running
- Verify access token is valid
- Check network connectivity

## 📄 License

[Add your license here]

## 👥 Contributors

[Add contributors here]

## 🔗 Links

- **Backend API**: [https://api.sociopath-network.ru](https://api.sociopath-network.ru)
- **API Documentation**: [https://api.sociopath-network.ru/docs/api](https://api.sociopath-network.ru/docs/api)
- **Design**: [Figma Design](https://www.figma.com/design/JVmBUccs0lbn0PI0DOzH27/Sociopath.?node-id=41-4261)
