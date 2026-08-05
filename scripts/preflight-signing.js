#!/usr/bin/env node
/**
 * Fast-fail signing preflight for the CI release build: verifies the secrets in
 * android/keystore.properties against the actual keystore BEFORE the ~38 min
 * gradle build. Exits 0 silently when keystore.properties is absent (local dev).
 *
 * PKCS12 truth: a PKCS12 keystore has no separate key password (keytool falls
 * back to the store password silently, and `keytool -importkeystore` lies about
 * srckeypass), so `keytool -list -v -storepass <storePassword> -alias <keyAlias>`
 * succeeding IS the full check. We additionally require keyPassword ===
 * storePassword, because that is what AGP uses to decrypt the key at signing
 * time — a differing ANDROID_KEY_PASSWORD would only fail mid-build.
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const androidDir = path.resolve(__dirname, "..", "android");
const propsFile = path.join(androidDir, "keystore.properties");

if (!fs.existsSync(propsFile)) {
  process.exit(0); // local dev — nothing to verify
}

const props = parseProps(fs.readFileSync(propsFile, "utf8"));
const storeFile = props.storeFile;
const storePassword = props.storePassword;
const keyAlias = props.keyAlias;
const keyPassword = props.keyPassword;

if (!storeFile) fail("storeFile");
if (!storePassword) fail("storePassword");
if (!keyAlias) fail("keyAlias");
if (!keyPassword) fail("keyPassword");

// Gradle resolves `file(keystoreProperties['storeFile'])` inside the app module,
// i.e. relative to android/app/ — check the exact path the build will read.
const storePath = path.isAbsolute(storeFile)
  ? storeFile
  : path.join(androidDir, "app", storeFile);
if (!fs.existsSync(storePath)) {
  fail(`storeFile: ${storePath} not found`);
}

const res = spawnSync(
  "keytool",
  ["-list", "-v", "-keystore", storePath, "-storepass", storePassword, "-alias", keyAlias],
  { encoding: "utf8", timeout: 30000 },
);
if (res.error) {
  fail(`keytool: ${res.error.message}`);
}
if (res.status !== 0) {
  const out = `${res.stdout}\n${res.stderr}`;
  if (/password was incorrect|tampered with/i.test(out)) fail("storePassword");
  if (/does not exist/i.test(out)) fail(`keyAlias: '${keyAlias}' not found in keystore`);
  fail("storePassword or keyAlias");
}

if (keyPassword !== storePassword) {
  fail("keyPassword: PKCS12 keystores have no separate key password — keyPassword must equal storePassword (set ANDROID_KEY_PASSWORD to ANDROID_KEYSTORE_PASSWORD)");
}

console.log("key password OK");

function parseProps(text) {
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) continue;
    const eq = line.indexOf("=");
    const key = (eq === -1 ? line : line.slice(0, eq)).trim();
    const value = (eq === -1 ? "" : line.slice(eq + 1)).trim();
    out[key] = value;
  }
  return out;
}

function fail(what) {
  console.error(`preflight-signing: FAIL — ${what}`);
  process.exit(1);
}
