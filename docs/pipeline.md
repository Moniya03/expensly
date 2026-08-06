# Pipeline Architecture

```
                        ┌───────────────────────┐
    PR / push to main   │   ci.yml              │  Biome lint + expo lint + tsc
  ────────────────────► │   (every PR + push)   │  ~30 s, cancel-in-progress
                        └───────────────────────┘
                                        │
   main push, package.json changed      │        main push, JS code changed
        (or manual dispatch)            │        (or manual dispatch)
                                        ▼
        ┌───────────────────────────────┴────────────────────────────┐
        ▼                                                            ▼
┌───────────────────────┐                                  ┌───────────────────────┐
│ release-mobile.yml    │                                  │ ota-publish.yml       │
│ 1. detect-version     │                                  │ 1. version sync       │
│ 2. build 4 signed APK │                                  │ 2. skip if bump        │
│ 3. GitHub Release     │                                  │ 3. fingerprint guard  │
└───────────────────────┘                                  │ 4. eas update prod    │
        │                                                  └───────────────────────┘
        │ fingerprint in release body                               │
        └──────────────────────►  EAS Update (u.expo.dev) ◄─────────┘
                                  serves JS only to binaries
                                  with a matching fingerprint
```

## Trigger matrix

| Event | `ci.yml` | `release-mobile.yml` | `ota-publish.yml` |
|---|---|---|---|
| PR to `main` | ✅ | — | — |
| Push to `main` (any code) | ✅ | — | ✅ if JS-only paths |
| Push to `main` touching `package.json` | ✅ | ✅ (if version changed vs HEAD~1) | — (skip logic also guards) |
| `workflow_dispatch` (manual) | — | ✅ | ✅ |

Concurrency: `ci` and `ota-publish` cancel in-progress runs (a newer push
supersedes); `release-mobile` never cancels (a release build must complete).

---

## `ci.yml` — the PR gate

- **Triggers:** `pull_request` to `main`, `push` to `main`. Read-only permissions.
- **Steps:** checkout → `setup-bun` → `bun install --frozen-lockfile` →
  `bun run lint` (Biome) → `bun run lint:expo` → `bun run check-types`.
- **Design notes**
  - `--frozen-lockfile` means `bun.lock` must be in sync with `package.json` —
    the first failure mode people hit after adding a dependency.
  - Biome handles format + lint in one pass. It was tuned in `biome.json` to
    the existing style (2-space indent, single quotes, semicolons,
    lineWidth 100) so the format-churn PR was minimal and is now zero.
  - Two lint rules are disabled deliberately: `useExhaustiveDependencies`
    (RN hooks legitimately omit deps, e.g. reanimated shared values) and
    `noArrayIndexKey` (static lists that never reorder). Both were noise, not
    bugs.
  - `expo lint` (ESLint + eslint-config-expo) is kept alongside Biome because
    Expo only documents ESLint — Biome covers style, ESLint covers
    Expo-specific rules.

## `release-mobile.yml` — native APK release

**Triggers:** `push` to `main` with `paths: ["package.json"]` (a version bump),
or manual `workflow_dispatch`.

### Job 1: `detect-version`
- `git show HEAD~1:package.json` vs current `package.json` version.
- Outputs `version` and `changed` (`true` if the version differs). Manual
  dispatch forces `changed=true` implicitly via the job-level gate.

### Job 2: `build` (gated on `changed == 'true' || workflow_dispatch`)
1. **Checkout + toolchains** — `setup-java` zulu 17 (AGP requirement),
   `setup-bun`.
2. **Version sync** — reads `version` from `package.json` and rewrites
   `app.json`:
   ```bash
   VERSION_CODE=$((10#$(echo "$VERSION" | tr -d '.')))
   # 1.2.0 → 120, 1.10.0 → 1100. The 10# prefix forces base-10 so "010" is
   # never parsed as octal.
   jq '.expo.version=$v | .expo.android.versionCode=$vc' app.json
   ```
   ⚠️ **Monotonicity trap:** digits-of-version only grows while the first
   digit is stable. `1.10.0 → 1100`, then `2.0.0 → 200` — *decreases*. When
   approaching `1.10.x`, switch to a plain counter or bump majors carefully
   (see [troubleshooting.md](troubleshooting.md#versioncode-decreases)).
3. **Fingerprint** — `node_modules/.bin/fingerprint fingerprint:generate
   --platform android | jq -r .hash` → 40-hex hash of the whole JS+native
   config surface. This is the value embedded in the APK at build time and
   compared by the OTA guard. Must be computed **before** `expo prebuild`
   (prebuild would add a fresh `android/` dir and change the hash).
4. **`.env` materialization** — the 3 `EXPO_PUBLIC_*` secrets are written to
   `.env` (they are inlined into the JS bundle at export time; without them
   the build would be a broken app with no Supabase config).
5. **`expo prebuild --platform android`** — CNG: generates the native
   `android/` project fresh (it's gitignored).
6. **Signing configuration**:
   - `ANDROID_KEYSTORE_BASE64` → `android/app/keystore.jks`
   - writes `android/keystore.properties` (storeFile, storePassword, keyAlias,
     keyPassword)
   - `node scripts/patch-build-gradle.js` — patches the generated
     `build.gradle`: injects the `keystore.properties` loader at the top of
     the `android {}` block, replaces the generated `release` signingConfig
     (which reads props from the wrong directory) and points the release
     buildType at `signingConfigs.release` **unconditionally**. Also injects
     the ABI splits block (`arm64-v8a`, `armeabi-v7a`, `x86_64` +
     `universalApk true`). Idempotent; fails loudly (exit 1) on any anchor
     mismatch so CI never silently ships a debug-signed build.
   - `node scripts/preflight-signing.js` — fast-fail check **before** the
     ~38 min gradle build: verifies `keytool -list -v` succeeds against
     `android/app/keystore.jks` with the store password and alias, and that
     `keyPassword == storePassword` (PKCS12 truth: keytool-generated PKCS12
     keystores have no separate key password). Catches wrong secrets in
     seconds instead of 38 minutes.
   - If `ANDROID_KEYSTORE_BASE64` is missing, the build **fails** — a
     debug-signed release is never acceptable because existing installs would
     refuse to upgrade over it (signature mismatch).
7. **Gradle memory tune** — `sed` on `android/gradle.properties`:
   `-Xmx3g -XX:MaxMetaspaceSize=1g`. `GRADLE_OPTS` can't override
   `org.gradle.jvmargs`; the prebuild default (512m metaspace) OOMs on GitHub
   runners.
8. **`bun run apk:release`** — cleans gradle dirs, runs `gradlew
   assembleRelease` → 4 APKs in `android/app/build/outputs/apk/release/`:
   - `app-arm64-v8a-release.apk` (modern phones)
   - `app-armeabi-v7a-release.apk` (older 32-bit)
   - `app-x86_64-release.apk` (emulators)
   - `app-universal-release.apk` (all ABIs, for sideload convenience)
9. **Upload artifact** — `actions/upload-artifact@v4` roots the artifact at
   the **least common ancestor** of the upload paths, so the 4 APKs land flat
   in the artifact (not nested under `apk/release/`). `if-no-files-found:
   error` so a missing split fails loudly instead of shipping 3 APKs.

### Job 3: `release` (gated the same, needs build)
- `actions/download-artifact@v4` → `release-files/`
- `softprops/action-gh-release@v3`: tag `v$VERSION`, name
  `Release v$VERSION`, body starts with:
  ```
  Fingerprint: <40-hex>
  ```
  plus the 4 APK file list and `generate_release_notes: true` (auto changelog
  from merged commit messages).
- The `Fingerprint:` line is the anchor the OTA guard greps for — **never
  remove it** from the release body.

## `ota-publish.yml` — OTA update

**Triggers:** `push` to `main` with `paths:` covering JS-only surfaces
(`app/**`, `components/**`, `hooks/**`, `stores/**`, `services/**`,
`utils/**`, `constants/**`, `types/**`, `assets/**`, `babel.config.js`,
`tsconfig.json`, `index.ts`) — **not** `package.json`. Or manual
`workflow_dispatch`.

### Steps
1. **Version sync** — identical to release-mobile. The version and versionCode
   are hashed into the fingerprint; if they drifted from what the binary was
   built with, every installed app would reject the update.
2. **Skip if a native release is in flight** — compares `HEAD~1` vs `HEAD`
   package.json version; if the version was just bumped, writes
   `skip=true` and the remaining steps are gated off (`if:
   steps.skip.outputs.skip != 'true'`). The bump commit itself is handled by
   release-mobile; a second OTA run for the same fingerprint would be dead
   weight.
3. **`.env` materialization** — same 3 secrets → `.env` (bundled JS must have
   the same env as the binary).
4. **Fingerprint** — same command as release-mobile. This is the fingerprint
   EAS will compare against installed binaries.
5. **Guard** — fetches `releases/latest` body from the GitHub API and greps
   for `Fingerprint: <40-hex>`:
   - no line → error: *"a native release must land first"* (backfill the body
     or run release-mobile once)
   - mismatch → error: *"fingerprint changed without a version bump"* —
     a native-affecting change went out without an APK; every installed app
     would reject the update. Fix: bump `package.json`, merge, let
     release-mobile run.
   - match → proceed.
6. **Publish** — `npx eas-cli@latest update --channel production --platform
   android --message "<commit subject>" --non-interactive` with `EXPO_TOKEN`.
   EAS Update itself gates by fingerprint: an update whose fingerprint doesn't
   match any installed binary is simply never served, so the guard exists to
   make that silent no-op *loud* in CI.

### Why the guard exists
EAS would accept a mismatched update silently — it just wouldn't serve it to
anyone, and the failure would only surface as "users aren't getting updates".
The guard converts that into a red CI run with an actionable error message.
