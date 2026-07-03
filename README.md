# Mythgate 5e Companion React Native Project

## Product Docs

- [Stage 1: Product Foundation / UX Foundation](docs/product-foundation-stage-1.md)
- [Stage 2: Redesign Character Experience](docs/product-redesign-stage-2.md)
- [Stage 3: Collaboration & Sync Workflow](docs/product-collaboration-stage-3.md)

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
