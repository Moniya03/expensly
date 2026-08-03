# Expensly — Design System

Source of truth: `constants/theme.tsx` (palettes, spacing, typography, radius, theme state) plus component-level brand colors documented below.

---

## 1. Color Palettes

Two modes — **dark (default)** and **light**. Toggle lives at Settings → Appearance → Dark mode; the preference persists in AsyncStorage (`expensly:theme-mode`).

### Dark palette (default)

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#1A6BFF` | Accents, active states, primary buttons |
| `secondary` | `#4D9FFF` | Gradient end, secondary accents |
| `tertiary` | `#2DE2FF` | Rare accent (rings, highlights) |
| `surface` | `#0b0e14` | App background |
| `surfaceContainer` | `#161a21` | Cards, tab bar, inputs |
| `surfaceContainerHigh` | `#1c2028` | Elevated surfaces |
| `surfaceContainerHighest` | `#22262f` | Switches, pressed states |
| `onSurface` | `#ecedf6` | Primary text |
| `onSurfaceVariant` | `#a9abb3` | Secondary text, placeholders |
| `outline` | `#73757d` | Borders |
| `outlineVariant` | `#45484f` | Hairlines, dividers |
| `error` | `#ff716c` | Errors, danger, negative amounts |

### Light palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#1A6BFF` | Same brand blue |
| `secondary` | `#2E86FF` | Gradient end |
| `tertiary` | `#00A8CC` | Rare accent |
| `surface` | `#F6F7FB` | App background |
| `surfaceContainer` | `#FFFFFF` | Cards, tab bar |
| `surfaceContainerHigh` | `#EDEFF5` | Elevated surfaces |
| `surfaceContainerHighest` | `#E2E5EE` | Switches, pressed states |
| `onSurface` | `#0E1320` | Primary text |
| `onSurfaceVariant` | `#5A6072` | Secondary text |
| `outline` | `#8B90A0` | Borders |
| `outlineVariant` | `#D8DBE4` | Hairlines, dividers |
| `error` | `#D94343` | Errors, danger |

---

## 2. Gradients

| Gradient | Colors | Where |
|---|---|---|
| **Brand** | `#1A6BFF → #4D9FFF` (135°) | Splash, onboarding, hero accents, VoiceFAB, spinner |
| **Hero card** | `#123C86 → #0F2F63 → #0B223F → #0A191D` | Home HeroBudgetCard, Profile hero card |
| **Floating particles** | `#2E86FF, #6FB4FF` | Welcome screen bubbles |

> Hardcoded by design — brand gradients stay identical in both theme modes (they sit on dark imagery or are themselves dark).

---

## 3. Typography

Font family: **Plus Jakarta Sans** (bundled via expo-font).

| Token | Value |
|---|---|
| regular / medium / semiBold / bold | 400 / 500 / 600 / 700 |
| fontSize | xs `12`, sm `14`, md `16`, lg `18`, xl `20`, xxl `24`, xxxl `32` |
| lineHeight | tight `1.2`, normal `1.5`, relaxed `1.75` |

---

## 4. Spacing & Radius

| Spacing | Value | Radius | Value |
|---|---|---|---|
| xs | 4 | sm | 8 |
| sm | 8 | md | 16 |
| md | 16 | lg | 24 |
| lg | 24 | xl | 32 |
| xl | 32 | full | 9999 (pills) |
| xxl | 48 | | |

---

## 5. Expense Categories

From `constants/categories.ts` (icon + label + color). Icon chips render each category on its color at low opacity.

| Category | Icon color |
|---|---|
| food | `#A9ABB3` |
| transport | `#FF3B30` |
| shopping | `#FFCC00` |
| entertainment | `#1A6BFF` |
| bills | `#A9ABB3` |
| health | `#A9ABB3` |
| education | `#1A6BFF` |
| other | `#A9ABB3` |

---

## 6. Goal Icons

### Preset library (8, `components/goals/goalMeta.ts`)

Each goal card derives `tint` (darkened gradient background) + `accent` (ring/icon color) from its icon.

| Icon | Label | Accent | Tint |
|---|---|---|---|
| briefcase-outline | Work | `#4D9FFF` | `#13294e → #0f2038` |
| airplane-outline | Travel | `#B48CFF` | `#3a1f5c → #291544` |
| home-outline | Home | `#2DE2FF` | `#0e3a3a → #0b2a2a` |
| car-sport-outline | Car | `#F5A623` | `#3d2a12 → #2e1f0c` |
| school-outline | Study | `#F472B6` | `#3d1f4a → #2d1536` |
| medkit-outline | Health | `#FF716C` | `#3d1720 → #2d0f17` |
| heart-outline | Love | `#FB7185` | `#3d1526 → #2d0e1b` |
| film-outline | Entertainment | `#A78BFA` | `#1f1f3d → #16162d` |

### Custom icon swatches (12, `GoalIconBuilder.tsx`)

`#4D9FFF` blue · `#B48CFF` purple · `#FB7185` pink · `#F472B6` magenta · `#F5A623` orange · `#FF716C` red · `#2DE2FF` cyan · `#34C759` green · `#FACC15` yellow · `#A78BFA` indigo · `#14B8A6` teal · `#A16207` brown

Custom icons stored per-user in `user_goal_icons` (icon_name, label, color); goal cards resolve `tint = darken(color, 0.22→0.13)`, `accent = color`. Colors are normalized to 6-digit hex so the `#RRGGBB1F` alpha-suffix trick works for chip backgrounds.

---

## 7. Theming Architecture

- `ThemeProvider` wraps the app (`app/_layout.tsx`); hydrates mode from AsyncStorage before first render to avoid a flash.
- `useColors()` → active palette; `useThemeMode()` → `{ mode, setMode, toggleMode }`.
- **Styles must be theme-reactive:** module-scope `StyleSheet.create` freezes colors at import time, so every color-bearing file uses the pattern:

```tsx
const colors = useColors();
const styles = useMemo(() => createStyles(colors), [colors]);

const createStyles = (colors: Colors) =>
  StyleSheet.create({ /* ... colors.* ... */ });
```

- Static (non-theme) modules — `categories.ts`, brand gradients, goal tint/accent maps — intentionally keep hardcoded hex values.
- StatusBar style flips with mode (`dark` content on light theme, `light` content on dark).

---

## 8. Shared UI Components

| Component | Notes |
|---|---|
| `Input` | Label + error + multiline + containerStyle |
| `AmountInput` | ₹ prefix, integer-only flag, maxLength 10 |
| `DatePicker` | value/onChange, `allowFutureDates` (default false), inline year scroller |
| `GoalIconPickerRow` | 8 presets + user custom pills + "+" builder, long-press to edit |
| `GoalIconBuilder` | Search-free curated 52-icon grid, label (24 max), 12 swatches + hex input, live preview |
| `ProgressRing` | react-native-svg stroke-dashoffset ring, 700ms `withTiming` fill |
| `GlassmorphicCard` | Frosted card (voice flow) |
| `GradientText` | Text filled with the brand gradient |
| `AudioWaveform` | Live recording bars (voice flow) |
| `FloatingParticles` | 6 (Android) / 10 (iOS) bubbles, 4–8px, 35–65% opacity |

---

## 9. Motion

- Animations use **reanimated v4**; the goal popup/expand/card/celebration are timing-based (`withTiming` + `Easing.out(cubic)`) — deliberately **no springs** for "pop without bounce".
- Progress rings spring-fill; percentages count up; the "+" goal button pulses.
- Reanimated timing callbacks run on the UI thread — state updates inside them must be wrapped in `runOnJS`.

---

## 10. Amounts & Dates

- Money stored in **paise** (integers); display via `formatRupees` (Indian formatting: `₹1,234`, compact `1.2K` / `12L`).
- Dates stored as `YYYY-MM-DD`; `toLocalDateString` / `parseLocalDate` are local-time safe (no UTC drift).
- Voice-transcribed transactions get the server-stamped IST date (`Asia/Kolkata`); the model may never invent dates.
