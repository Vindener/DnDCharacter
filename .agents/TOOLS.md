# TOOLS.md

## Tooling policy for Codex
Use the repository as it is.
Prefer inspection before mutation.
Do not claim validation steps that were not actually run.

## Package and dependency rules
- Use `npm` only.
- Do not use `yarn` or `pnpm`.
- For Expo-compatible packages, prefer `npx expo install <package>`.
- For generic packages, use `npm install <package>`.
- Avoid dependency upgrades unless the task explicitly requires them.

## Reliable project commands
- install dependencies: `npm install`
- run Expo dev server: `npm start`
- open Android flow: `npx expo start --android`
- run web target: `npm run web`
- format repository: `npm run format`
- type-check: `npx tsc --noEmit`

## Commands that are NOT currently backed by package.json
- `npm run test`
- `npm run lint`

If you add such scripts later, only then may you report them as available.

## Useful repo inspection commands
Use these when exploring before edits:
- `find . -maxdepth 3 -type f`
- `rg "text" src`
- `sed -n '1,220p' <file>`
- `cat package.json`
- `cat tsconfig.json`

## Validation strategy
When possible after edits:
1. run `npx tsc --noEmit`
2. run `npm run format`

If type-checking fails due to pre-existing issues, say so clearly and separate baseline failures from your own changes.

## Editing strategy with tools
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

## Native caution
This repo includes a committed `android/` project and React Native Firebase.
Be conservative with native/plugin/version changes because Expo compatibility matters.

## Implementation Priorities

When writing code:

1. Prefer simplicity over abstraction
2. Avoid overengineering
3. Keep UI responsive for session usage
4. Avoid heavy re-renders on critical screens (Character Sheet)
5. Ensure offline functionality is not broken