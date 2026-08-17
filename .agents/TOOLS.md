# TOOLS.md

## Tooling Policy For Codex

Use the repository as it is.
Prefer inspection before mutation.
Do not claim validation steps that were not actually run.

## Package And Dependency Rules

- Use `npm` only.
- Do not use `yarn` or `pnpm`.
- For Expo-compatible packages, prefer `npx expo install <package>`.
- For generic packages, use `npm install <package>`.
- Avoid dependency upgrades unless the task explicitly requires them.

## Reliable Project Commands

- install dependencies: `npm install`
- run Expo dev server: `npm start`
- run Expo Go server: `npm run start:go`
- run Android native target: `npm run android`
- run web target: `npm run web`
- format repository: `npm run format`
- type-check: `npm run typecheck`
- lint source: `npm run lint`
- lint theme tokens: `npm run lint:theme`
- lint UI tokens: `npm run lint:ui`
- run unit tests: `npm run test:unit`

## Validation Strategy

Prefer the narrowest useful validation for the task:

1. `npm run typecheck`
2. `npm run lint:ui`, if UI token changes were made
3. `npm run lint`, if source files were edited
4. `npm run test:unit`, if logic/tests were edited
5. `npm run format`, when broad formatting is appropriate

Only claim a validation command passed if it was actually run.

## Useful Repo Inspection Commands

Use these when exploring before edits:

- `rg --files`
- `rg "text" src`
- `Get-Content -LiteralPath <file>`
- `Get-ChildItem -Recurse -Filter <pattern>`

## Editing Strategy With Tools

Before changing code, inspect:

1. target file;
2. related types;
3. related store/service;
4. navigation file if route params are involved.

For Firebase-related tasks, inspect at least:

- `src/services/firebase.ts`
- `src/services/characterSheets.ts`
- `src/services/users.ts`
- `src/services/connections.ts`

## Native Caution

This repo includes a committed `android/` project and React Native Firebase.
Be conservative with native/plugin/version changes because Expo compatibility matters.

## Committed `android/`, Prebuild, And Versions

- `android/` is committed as a bare project, so EAS Build does not run `expo prebuild`. Editing `app.json` fields like `icon`, `splash`, `android.adaptiveIcon`, or `android.permissions` has no effect on the build by itself.
- Every native-relevant change must be made in **both** places: `app.json` (so the config is truthful) and the matching file under `android/` (so it actually reaches the build). Mark manual native edits with `// manual: <reason>`.
- Do not run `npx expo prebuild --clean` without an explicit instruction from the user. It will overwrite hand-edited `AndroidManifest.xml`, `build.gradle`, and `res/` files. If prebuild seems necessary, list what would be lost first and wait for confirmation.
- `versionName` is read from `android/app/build.gradle`, not from `app.json`'s `version` field. When bumping the release version, update both files in the same change.

## Implementation Priorities

When writing code:

1. Prefer simplicity over abstraction.
2. Avoid overengineering.
3. Keep UI responsive for session usage.
4. Avoid heavy re-renders on critical screens.
5. Ensure offline functionality is not broken.
