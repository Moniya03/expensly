# Expensly Mobile App

**Voice-first expense tracker for students** - Track expenses naturally using voice input, eliminating the friction of manual data entry.

## Features

- 🎤 **Voice expense logging** - Say "spent 200 on lunch" and the expense is parsed and saved (OpenAI Whisper transcription + on-device category parsing)
- 💸 **Expense tracking** - Manual and voice entry, notes, backdating, categories
- 📊 **Insights** - Monthly category breakdowns and spending analysis
- 🎯 **Budgets** - Per-category monthly budget targets with progress
- 🏺 **Goals (Jars)** - Savings goals with custom icons and progress tracking
- 🤝 **Split expenses** - Track friend splits
- 📤 **CSV export** - Export transaction history
- 🔐 **Google Sign-In** - Supabase Auth with Google OAuth
- ☁️ **OTA updates** - JS-only changes ship instantly via EAS Update

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (authentication, database, edge functions)
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Voice**: OpenAI Whisper (via Supabase edge function)
- **Language**: TypeScript
- **Code Quality**: Biome (lint + format), ESLint (expo), `tsc --noEmit`

## Prerequisites

- **Node.js** 18 or higher
- **bun** (package manager — `bun.lock` is the lockfile)
- **Expo Go** app on your phone (for testing on device)
- **Supabase account** (free tier available at [supabase.com](https://supabase.com))
- **Google Cloud OAuth client** (web client ID for sign-in)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expensly/expensly-app
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment variables**

   Create `.env` (gitignored) with your Supabase and Google credentials:
   - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: Your Google OAuth web client ID

   These are inlined at bundle time (public prefix) — the same three values are stored as GitHub Actions secrets for CI builds (see [docs/secrets.md](docs/secrets.md)).

4. **Set up the database**

   The Supabase schema lives in `../supabase/migrations/`. Apply the migrations in order via the Supabase SQL Editor (see `../supabase/QUICKSTART.md`).

5. **Run the app**
   ```bash
   bun start
   ```

   Scan the QR code with the Expo Go app to preview on your device.

## Project Structure

```
expensly-app/
├── app/                    # Expo Router pages (file-based routing)
│   ├── (auth)/            # Authentication screens (welcome)
│   ├── (tabs)/            # Main tab navigation (home, history, voice, goals, profile)
│   ├── onboarding/        # First-run onboarding (name, budget)
│   ├── insights/          # Monthly insights and analysis
│   ├── transaction/       # Add/edit transaction
│   ├── settings.tsx       # App settings
│   ├── support.tsx        # Support and feedback
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point (welcome screen)
├── components/            # Reusable UI components
│   ├── home/              # Home dashboard widgets
│   ├── goals/             # Savings goals UI
│   ├── profile/           # Profile screen pieces
│   ├── transactions/      # Transaction list/cards
│   ├── voice/             # Voice capture UI
│   └── ui/                # Shared primitives
├── services/              # API services (Supabase, voice, export, support)
├── stores/                # Zustand state management
├── types/                 # TypeScript type definitions
├── constants/             # App constants (colors, config)
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
├── assets/                # Images, fonts, and static assets
├── scripts/               # CI/CD helper scripts (build.gradle patch, signing preflight)
├── docs/                  # Pipeline, release, OTA, secrets, troubleshooting docs
└── .github/workflows/     # GitHub Actions: CI, native release, OTA publish
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
  bun start
  ```

- **Run on iOS simulator**:
  ```bash
  bun run ios
  ```

- **Run on Android emulator**:
  ```bash
  bun run android
  ```

- **Run on web**:
  ```bash
  bun run web
  ```

### Quality Gates

```bash
bun run lint          # Biome lint
bun run format        # Biome format (write mode)
bun run check-types   # TypeScript type checking (tsc --noEmit)
bun run lint:expo     # ESLint via expo lint
```

These exact checks run in CI on every PR (see [docs/pipeline.md](docs/pipeline.md)).

## Architecture

This app follows a clean architecture pattern with separation of concerns:

- **UI Layer**: React components in `app/` and `components/`
- **State Layer**: Zustand stores in `stores/`
- **Data Layer**: Services in `services/` with React Query for caching
- **Type Safety**: Comprehensive TypeScript types in `types/`

For detailed architecture documentation, see [ARCHITECTURE.md](../ARCHITECTURE.md) in the project root.

### Key Patterns

- **Authentication Flow**: Managed by `authStore` (Zustand) + Supabase Auth (Google OAuth)
- **Navigation**: File-based routing with Expo Router
- **State Management**: Zustand for global state, React Query for server state
- **API Integration**: Centralized in `services/` directory

## CI/CD Pipeline

The repo ships a full two-layer release pipeline on GitHub Actions:

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | PRs to `main` | Runs Biome lint, expo lint, and `tsc --noEmit` |
| `release-mobile.yml` | Version bump in `package.json` (or manual dispatch) | Builds 4 signed APKs (universal + arm64 + armeabi-v7a + x86_64) and publishes a GitHub Release with an auto-generated changelog |
| `ota-publish.yml` | Any app-code push to `main` | Publishes a JS-only update to the production channel via EAS Update (gated by runtime fingerprint) |

Native APKs are signed with the Expensly keystore stored in GitHub secrets — never committed. JS-only fixes reach users within minutes without reinstalling; native changes require a version bump.

For full details see [docs/pipeline.md](docs/pipeline.md), [docs/release.md](docs/release.md), and [docs/ota.md](docs/ota.md).

## Documentation

- [docs/README.md](docs/README.md) - Index and quickstart for the pipeline
- [docs/pipeline.md](docs/pipeline.md) - Architecture and trigger matrix of all 3 workflows
- [docs/release.md](docs/release.md) - When to bump versions, release flow, verification, APK rollback
- [docs/ota.md](docs/ota.md) - EAS Update behavior, fingerprint coupling, dashboard rollback
- [docs/secrets.md](docs/secrets.md) - The 8 CI secrets, keystore facts, backup requirements
- [docs/troubleshooting.md](docs/troubleshooting.md) - Failure modes and the versionCode monotonicity trap
- [ARCHITECTURE.md](../ARCHITECTURE.md) - App architecture overview

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the code style (Biome enforced)
3. Run `bun run lint`, `bun run check-types`, and `bun run lint:expo`
4. Submit a pull request with a clear description

## License

[Add license information]

## Support

For issues and questions, please open a GitHub issue or contact the development team.
