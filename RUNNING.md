# Running Expensly on Android — Complete Guide

## Prerequisites

### Required Software
- **Node.js** (v18+)
- **Java 21** (⚠️ Java 24 breaks CMake/NDK builds — see [Known Issues](#java-24-breaks-native-builds))
- **Android SDK** with emulator, platform-tools, build-tools
- **bun** or **npm** (project has `bun.lock`)

### Environment Variables
Create `.env` in project root (git-ignored):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id
```

**Without this file, the app crashes at startup** — every module importing `services/supabase.ts` throws at load time.

---

## Method 1: Dev Client Build (Current Setup)

Required because the app uses native modules:
- `expo-dev-client`
- `@react-native-google-signin/google-signin`

### Step 1: Pin Java 21

Project has `.mise.toml` that auto-selects Java 21:

```toml
[tools]
java = "21.0.2"
```

Verify:
```bash
cd ~/personal/expensly
mise trust   # first time only
eval "$(mise env)"
java -version   # should show 21.0.2
```

### Step 2: Generate Native Android Project

Only needed once (or after adding new native modules):

```bash
npx expo prebuild --platform android --clean
```

This creates the `android/` directory from `app.json` config.

### Step 3: Start Emulator

```bash
# Set AVD path (if not in default location)
export ANDROID_AVD_HOME=~/.config/.android/avd

# List available AVDs
$ANDROID_HOME/emulator/emulator -list-avds

# Start emulator
$ANDROID_HOME/emulator/emulator -avd Pixel_9_API_36 &

# Wait for boot
adb wait-for-device
adb shell getprop sys.boot_completed   # should return "1"
```

### Step 4: Build & Install Dev Client APK

```bash
eval "$(mise env)"
npx expo run:android
```

First build takes ~5 minutes. Subsequent builds are faster (cached).

This:
1. Builds the APK at `android/app/build/outputs/apk/debug/app-debug.apk`
2. Installs it on the emulator
3. Starts Metro bundler
4. Opens the app

### Step 5: Network Setup for Emulator

The emulator can't reach `localhost:8081` directly. Two things needed:

**A) Reverse port forwarding** (run once per emulator session):
```bash
adb reverse tcp:8081 tcp:8081
```

**B) Start Metro with LAN host:**
```bash
npx expo start --dev-client --host lan
```

**C) Open app with correct URL:**
```bash
adb shell am force-stop com.moniya.expensly
adb shell am start -a android.intent.action.VIEW \
  -d "exp+expensly://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081" \
  com.moniya.expensly
```

> `10.0.2.2` is the emulator's special alias for the host machine's `localhost`.

### Step 6: Reload After Code Changes

```bash
# If Metro is running, just reload the app:
adb shell input keyevent 82   # opens dev menu
# Or force stop and relaunch:
adb shell am force-stop com.moniya.expensly
adb shell am start -n com.moniya.expensly/.MainActivity
```

---

## Method 2: Expo Go (Not Currently Possible)

The app **cannot run in Expo Go** because of:
- `expo-dev-client` — requires native dev launcher
- `@react-native-google-signin/google-signin` — native module not in Expo Go

To enable Expo Go support, you'd need to:
1. Remove `@react-native-google-signin/google-signin`
2. Remove `expo-dev-client`
3. Use Supabase's built-in OAuth instead (`supabase.auth.signInWithOAuth`)
4. Run `npx expo prebuild --platform android --clean` again

---

## Running on Physical Android Device

### Via USB
1. Enable **Developer Options** → **USB Debugging** on phone
2. Connect via USB
3. `adb devices` should show your device
4. Same steps as emulator, but use `--device` flag:
   ```bash
   npx expo run:android --device
   ```

### Via Wireless (no USB cable)
1. Connect device and host to same WiFi
2. Start Metro: `npx expo start --dev-client --host lan`
3. Find your host IP: `hostname -I`
4. Open the Expo dev client app on phone and enter: `http://<your-ip>:8081`

---

## Debugging

### Check App Logs
```bash
# Get app process ID
pid=$(adb shell pidof com.moniya.expensly)

# View JS console logs
adb logcat -d --pid=$pid | grep "ReactNativeJS"

# View all app logs (filter out noise)
adb logcat -d --pid=$pid | grep -v "Finsky" | grep -v "HWUI"
```

### Take Screenshot
```bash
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png /tmp/screenshot.png
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Missing Supabase environment variables` | No `.env` file | Create `.env` with Supabase credentials |
| `restricted method in java.lang.System` | Java 24 | Switch to Java 21 via `.mise.toml` |
| `Couldn't connect to ws://10.0.2.2:8081` | Metro not reachable from emulator | Run `adb reverse tcp:8081 tcp:8081` |
| App shows loading forever | Metro URL wrong or not running | Use `--host lan` + `10.0.2.2` URL |
| `Route is missing the required default export` | Cascading failure from Supabase error | Fix `.env` first |
| Expo Go shows nothing on QR scan | Native modules incompatible | Use dev client build instead |

---

## Known Issues

### Java 24 Breaks Native Builds

Java 24 restricts `java.lang.System` methods that CMake/NDK rely on. Symptoms:
```
Execution failed for task ':expo-modules-core:configureCMakeDebug[arm64-v8a]'.
> WARNING: A restricted method in java.lang.System has been called
```

**Fix:** Pin Java 21 in `.mise.toml` (already done in this project).

### expo-av Deprecated

```
[expo-av]: Expo AV has been deprecated and will be removed in SDK 54.
Use the expo-audio and expo-video packages to replace the required functionality.
```

Migrate to `expo-audio` and `expo-video` before upgrading to SDK 55.

### setLayoutAnimationEnabledExperimental No-op

```
setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture.
```

Harmless warning from React Native Reanimated with New Architecture enabled.

---

## Quick Reference Commands

```bash
# Full reset & run
cd ~/personal/expensly
eval "$(mise env)"
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client --host lan

# In another terminal - launch app
adb shell am force-stop com.moniya.expensly
adb shell am start -a android.intent.action.VIEW \
  -d "exp+expensly://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081" \
  com.moniya.expensly

# Watch logs
pid=$(adb shell pidof com.moniya.expensly)
adb logcat --pid=$pid | grep "ReactNativeJS"

# Rebuild native (after adding native modules)
npx expo prebuild --platform android --clean
npx expo run:android
```

---

## Project Structure (Relevant Files)

```
expensly/
├── .env                    # Supabase + Google credentials (git-ignored)
├── .mise.toml              # Pins Java 21
├── app.json                # Expo config (plugins, splash, icons)
├── app/
│   ├── _layout.tsx         # Root layout with auth routing
│   ├── index.tsx           # Entry point, redirects based on auth
│   ├── (auth)/             # Login/welcome screens
│   ├── (tabs)/             # Main app tabs
│   ├── onboarding/         # Name + budget setup
│   └── transaction/        # Add transaction
├── services/
│   └── supabase.ts         # Supabase client (reads EXPO_PUBLIC_* env vars)
├── stores/
│   └── authStore.ts        # Zustand auth state management
└── android/                # Generated native project (from prebuild)
```
