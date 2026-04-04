# Expensly Mobile App

**Voice-first expense tracker for students** - Track expenses naturally using voice input, eliminating the friction of manual data entry.

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (authentication, database, storage)
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Language**: TypeScript

## Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**
- **Expo Go** app on your phone (for testing on device)
- **Supabase account** (free tier available at [supabase.com](https://supabase.com))

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expensly/expensly-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `EXPO_PUBLIC_API_URL`: Backend API URL (optional)

4. **Run the app**
   ```bash
   npm start
   ```
   
   Scan the QR code with the Expo Go app to preview on your device.

## Project Structure

```
expensly-app/
├── app/                    # Expo Router pages (file-based routing)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point (welcome screen)
├── components/            # Reusable UI components
├── services/              # API services (Supabase, etc.)
├── stores/                # Zustand state management
├── types/                 # TypeScript type definitions
├── constants/             # App constants (colors, config)
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
└── assets/                # Images, fonts, and static assets
```

### Key Directories

- **`app/`**: Expo Router uses file-based routing. Each file in this directory becomes a route.
- **`services/`**: Contains API clients and business logic for interacting with Supabase and other services.
- **`stores/`**: Zustand stores for global state management (auth, user preferences, etc.).
- **`types/`**: Centralized TypeScript types and interfaces.
- **`constants/`**: App-wide constants like colors, sizes, and configuration.

## Development

### Running the App

- **Start development server**:
  ```bash
  npm start
  ```

- **Run on iOS simulator**:
  ```bash
  npm run ios
  ```

- **Run on Android emulator**:
  ```bash
  npm run android
  ```

- **Run on web**:
  ```bash
  npm run web
  ```

### Type Checking

Run TypeScript type checking without emitting files:
```bash
npx tsc --noEmit
```

### Code Quality

- Follow the existing code structure and naming conventions
- Use TypeScript strict mode
- Keep components focused and reusable
- Write meaningful commit messages

## Architecture

This app follows a clean architecture pattern with separation of concerns:

- **UI Layer**: React components in `app/` and `components/`
- **State Layer**: Zustand stores in `stores/`
- **Data Layer**: Services in `services/` with React Query for caching
- **Type Safety**: Comprehensive TypeScript types in `types/`

For detailed architecture documentation, see [ARCHITECTURE.md](../ARCHITECTURE.md) in the project root.

### Key Patterns

- **Authentication Flow**: Managed by `authStore` (Zustand) + Supabase Auth
- **Navigation**: File-based routing with Expo Router
- **State Management**: Zustand for global state, React Query for server state
- **API Integration**: Centralized in `services/` directory

## Current Status

### Completed

- ✅ **Milestone 1 (Partial)**: Authentication skeleton and welcome screen
  - Welcome screen with branding
  - Basic auth flow structure
  - Environment configuration
  - Project scaffolding with Expo Router

### In Progress

- 🚧 Google OAuth integration
- 🚧 Home dashboard UI

### Next Steps

1. Complete Google OAuth implementation
2. Build main dashboard with expense overview
3. Implement voice-to-text expense capture
4. Add expense categorization
5. Create analytics and insights view

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the code style
3. Test on both iOS and Android
4. Submit a pull request with a clear description

## License

[Add license information]

## Support

For issues and questions, please open a GitHub issue or contact the development team.
