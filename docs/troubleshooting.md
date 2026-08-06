# Troubleshooting

## Workflow failures

### `ota-publish` — "Latest release has no fingerprint in its body"

The OTA guard can't find `Fingerprint: <40-hex>` in the latest GitHub release.
Causes:
- **No release exists yet** (first run) → run **Release Mobile** once via
  workflow_dispatch to create the anchor release.
- The release body was hand-edited and the line removed → restore it. The
  fingerprint value is the `Fingerprint` output of the build job — or run a
  fresh release-mobile dispatch.
- The line exists but is malformed (not `Fingerprint: ` + exactly 40 hex) →
  fix the body; re-run ota-publish.

### `ota-publish` — "Fingerprint changed without a version bump"

A native-affecting change reached `main` without a `package.json` bump, so
the update would match no installed binary. Fix: bump the version, merge, let
release-mobile produce the new APK, then (optionally) re-run ota-publish.

Also check the version-sync step: the fingerprint hashes `app.json`
version/versionCode — if a human edited `app.json` version by hand and CI
overwrote it, fingerprints can shift spuriously. Always bump in
`package.json`; never edit `app.json`'s version.

### `release-mobile` fails at `preflight-signing`

Runs in the first ~2 minutes — `keytool -list -v` failed against the
decoded keystore. Causes:
- wrong `ANDROID_KEYSTORE_PASSWORD` → "FAIL — storePassword"
- wrong alias → "FAIL — keyAlias"
- `ANDROID_KEY_PASSWORD ≠ ANDROID_KEYSTORE_PASSWORD` → PKCS12 error message
- Fix by re-setting the secrets (`gh secret set` or the helper script), then
  re-run via workflow_dispatch.

### `release-mobile` fails at "Configure release signing"

`ANDROID_KEYSTORE_BASE64` not set → the step errors intentionally:
*"refusing to ship a debug-signed release"*. Set the secret and re-run.

### `release-mobile` fails in gradle

- **OOM** → the memory-tune step (`-Xmx3g -XX:MaxMetaspaceSize=1g`) should
  have applied; check `android/gradle.properties` in the run's logs. If the
  sed anchor didn't match, the step fails loudly on purpose (grep check).
- **Keystore file not found** → the patch script expects
  `android/keystore.properties` → `storeFile=keystore.jks` resolved relative
  to `android/app/`. If the file layout changed, `patch-build-gradle.js`
  exits 1 with "could not find ..." — the anchor mismatch is intentional.

### Release created with 0 APK assets

The `files:` globs in the release job must match the artifact layout.
`upload-artifact@v4` roots the artifact at the least common ancestor of the
upload paths — the 4 APKs all live under `apk/release/` so they land flat:
`release-files/app-arm64-v8a-release.apk` etc. If the build's output paths
ever change, both the upload `path:` and the release `files:` must change
together. `if-no-files-found: error` on upload makes a mismatch fail loudly
at upload time.

### `bun install --frozen-lockfile` fails

`bun.lock` is out of sync with `package.json`. Locally:
```bash
bun install        # updates bun.lock
git add bun.lock && git commit -m "chore: sync lockfile"
```

### `expo lint` fails on new code

Biome and ESLint are separate gates — a change can pass `bun run lint` and
fail `bun run lint:expo`. Run both locally before pushing:
```bash
bun run lint && bun run lint:expo && bun run check-types
```

## Version / fingerprint issues

### `versionCode` decreases (monotonicity trap)

`versionCode` is derived from version digits: `1.2.0 → 120`, `1.9.0 → 190`,
`1.10.0 → 1100`, then `2.0.0 → 200` — **a decrease**, which Android rejects
for upgrades (and EAS would mismatch on). When approaching `1.10.x` (or any
digit overflow like `2.9 → 2.10`), switch the sync to a plain counter, or
jump majors deliberately with a forced manual versionCode above the previous
one. Current version: `1.1.0 → versionCode 110`.

### Locally built fingerprint differs from CI's

Normal. The fingerprint hashes the whole project surface including the
`.env` materialization, toolchain state and (before prebuild) whether
`android/` exists. What matters is that **CI's two workflows agree** — they
use the same steps. Local fingerprints are only useful for relative checks.

### App on device never receives OTA updates

1. Was the installed APK built *after* expo-updates was wired? Pre-pipeline
   builds have no updates layer — reinstall once from a pipeline release.
2. Is the APK's tree the same as the update's? EAS only serves matching
   fingerprints.
3. Check the `ota-publish` run went green (guard failures abort publishing).
4. On-device: close the app fully and relaunch (ON_LOAD checks once per
   launch).

## After things go wrong

- **Wrong OTA shipped** → roll back the `production` channel in the EAS
  dashboard (see [ota.md](ota.md#rollback)).
- **Wrong native build shipped** → re-release the previous tag, or ship a
  fix with a version bump (forward-fix). Older versionCodes can't be
  installed over newer ones without uninstall.
- **Keystore secrets lost** → the keystore lives at
  `~/personal/projects/expensly/expensly-release.keystore` and in your
  password-manager backups (see [secrets.md](secrets.md)). Without it,
  existing installs are un-upgradeable.

## CI is slow?

- `release-mobile` (~38 min) is gradle-dominant; nothing to shave without
  build caching (bun doesn't cache node_modules across runs by default).
- `ota-publish` (~3 min) and `ci` (~1 min) are already lean.
- Public repo → free GitHub Actions minutes; no billing concern.
