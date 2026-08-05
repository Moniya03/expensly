#!/usr/bin/env bash
# One-time helper: push the Expensly release secrets into GitHub Actions.
# Reads the keystore and .env from disk; values are piped to `gh secret set`
# via stdin so they never appear in argv, shell history, or CI logs.
set -euo pipefail
# Never trace values even if invoked as `bash -x`.
set +x

REPO="Moniya03/expensly"
KEYSTORE_PATH="${KEYSTORE_PATH:-/home/moniya/personal/projects/expensly/expensly-release.keystore}"
ENV_FILE=".env"

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI not installed — install from https://cli.github.com" >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "error: not logged into gh — run 'gh auth login' first" >&2
  exit 1
fi
if [[ ! -f "$KEYSTORE_PATH" ]]; then
  echo "error: keystore not found at $KEYSTORE_PATH (set KEYSTORE_PATH to override)" >&2
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE not found — run this from the repo root" >&2
  exit 1
fi

ANDROID_KEYSTORE_BASE64=$(base64 -w0 "$KEYSTORE_PATH")

echo "Keystore store password (PKCS12: key password MUST equal this):"
read -r -s ANDROID_KEYSTORE_PASSWORD
echo
echo "Key password (must equal the store password for PKCS12):"
read -r -s ANDROID_KEY_PASSWORD
echo
if [[ -z "$ANDROID_KEYSTORE_PASSWORD" || -z "$ANDROID_KEY_PASSWORD" ]]; then
  echo "error: passwords cannot be empty" >&2
  exit 1
fi
if [[ "$ANDROID_KEYSTORE_PASSWORD" != "$ANDROID_KEY_PASSWORD" ]]; then
  echo "warning: store and key passwords differ — PKCS12 requires them identical; the CI preflight will fail if wrong." >&2
fi

ANDROID_KEY_ALIAS="expensly"

EXPO_PUBLIC_SUPABASE_URL=$(grep -E '^EXPO_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | head -n 1 | cut -d= -f2-)
EXPO_PUBLIC_SUPABASE_ANON_KEY=$(grep -E '^EXPO_PUBLIC_SUPABASE_ANON_KEY=' "$ENV_FILE" | head -n 1 | cut -d= -f2-)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$(grep -E '^EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=' "$ENV_FILE" | head -n 1 | cut -d= -f2-)

echo "EXPO_TOKEN (create at https://expo.dev/settings/access-tokens):"
read -r -s EXPO_TOKEN
echo
if [[ -z "$EXPO_TOKEN" ]]; then
  echo "error: EXPO_TOKEN cannot be empty" >&2
  exit 1
fi

set_secret() {
  local name="$1" value="$2"
  if [[ -z "$value" ]]; then
    echo "error: $name is empty — refusing to set" >&2
    return 1
  fi
  printf '%s' "$value" | gh secret set "$name" --repo "$REPO"
  echo "set: $name"
}

set_secret ANDROID_KEYSTORE_BASE64 "$ANDROID_KEYSTORE_BASE64"
set_secret ANDROID_KEYSTORE_PASSWORD "$ANDROID_KEYSTORE_PASSWORD"
set_secret ANDROID_KEY_PASSWORD "$ANDROID_KEY_PASSWORD"
set_secret ANDROID_KEY_ALIAS "$ANDROID_KEY_ALIAS"
set_secret EXPO_PUBLIC_SUPABASE_URL "$EXPO_PUBLIC_SUPABASE_URL"
set_secret EXPO_PUBLIC_SUPABASE_ANON_KEY "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
set_secret EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID "$EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"
set_secret EXPO_TOKEN "$EXPO_TOKEN"

echo "All secrets set on $REPO. Verify names only: gh secret list --repo $REPO"
