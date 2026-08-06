# Release Runbook

## When to bump the version

Only bump `package.json` for changes that shift the **runtime fingerprint** —
i.e. anything native or build-config-level:

- native dependencies (anything in `expo install` that has an `android/`
  counterpart, new Expo modules, RN itself)
- `app.json` / `app.config.js` changes (plugins, icons, package name, the
  `updates` block itself)
- `package.json` dependency *versions* (hashed into the fingerprint) — though
  for pure-JS deps an OTA alone is usually fine
- config files: `babel.config.js`, `tsconfig.json`, `metro.config.js`
- **Not** for plain JS logic fixes — those go out via OTA in minutes.

Rule of thumb: *if the change would be invisible without a reinstall, bump.*
JS code you can ship over the air; native bits you can't.

## How to release

1. **Bump `package.json`** in a normal PR (e.g. `1.2.0`). Don't touch
   `app.json` — CI syncs `version` and `versionCode` from `package.json`
   automatically (`1.2.0 → versionCode 120`).
2. **Merge the PR.** CI runs the gates; then `release-mobile.yml` fires:
   - detects the version change (`HEAD~1` vs `HEAD`)
   - builds and signs the 4 ABI-split APKs with the Expensly keystore
   - creates a GitHub Release `v1.2.0` with the fingerprint line + auto
     changelog
3. **Wait for the green run** (~35–40 min). Watch it at
   Actions → Release Mobile. The `preflight-signing` step runs early — if the
   keystore secrets are wrong you'll know within 2 minutes, not 40.
4. **Verify** (see below).

## Manual release (no version bump)

Useful for the first release (no `Fingerprint:` anchor exists yet) or to
rebuild identical code:

1. Actions → **Release Mobile** → **Run workflow** → run.
2. The release job tags `v<current version>`. If that tag/release already
   exists, delete it first (Releases → the release → Delete) or it will fail.

## Verifying a release

```bash
# Download one of the APKs and check the signing cert
curl -sL -o /tmp/app.apk \
  https://github.com/Moniya03/expensly/releases/latest/download/app-arm64-v8a-release.apk
# Signature must show CN=Expensly, SHA-1 5F:BD:39:17:37:B6:15:8C:2E:2B:D3:38:6B:9D:87:EB:B4:80:AC:1B
apksigner verify --print-certs /tmp/app.apk

# Release body must start with "Fingerprint: <40-hex>"
gh release view --repo Moniya03/expensly

# Sanity: install on a device with the old version installed — it must
# upgrade in place (same signature, higher versionCode), not fail with
# INSTALL_FAILED_UPDATE_INCOMPATIBLE.
adb install -r /tmp/app.apk
```

## Rollback

- **APK rollback:** re-release the previous tag. The old release still has
  its assets; a new release pointing at the same tag with the old APKs (or
  simply tell users to install the previous release's APK) works because
  signatures match. Only a *new* versionCode can be installed over an
  existing install — so rollback to an older versionCode requires an
  uninstall/reinstall (or a forward-fix release).
- **OTA rollback:** see [ota.md](ota.md#rollback) — done from the EAS
  dashboard, no new build needed.

## Local release builds

```bash
bun run apk:release   # = clean gradle dirs + gradlew assembleRelease
```

Without `android/keystore.properties` this produces a **debug-signed** APK —
fine for local testing, never for distribution (existing installs will refuse
to upgrade over it). To sign locally with the real keystore:

```bash
cp ~/personal/projects/expensly/expensly-release.keystore android/app/keystore.jks
# create android/keystore.properties (storeFile=keystore.jks, storePassword, keyAlias, keyPassword)
node scripts/patch-build-gradle.js
node scripts/preflight-signing.js   # verifies before the 38-min build
bun run apk:release
```
