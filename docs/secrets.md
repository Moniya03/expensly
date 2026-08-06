# Secrets & Signing

## The 8 GitHub repository secrets

Repo: `Moniya03/expensly` → **Settings → Secrets and variables → Actions**.
Values are write-only: GitHub never shows them again after you save them.
Never commit them; never paste them into chat or logs.

| Secret | Purpose | Source |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | Base64 of the release keystore file | `base64 -w0 ~/personal/projects/expensly/expensly-release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore store password | The password set when the keystore was created (Aug 3 2026) — store it in your password manager |
| `ANDROID_KEY_PASSWORD` | Key password — **must equal** the store password | Same value (PKCS12 keystores have no separate key password) |
| `ANDROID_KEY_ALIAS` | Key alias in the keystore | `expensly` |
| `EXPO_TOKEN` | EAS CLI auth for `eas update` | https://expo.dev/settings/access-tokens (any scope; read-only suffices) |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Local `.env` (gitignored) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Local `.env` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Sign-In web client ID | Local `.env` |

The three `EXPO_PUBLIC_*` values are inlined into the JS bundle at build/export
time, so both release workflows materialize them into a `.env` file during the
run.

## Keystore facts (critical — do not lose)

| Property | Value |
|---|---|
| File | `~/personal/projects/expensly/expensly-release.keystore` (outside the repo!) |
| Format | PKCS12 (not JKS) — `keyPassword` forced to equal `storePassword` |
| Alias | `expensly` |
| Created | 2026-08-03, valid to 2053-12-19 |
| Certificate | CN=Expensly, OU=Mobile, O=Expensly, L=Mumbai, ST=Maharashtra, C=IN |
| SHA-1 (registered in Google Cloud for release sign-in) | `5F:BD:39:17:37:B6:15:8C:2E:2B:D3:38:6B:9D:87:EB:B4:80:AC:1B` |

**If this keystore is lost, every installed Expensly build becomes
un-upgradeable** (Android refuses to install an APK with a different
signature over an existing one). The keystore currently exists only on this
machine. Required backups:

1. The keystore file itself → password manager file attachment / encrypted
   storage
2. The base64 (what the GitHub secret holds)
3. Store + key passwords (identical) and the alias
4. `EXPO_TOKEN` (can be recreated, but lose it and OTA publishing breaks)

## One-time setup script

`scripts/set-github-secrets.sh` does all of the above without ever echoing a
value (`set +x`, `read -s`, values piped via stdin to `gh secret set`):

```bash
bash scripts/set-github-secrets.sh
```

It reads the keystore and `.env` from disk, prompts for the two keystore
passwords and `EXPO_TOKEN`, and prints only the secret *names* it set.

## What the workflows do with the secrets

`release-mobile.yml`:
1. `echo $ANDROID_KEYSTORE_BASE64 | base64 -d > android/app/keystore.jks`
2. writes `android/keystore.properties` (storeFile, storePassword, keyAlias,
   keyPassword)
3. `node scripts/patch-build-gradle.js` — wires the keystore into the
   generated `build.gradle`
4. `node scripts/preflight-signing.js` — verifies password+alias against the
   keystore *before* the ~38-minute build (fails in ~2 s on wrong secrets)
5. Missing keystore secret → **build fails** (never a debug-signed release)

`ota-publish.yml`: uses only `EXPO_TOKEN` (EAS auth) + the three
`EXPO_PUBLIC_*` values.

## Rotating / changing a secret

1. Generate the new value (e.g. new keystore → **existing installs can no
   longer be upgraded** — only do this when acceptable).
2. `gh secret set NAME --repo Moniya03/expensly` (piped via stdin).
3. Test with a manual `workflow_dispatch` release run.
