# OTA Update Runbook

Expensly uses **EAS Update** (Expo's hosted OTA service) on the `production`
channel. App config:

```jsonc
// app.json
"runtimeVersion": { "policy": "fingerprint" },   // updates gated by build fingerprint
"updates": {
  "enabled": true,
  "url": "https://u.expo.dev/96abc31b-76f0-42c0-bd57-4dc984730ec3",
  "checkAutomatically": "ON_LOAD",               // background check on app load
  "fallbackToCacheTimeout": 0                    // never block launch on update fetch
}
```

## How an update reaches a device

1. You merge a JS-only change to `main` (paths: `app/**`, `components/**`,
   `hooks/**`, `stores/**`, `services/**`, `utils/**`, `constants/**`,
   `types/**`, `assets/**`, `babel.config.js`, `tsconfig.json`, `index.ts`).
2. `ota-publish.yml` runs: version-syncs `app.json`, materializes `.env`,
   computes the runtime fingerprint, checks it against the latest release
   body, then `eas-cli update --channel production --platform android`.
3. Devices running an APK whose fingerprint matches the update fetch it on
   their next app load (background check — the app starts instantly on the
   embedded bundle, then applies the new JS). The new JS takes effect on the
   **next** launch; no reinstall, no Play Store.

## The fingerprint guard (why OTA can fail loudly)

EAS only serves an update to binaries whose fingerprint matches the update's
fingerprint — a mismatched update is a silent no-op. `ota-publish.yml` checks
the current tree's fingerprint against `Fingerprint: <hex>` in the **latest
GitHub release body** before publishing:

| Guard result | Meaning | Action |
|---|---|---|
| No `Fingerprint:` line in latest release | No native release yet (first run), or body was edited | Run release-mobile once (manual) or restore the line |
| Fingerprint mismatch | A native-affecting change went out without a version bump | Bump `package.json`, merge → release-mobile builds the new binary |
| Match | Safe to publish | proceed |

## Manual OTA publish

Actions → **OTA Publish** → Run workflow. Useful to re-publish the current
tree or after a guard failure once the release has landed.

## Verifying an OTA reached a device

1. Make a JS-only change (e.g. a version string on the home screen), push.
2. Watch `ota-publish.yml` go green (2–3 min).
3. On a device running the matching APK: close the app fully, reopen it,
   trigger the check (a fresh launch after a couple of minutes is enough —
   `ON_LOAD` checks once per launch).
4. The change appears **without reinstalling**. If it doesn't:
   - check the run was green (guard may have failed — see above)
   - check the device's APK fingerprint matches: the update only serves
     binaries built from the same tree. An APK from a *different* commit
     (e.g. an old sideload) will never receive it — that's expected.

## Rollback

OTA rollback is done from the **EAS dashboard**, no new build needed:

1. https://expo.dev → project Expensly → **Updates**.
2. Find the previous good update on the `production` channel.
3. Roll back the channel to it (EAS UI: channel → previous update → promote /
   rollback). Devices checking after the rollback get the older bundle.
4. If a native release (version bump) is the problem, that's not OTA — see
   [release.md](release.md#rollback).

## Native changes after OTA wiring

Because `expo-updates` itself changes the fingerprint, the **first release
after this pipeline was added** was a native release (the manual
`workflow_dispatch` we ran). Users on APKs built *before* expo-updates was
wired need exactly one manual reinstall to gain OTA capability — after that,
everything is seamless.
