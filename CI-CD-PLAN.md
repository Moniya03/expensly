# Expensly CI/CD Plan — APK Releases + EAS OTA Updates

Status: **approved** (grilled 2026-08-05). Implementation order at the bottom.

## Decisions (from the grilling session)

| # | Decision | Choice |
|---|---|---|
| 1 | Build runner | Native builds on **GitHub Actions runners**, OTA via **EAS Update** |
| 2 | Distribution | **Public repo** (Moniya03/expensly), APKs as **GitHub Releases** on the same repo |
| 3 | Triggers | **Version bump in PR = native APK release**; **any main push = instant OTA**; manual `workflow_dispatch` buttons on both |
| 4 | Signing | Reuse existing keystore `/home/moniya/personal/projects/expensly/expensly-release.keystore` (alias `expensly`, SHA-1 `5F:BD:39:…:AC:1B` — already registered in Google Cloud, verified against installed release APKs) |
| 5 | APK variants | **All ABI splits**: `arm64-v8a` + `armeabi-v7a` + `x86_64` + universal |
| 6 | PR checks | **Biome** (lint+format) + `tsc --noEmit` + `expo lint` |
| 7 | Update UX | Background check on load (instant launch, update applies next launch) |
| 8 | Release notes | Auto-generated from commits (GitHub `generate_release_notes`) |

## Topology

```
push to main
├── touches app/ (except package.json) ──► ota-publish.yml ──► eas update → u.expo.dev
│                                            │                  (only served to matching fingerprint)
│                                            └─ fingerprint guard: fail loudly if native
│                                               changed without a version bump
└── bumps package.json version ────────────► release-mobile.yml ──► prebuild + gradle
                                             │  ─ 4 ABI-split APKs (signed w/ Expensly keystore)
                                             └─► GitHub Release vX.Y.Z (auto changelog)
```

- **OTA (≈95% of work)**: JS/TS/UI changes reach users minutes after merge, no reinstall.
- **Native (~1×/month)**: version bump only. One-time cost of ~38-min gradle build per release.
- EAS serves an update **only to binaries whose runtime fingerprint matches** — a JS-only
  OTA can never land on an incompatible binary. That safety is built into EAS, which is why
  we don't need the self-hosted Xavia + code-signing cert machinery at all.

## Current-state facts (surveyed, not assumed)

- Expo SDK 54, RN 0.81.5, React 19.1, TS 5.9, newArch on. CNG mode (`android/` gitignored ✅).
- `expo-updates` **not installed** → wiring it is a one-time native change (first release
  after wiring is a fresh APK; existing installed APKs upgrade in place — same signature,
  higher versionCode — and start receiving OTAs).
- `eas.json` exists with projectId `96abc31b-76f0-42c0-bd57-4dc984730ec3` ✅ (no changes needed).
- No `.github/`, no lint/typecheck/test scripts today.
- `.env` (gitignored) carries `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
  `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` → must become GH Actions secrets (inlined at bundle time).

## Repo changes

### 1. `app.json` — updates block (the only native config change)

```json
"runtimeVersion": { "policy": "fingerprint" },
"updates": {
  "enabled": true,
  "url": "https://u.expo.dev/96abc31b-76f0-42c0-bd57-4dc984730ec3",
  "checkAutomatically": "ON_LOAD",
  "fallbackToCacheTimeout": 0
}
```

(`expo-updates`' config plugin auto-applies at prebuild; no explicit plugin entry needed.)
Install: `bunx expo install expo-updates`.

### 2. `package.json` — scripts

```json
"lint": "biome check .",
"format": "biome check --write .",
"check-types": "tsc --noEmit",
"lint:expo": "expo lint",
"clean:android": "rm -rf android/.gradle android/build android/app/build android/app/.cxx",
"apk:release": "bun run clean:android && cd android && ./gradlew assembleRelease",
"android:preflight": "node scripts/preflight-signing.js"
```

devDeps: `@biomejs/biome` (^2.4), `eslint` + `eslint-config-expo` (for `expo lint`).
New files: `biome.json` (tabs/lineWidth 80 default, `organizeImports` on — no legacy
eslint/prettier config exists, so zero migration churn), `scripts/patch-build-gradle.js`,
`scripts/preflight-signing.js`.

### 3. `scripts/patch-build-gradle.js` (committed, runs after prebuild)

Patches the **generated** `android/app/build.gradle` (never committed — CNG keeps
`android/` gitignored so it stays out of the fingerprint):

1. **Signing** — load `android/keystore.properties` (created by CI from secrets),
   add `signingConfigs.release`, point the release buildType at it.
   No-op locally when `keystore.properties` is absent (debug signing kept);
   **exits 1** when present but unpatched (CI never silently debug-signs).
2. **ABI splits** — add the splits block so `assembleRelease` emits
   `app-arm64-v8a-release.apk`, `app-armeabi-v7a-release.apk`,
   `app-x86_64-release.apk`, `app-universal-release.apk`.

### 4. `scripts/preflight-signing.js` (fast-fail before the 38-min build)

Decrypts the key via the `KeyStore.getKey()` API (the exact AGP mechanism —
`keytool -list`/`-importkeystore` lie about key passwords). Prints `key password OK`
or exits 1 with a clear message. Catches wrong GitHub secrets in ~2 s, not 38 min.

### 5. `.githooks/pre-push` (optional but cheap)

Blocks direct pushes to `main` (server-side branch protection is paywalled on free
private repos; repo is public so rulesets also work — hook covers local users).
Enable: `git config core.hooksPath .githooks`.

## Workflows (`.github/workflows/`)

### `ci.yml` — PR gate (required check)

`pull_request → main` + `push → main`. `concurrency: cancel-in-progress: true`.
Steps: checkout → setup-bun → `bun install --frozen-lockfile` → `bun run lint`
→ `bun run lint:expo` → `bun run check-types`.
First run WILL flag pre-existing drift — fix via `bun run format` in one PR (feature).

### `release-mobile.yml` — version-gated native release

Triggers: `push → main` on `package.json` + `workflow_dispatch`.
`concurrency: release-mobile, cancel-in-progress: false`.

**Jobs:**

1. **detect-version** (`fetch-depth: 2`): compare HEAD vs HEAD~1 `package.json` version
   → outputs `version`, `changed`.
2. **build** (gated `changed == 'true' || workflow_dispatch`):
   - setup-java 17 (zulu) + setup-bun → `bun install`
   - **Version sync** (must match ota-publish exactly — version+versionCode are hashed):
     `VERSION=$(jq -r '.version' package.json)`;
     `VERSION_CODE=$((10#$(echo "$VERSION" | tr -d '.')))`; jq-write both into app.json.
   - **Fingerprint**: `node_modules/.bin/fingerprint fingerprint:generate --platform android`
     → `steps.fingerprint.outputs.fingerprint` (use the package's own `.bin`, not require())
   - `bunx expo prebuild --platform android`
   - **Signing**: write `android/app/keystore.jks` from `ANDROID_KEYSTORE_BASE64` +
     `android/keystore.properties` from secrets → `node scripts/patch-build-gradle.js`
   - **Preflight** `node scripts/preflight-signing.js` (fast fail)
   - **Gradle memory tune** (post-prebuild, same job):
     `sed -i 's/org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx3g -XX:MaxMetaspaceSize=1g/' android/gradle.properties`
     (GRADLE_OPTS cannot override `org.gradle.jvmargs`; prebuild's 512m metaspace OOMs on runners)
   - `bun run apk:release` (NO clean between builds — no AAB needed, single assembleRelease
     emits all 4 splits)
   - upload-artifact: the 4 split APKs.
3. **release** (contents: write): download artifact (nested paths!), create release
   `v$VERSION` on the **same repo** via `softprops/action-gh-release@v3` with
   `generate_release_notes: true`, body starts with `Fingerprint: <fp>`, files = 4 APKs.

### `ota-publish.yml` — JS-only updates to EAS

Triggers: `push → main` on `app/**` **except** `package.json` + `workflow_dispatch`.
`concurrency: ota-publish, cancel-in-progress: true`.

Steps:
1. checkout (`fetch-depth: 2`) → setup-bun → `bun install`
2. **Version sync** — byte-identical to release-mobile.yml (fingerprint hash includes version)
3. **Skip if native release in flight**: HEAD~1 version ≠ HEAD version → exit 0
   (a native release is being built; its new fingerprint legitimately differs)
4. **Fingerprint** (same command as release-mobile)
5. **Guard**: fetch `releases/latest` body via API, extract `Fingerprint: <40-hex>`.
   - no fingerprint in body → error: "a native release must land first"
   - mismatch → error: "Fingerprint changed without a version bump — bump
     package.json (native change needs a new APK)"
   - match → proceed. (EAS would silently no-op on mismatch; the guard makes it loud.)
6. Write `.env` from secrets (Supabase + Google web client ID — inlined at export time)
7. `npx eas-cli update --channel production --message "<commit message>" --non-interactive`
   (auth: `EXPO_TOKEN` secret). EAS computes the export fingerprint from the same
   tree state and serves it only to matching binaries.

## GitHub Actions secrets (set once, never printed)

| Secret | Source |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 /home/moniya/personal/projects/expensly/expensly-release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore store password |
| `ANDROID_KEY_PASSWORD` | key password (likely = store password — preflight will tell) |
| `ANDROID_KEY_ALIAS` | `expensly` |
| `EXPO_TOKEN` | create at https://expo.dev/settings/access-tokens |
| `EXPO_PUBLIC_SUPABASE_URL` | from local `.env` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | from local `.env` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | from local `.env` |

Setup runs as a local script (`scripts/set-github-secrets.sh`) that reads the keystore
and `.env` from disk and pipes into `gh secret set` — **passwords never appear in chat,
shell history, or CI logs** (all GH secrets are masked automatically).

## First-run order (prove the loop)

1. Install `expo-updates`, add app.json updates block → PR (also lands biome.json +
   scripts + workflows). ci.yml must be green. **Do NOT bump the version yet** (see #3).
2. Set the 8 secrets via `scripts/set-github-secrets.sh`. Verify: `gh secret list`.
3. **Backfill the release body**: patch the latest existing release with
   `Fingerprint: <fp computed from current main>` so the OTA guard has a source of truth
   (or run `workflow_dispatch` on release-mobile once with current version — manual
   rebuild path covers this).
4. Bump `package.json` 1.1.0 → 1.2.0 in a PR → merge → release-mobile.yml fires →
   verify 4 split APKs + `Fingerprint: <40-hex>` in the release body, signatures match
   the Expensly keystore.
5. Make a JS-only change (e.g. a string in `app/`) → merge → ota-publish.yml fires →
   guard passes → `eas update` publishes. Verify on device: install the new APK, relaunch,
   see the JS change arrive without reinstalling.
6. Test the guard: touch a native-affecting file (e.g. app.json icon) WITHOUT bumping →
   workflow must fail loudly with the "bump the version" message.

## Ops playbook (handover)

- **Bump policy**: bump the version ONLY for native changes — anything shifting the
  fingerprint (new native-code packages, SDK/RN upgrades, native app.json fields,
  icons/splash, plugins, lockfile native deps, .gitignore). Everything else ships via OTA.
  Never bump to ship a JS fix.
- **versionCode trap** (digits-of-version scheme): `1.10.0` → 1100, then `2.0.0` → 200
  DECREASES. When approaching `1.10.x`, switch to a plain counter or jump majors carefully.
- **Rollback**: EAS dashboard (u.expo.dev project page) → revert to previous update.
  APK rollback = re-release the previous tag (workflow_dispatch + old version).
- **Backups**: keystore file + base64 + both passwords + alias in the password manager
  (keystore currently only lives at `/home/moniya/personal/projects/expensly/`).
  Losing it = existing installs can never be upgraded. `EXPO_TOKEN` also backed up.
- **Secrets inventory**: the 8 secrets above; `gh secret list` shows names only.
- **First Play Store release (future)**: build AAB separately, upload with the same
  keystore as the upload key; debug-signed sideload installs must reinstall once.

## Known costs / gotchas (from the skill's production failure catalog, mapped)

- First `eas update` needs a release whose fingerprint matches → step 3 of first-run order.
- `download-artifact@v4` restores nested paths (`apk/release/…`) — `files:` globs must
  match them or the release ships with 0 assets.
- Prebuild regenerates `gradle.properties` every run → memory tune must run post-prebuild
  in the same job, every job.
- `.env` must be materialized in both workflows (bundle-time inlining).
- Expo SDK 54's prebuild layout may drift in future SDKs — `patch-build-gradle.js` regexes
  fail loudly rather than silently debug-sign (that's by design, fix anchors not guard).

## Implementation order

1. `bunx expo install expo-updates` + app.json updates block
2. Add devDeps + scripts + `biome.json` (run `bun run format` once → one cleanup PR)
3. `scripts/patch-build-gradle.js` + `scripts/preflight-signing.js`
4. `.github/workflows/ci.yml` → green on PR
5. `scripts/set-github-secrets.sh` → set secrets
6. `.github/workflows/release-mobile.yml` + `ota-publish.yml` → YAML lint, first-run order
7. Backfill fingerprint, prove the loop, hand over playbook
