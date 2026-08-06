# Expensly CI/CD & OTA Documentation

Everything about how the Expensly app gets built, signed, released, and updated
over the air.

## Quick overview

| Doc | What it covers |
|---|---|
| [pipeline.md](pipeline.md) | The full architecture: 3 GitHub Actions workflows, how they trigger, and how they fit together |
| [release.md](release.md) | The release runbook: when/how to bump versions, what happens, how to verify and roll back |
| [ota.md](ota.md) | The OTA runbook: how over-the-air updates reach devices, the fingerprint guard, verification and rollback |
| [secrets.md](secrets.md) | The 8 GitHub secrets, keystore facts, backup requirements |
| [troubleshooting.md](troubleshooting.md) | Failure modes and how to fix them |

The approved implementation plan lives at the repo root: [CI-CD-PLAN.md](../CI-CD-PLAN.md).

## The pipeline in one paragraph

The repo has **three** GitHub Actions workflows:

1. **`ci.yml`** — runs on every PR and push to `main`. Gate: Biome lint + format check, `expo lint`, `tsc --noEmit`. Fast (under a minute), catches drift before it ships.
2. **`release-mobile.yml`** — runs when `package.json` changes on `main` (i.e. a version bump) or manually via `workflow_dispatch`. Builds 4 signed APKs (arm64-v8a, armeabi-v7a, x86_64, universal) with the production Expensly keystore and publishes them as a GitHub Release with an auto-generated changelog.
3. **`ota-publish.yml`** — runs when JS-only code changes on `main`. Publishes a new JS bundle to **EAS Update** (channel `production`), which installed apps fetch over the air — no reinstall needed.

The two release paths are coupled through the **runtime fingerprint**: EAS only
serves an update to binaries whose fingerprint matches. That's what makes the
"version bump for native changes, plain push for JS changes" split safe.

## First-run order (already done)

1. ✅ Tooling PR: `expo-updates` wired, Biome/ESLint/tsc added
2. ✅ 8 secrets set on GitHub (see [secrets.md](secrets.md))
3. ✅ First native release triggered (this is what creates the `Fingerprint:` anchor the OTA guard needs)
4. ⏳ Verify the 4 split APKs sign correctly and install over existing builds
5. ⏳ Verify a JS-only push reaches a device via OTA

## Common entry points

```bash
# Local checks (same as CI)
bun run lint          # biome check .
bun run lint:expo     # expo lint
bun run check-types   # tsc --noEmit

# Local release APK (debug-signed, for testing only)
bun run apk:release

# Manual release from GitHub UI
# Actions → "Release Mobile" → "Run workflow" → Run

# Manual OTA publish from GitHub UI
# Actions → "OTA Publish" → "Run workflow" → Run
```
