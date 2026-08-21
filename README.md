# Mythgate 5e Companion React Native Project

## Product Docs

Current release plan: [docs/release-plan-google-play.md](docs/release-plan-google-play.md).

Historical design docs (archived 2026-08-12, superseded by the code they describe):

- [Stage 1: Product Foundation / UX Foundation](docs/archive/product-foundation-stage-1.md)
- [Stage 2: Redesign Character Experience](docs/archive/product-redesign-stage-2.md)
- [Stage 4: Collaboration & Sync Workflow](docs/archive/product-collaboration-stage-4.md)

## Development

```bash
npm install
npm run android
npm start
```

This project uses `@react-native-firebase/*` native modules and cannot run in Expo Go.
Use a development build (Dev Client):

1. `npm run android` to build/install the app on device/emulator.
2. `npm start` to start Metro in `--dev-client` mode.
3. Open the installed app build (not Expo Go) and connect to Metro.

## Build Commands

### Local dev build

Build and install the Android development client on a connected emulator/device:

```bash
npm run android
```

Start Metro for the installed development client:

```bash
npm start
```

### EAS development builds

Android development build:

```bash
npx eas-cli build --platform android --profile development
```

This profile is configured to produce an Android APK via `android.buildType: "apk"` in `eas.json`.

iOS development build:

```bash
npx eas-cli build --platform ios --profile development
```

All platforms development build:

```bash
npx eas-cli build --platform all --profile development
```

### EAS lockfile note

The EAS `development` profile uses Node `20.19.4`. Keep `package-lock.json` compatible with Node 20 / npm 10 before running a cloud dev build.

Do not regenerate `package-lock.json` with Node 24 / npm 11 before EAS builds. That can remove Linux optional/peer dependency entries and make EAS fail during:

```bash
npm ci --include=dev
```

If the lockfile needs to be refreshed for EAS, use:

```bash
npx -p node@20.19.4 -p npm@10 npm install --package-lock-only --include=dev --include=optional --include=peer
```

Then verify the EAS install step locally:

```bash
npx -p node@20.19.4 -p npm@10 npm ci --include=dev
```

For a clean Android dev build after dependency changes:

```bash
npx eas-cli build --platform android --profile development --clear-cache
```

Use the Android `development` profile when an installable APK is needed. It has `developmentClient: true`, `distribution: "internal"`, and `android.buildType: "apk"`.

### EAS release builds

Android preview/internal build:

```bash
npx eas-cli build --platform android --profile preview
```

Android production/internal build:

```bash
npx eas-cli build --platform android --profile production
```

All platforms production build:

```bash
npx eas-cli build --platform all --profile production
```

### Local release build (no EAS Build quota)

`android/` is committed, so a signed release AAB/APK can be built locally with `gradlew` instead of queuing an EAS cloud build — useful when the EAS Build free-plan quota is exhausted. One-time signing setup (downloading the production upload keystore from `eas credentials` and placing it + its password in `~/.gradle/gradle.properties`) is documented in [docs/local-android-build.md](docs/local-android-build.md).

```bash
npm run build:android:local       # AAB (bundleRelease)
npm run build:android:local:apk   # APK (assembleRelease)
```

Output lands in `.builds/` (gitignored) with a `versionCode`-stamped filename. The script reads the EAS remote `versionCode` counter to pick the next value, but pushing it back requires a manual step — see Versioning below and `docs/local-android-build.md`.

## Versioning

`android/` is a committed bare project, so EAS Build does not run `expo prebuild`. That means the version shown in Google Play does **not** come from `app.json`.

- `app.json` → `expo.version` — the config-level version, used by Expo/EAS tooling and (if referenced) `expo-constants` at runtime.
- `android/app/build.gradle` → `defaultConfig.versionName` — the version Google Play actually displays. Because prebuild never regenerates this file, it must be bumped by hand every time.
- `android/app/src/main/res/values/strings.xml` → `expo_runtime_version` — the runtime version expo-updates uses to match installed builds against published OTA updates (`app.json` → `expo.runtimeVersion`, `appVersion` policy). Prebuild doesn't regenerate this either, so it must be bumped by hand too.

Bump all three together when releasing. If only `app.json` is updated, the store keeps showing the old `versionName` from `build.gradle`, and a stale `expo_runtime_version` means OTA updates silently stop reaching installed builds (the app and the update no longer report the same runtime version).

`versionCode` (in `build.gradle`) is **not** edited by hand — `eas.json` sets `cli.appVersionSource: "remote"`, so EAS Build assigns and increments it automatically. `scripts/build-android-local.sh` follows the same rule for local builds: it patches `versionCode` temporarily for the `gradlew` invocation and always restores the committed value afterward, so the file in git never drifts. After a local build, sync the used value back to EAS yourself (`npx eas-cli build:version:set --platform android` — interactive prompt, no `--version` flag) before the next cloud or local build, or the next one will try to reuse the same code.

## Publishing an OTA update

`expo-updates` is enabled (`ENABLED=true` in `AndroidManifest.xml`) and wired to the `production` EAS Update channel. The `production` and `preview` EAS Build profiles share one committed `AndroidManifest.xml` (no per-profile overlay), so **both** bake in channel `"production"` — there is no separate `preview` OTA channel in this bare setup. `preview` builds remain useful for manual QA of a new AAB before it goes to Google Play, not as a distinct update lane.

Publish a JS/asset-only update to installed builds:

```bash
npx eas-cli update --branch production
```

The installed app checks for updates on every launch (`EXPO_UPDATES_CHECK_ON_LAUNCH=ALWAYS`) without blocking the cold start (`EXPO_UPDATES_LAUNCH_WAIT_MS=0` / `fallbackToCacheTimeout: 0`), and applies a downloaded update on the **next** full app restart (not hot reload).

**OTA can only ship JS and static assets.** Anything that changes `AndroidManifest.xml`, `android/app/build.gradle`, native permissions, `res/mipmap-*`/`drawable-*` icons, or adds a native module requires a new AAB — `eas update` cannot deliver any of that, and an installed build will keep running its old native layer regardless of what gets published.

If an update doesn't apply after a restart, check `adb logcat | grep -i expo-updates` on the device — the most common causes are a `runtimeVersion` mismatch (device's `expo_runtime_version` vs. the published update's runtime version) or a wrong/missing channel-to-branch mapping in the EAS dashboard (`eas channel:create` / `eas channel:edit`).
