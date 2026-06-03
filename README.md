DND Chararcter Page React Native Project

## Product Docs

- [Stage 1: Product Foundation / UX Foundation](docs/product-foundation-stage-1.md)
- [Stage 2: Redesign Character Experience](docs/product-redesign-stage-2.md)
- [Stage 3: Collaboration & Sync Workflow](docs/product-collaboration-stage-3.md)

## Run

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

## Testing

### Static + Unit checks

```bash
npm run typecheck
npm run lint
npm run test:unit
```

### E2E (Detox, Android Emulator)

```bash
npm run e2e:build:android
npm run e2e:test:android
```

Or run both with one command:

```bash
npm run e2e:android
```

Recommended stable profile (visible emulator + build + install + run):

```bash
npm run profile:detox:e2e:android
```

If the emulator shows Dev Launcher ("Connect" screen), run:

```bash
npm start
adb reverse tcp:8081 tcp:8081
```

Then on emulator:
1. Open the dev build.
2. Press `Connect` (or enter `http://localhost:8081` and connect).
3. Re-run `npm run profile:detox:e2e:android`.

### E2E (Detox, Attached Android device)

```bash
npx detox test -c android.attached.debug
```

### Manual dev-client profile (Android)

Use this when you want manual testing in a visible emulator with Expo dev-client:

```bash
npm run profile:manual:dev-client:android
```

### Environment notes for E2E

- Ensure Android SDK is installed and available at `ANDROID_SDK_ROOT` (or `ANDROID_HOME`).
- Ensure required NDK version is installed by Android Studio/SDK Manager (`27.1.12297006`).
- Emulator configuration in `detox.config.js` uses `Pixel_7_API_35` by default.
