# ITVertex — Agent Guide

Expo SDK 54 / RN 0.81 / React 19.1 / NativeWind v4 / Supabase

## Dev commands

```bash
npm start          # expo start
npm run android    # expo run:android (dev build)
npm run ios        # expo run:ios (dev build)
npm run web        # expo start --web
npm run lint       # expo lint (eslint-config-expo flat config)
```

No test suite configured. No typecheck script — run `npx tsc --noEmit` if needed.

## Key setup

- **`.env`** required (gitignored): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`. Hardcoded fallbacks in `eas.json` preview/production profiles.
- **`react-native-url-polyfill/auto`** must be imported at root (`app/_layout.tsx:1`) before any other module — Supabase breaks without it on RN.
- **`global.css`** loaded in `_layout.tsx` — imports Tailwind layers + Kanit font-face rules + icon font exclusion guards.
- **Path alias**: `@/` maps to project root (tsconfig paths).

## Architecture

- **Expo Router v6** file-based routing. Three route groups:
  - `(auth)/` — login, forgot-password, reset-password
  - `(tabs)/` — staff/customer screens (bottom tabs: repairs, report, receive, customer, settings)
  - `(meneger)/` — manager screens (bottom tabs: overview, repairs, staff, item, profile)
- **Auth gate**: `app/index.tsx` checks Supabase session → `profiles` table for `role`. `Manager` → `(meneger)`, else → `(tabs)`. No session → `(auth)/login`.
- **Role guard** duplicated in `app/(meneger)/_layout.tsx` — redirects non-Manager to `(tabs)`.
- **Tab badges** updated via Supabase realtime subscription on `repair_jobs` table (pending-payment + paid counts).
- **Hidden tab**: `(tabs)/employee` (`href: null`). `(meneger)/edit-profile` (`href: null`).

## Styling

- **NativeWind v4** (Tailwind 3.4). Babel preset `jsxImportSource: "nativewind"`. Metro config wraps `withNativeWind(config, { input: "./global.css" })`.
- **Dark mode** via `class` strategy (`darkMode: "class"`). Custom `useColorScheme` hook.
- **Theme color**: `#D32F2F` / `#DC2626` (crimson red). Defined in `constants/theme.ts` alongside status colors, spacing tokens, and font config.
- **Kanit** is the global font (via `@expo-google-fonts/kanit`). Manager dashboard uses `Prompt-Regular` + `IBMPlexSansThai-Regular` (loaded from `assets/font/`).
- **`global.css`** has aggressive `!important` font-family override with icon-font exclusion selectors — be careful when touching.

## State / data

- **Supabase client** in `lib/supabase.ts` — reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_KEY` env vars.
- **Supabase migrations** in `supabase/migrations/` (4 SQL files: RLS policies + availability-check RPCs).
- **No React Query / SWR** — direct `supabase.from().select()` calls in components.

## Notable deps

- `react-native-reanimated` (worklets via `react-native-worklets`)
- `react-native-gesture-handler`
- `react-native-signature-canvas` + `react-signature-canvas` (signature capture)
- `expo-print` + `expo-sharing` (PDF receipts)
- `expo-image-picker` (slip upload)
- `react-native-gifted-charts` (charts)
- `react-native-element-dropdown`
- `react-native-svg`
- `react-native-webview` (used by signature wrapper)
- `@expo/vector-icons` (Ionicons, Feather)
- `lodash`
- `babel-plugin-react-compiler` (experimental React Compiler)
- `expo-dev-client`
- `expo-image`
- `expo-haptics`

## EAS

- Project ID: `53c66284-b8ad-40ae-85ed-11680d1b823c`
- Profiles: `development` (dev client), `preview` (APK, internal), `production` (auto-increment version)
- `newArchEnabled: true` (Fabric)
