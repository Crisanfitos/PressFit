# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PressFit is a React Native fitness tracking app built with Expo SDK 54. Users plan weekly routines, log sets/reps/weight in real-time, and visualize progress over time. The UI is in Spanish (screen names, database columns, labels).

## Technology Stack

- **Framework:** React Native + Expo (SDK 54, React 19, RN 0.81)
- **Language:** TypeScript (strict mode)
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Storage)
- **Navigation:** React Navigation v7 (Native Stack, Bottom Tabs via Material Top Tabs)
- **Charts:** react-native-gifted-charts for progress visualization
- **UI:** expo-linear-gradient, @expo/vector-icons (MaterialIcons)

## Commands

```bash
# Development
npm start                    # Start Expo dev server
npm run android              # Run on Android emulator/device
npm run ios                  # Run on iOS simulator
npm run web                  # Start web version

# Testing (requires SUPABASE_SERVICE_ROLE_KEY in .env to bypass RLS)
npm test                     # Run all tests
npm run test:unit            # Unit tests only (__tests__/unit/)
npm run test:flows           # Integration flow tests only (__tests__/flows/)
npm run test:watch           # Watch mode
npm run test:coverage        # With coverage report
jest __tests__/unit/series.test.ts  # Run a single test file

# Building
eas build --platform android --profile development   # Dev build
eas build --platform android --profile production     # Production build
```

## Architecture

### Layer Separation Pattern

The codebase enforces strict separation between UI and data. Never let screens call services directly or put business logic in components.

- **Screens** (`src/screens/`) render UI using data from controllers. Default-exported.
- **Controllers** (`src/controllers/`) are custom hooks (`useXxxController`) that manage state, orchestrate service calls, and expose data + actions to screens. Named-exported.
- **Services** (`src/services/`) are plain object modules (not classes) containing async functions that make direct Supabase queries. They return `{ data, error }` shaped responses. Named-exported.
- **Components** (`src/components/`) are reusable UI pieces. Named-exported.

Flow: `Screen → useController() → Service.method() → Supabase`

### Navigation Structure

```
RootNavigator (auth gate)
├── AuthNavigator (NativeStack) — unauthenticated
│   ├── Welcome
│   ├── Login
│   └── SignUp
└── MainNavigator (MaterialTopTabs, bottom position) — authenticated
    ├── "Semana" → WeeklyPlanNavigator (NativeStack)
    │   ├── MonthlyCalendar (home)
    │   ├── WorkoutDay
    │   ├── Workout
    │   ├── ExerciseLibrary
    │   ├── ExerciseDetail
    │   ├── RoutineEditor
    │   └── RoutineDetail
    ├── "Progreso" → ProgressNavigator (NativeStack)
    │   ├── ProgressMain
    │   ├── MonthlyProgress / WeeklyProgress / DailyProgress
    │   ├── ExerciseTracking
    │   └── PhysicalProgress
    └── "Perfil" → ProfileNavigator (NativeStack)
        ├── ProfileMain
        └── PhysicalProgress
```

Navigation param types are defined in each navigator file (e.g., `WeeklyPlanStackParamList`).

### Context Providers

Wrapped in `App.tsx` in this order (outermost first):
1. **ThemeProvider** — dark/light/system theme with `AsyncStorage` persistence. Access via `useTheme()` which returns `{ theme, themeMode, setThemeMode, toggleTheme }`.
2. **AuthProvider** — Supabase auth state (Google OAuth + email). Access via `useAuth()` which returns user, session, and auth methods.
3. **AlertProvider** — Custom modal alert system replacing `Alert.alert()`. Access via `useAlert()` returning `showAlert({ title, message, type, buttons })`.

### Database (Supabase/PostgreSQL)

Column and table names are in Spanish:
- `rutinas_semanales` — weekly routine templates
- `rutinas_diarias` — daily routines (a day within a weekly routine)
- `ejercicios_programados` — scheduled exercises within a daily routine
- `series` — individual sets (with `numero_serie`, `peso_utilizado`, `repeticiones`, `rpe`)
- `ejercicios` — exercise catalog

Common query pattern: nested selects with Supabase's embedded syntax, e.g.:
```ts
supabase.from('rutinas_diarias').select('*, ejercicios_programados(*, ejercicio:ejercicios(*), series(*))')
```

### Theme System

Colors are defined in `src/theme/colors.ts` with a `palette` constant and typed `Theme`/`ThemeColors` interfaces. Both `themes.dark` and `themes.light` are available. Always use `const { theme } = useTheme()` and reference `theme.colors.xxx` — never hardcode color values.

### Testing Setup

- Jest with `jest-expo` preset, running in `node` environment
- Tests hit a **real Supabase instance** (not mocked) — the test setup in `__tests__/setup/testSetup.ts` creates a real Supabase client
- Set `SUPABASE_SERVICE_ROLE_KEY` in `.env` to bypass Row Level Security during tests
- Test helpers in `__tests__/helpers/testHelpers.ts` provide CRUD utilities for test data
- Coverage is collected from `src/services/` and `src/controllers/` only
- 30-second timeout per test (`testTimeout: 30000`)

### Environment Variables

Required in `.env` at project root:
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — (for tests) bypasses RLS

## General Guidelines

- Ensure all logic separating UI (screens/components) from data (controllers/services) is respected.
- Prioritize clear, readable TypeScript over excessively clever solutions.
- Test changes adequately (run `npm run test` or specific unit/flow tests).
- When implementing UI features, check for existing theme tokens in `src/theme` before hardcoding values.

## AI Execution Loop (Plan -> Execute -> Test -> Iterate)

- **Iterative Validation:** Never assume your first implementation is correct. Always follow the loop: Plan the change -> Execute the code -> Test it -> Evaluate if it worked. If the result is negative or doesn't meet the user's needs, iterate and try again until it's perfect.
- **Continuous Learning (In the Loop):** Learn from your mistakes. If an approach fails, an API changes, or a specific project quirk causes errors, **you must actively update** `.claude/CLAUDE.local.md` or the corresponding files in `.claude/rules/` to document the error. This ensures you do not repeat the same mistakes in the future.

## Git Workflow & Context

- Before implementing features, always verify the current Git branch and its changes relative to the `main` branch.
- Understand the objective of the current branch to perform highly cohesive and scalable development.
- Review diffs carefully to ensure no unrelated or destructive changes are committed.
