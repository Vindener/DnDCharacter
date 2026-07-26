# MEMORY.md

## Stable Repository Memory
- Repository name: `DnDCharacter`
- Product/app name in code: `MythgateDND`
- Codebase type: Expo React Native application with Android native folder committed
- Package manager: `npm`
- Primary platform priority: Android
- Tech stack: React 19.1.0, React Native 0.81.5, Expo 54, TypeScript, Zustand, AsyncStorage, Firebase Auth, Firestore
- TS config uses path aliases: `@/*` -> `src/*`, `@/assets/*` -> `assets/*`

## Current Product Direction
The app is becoming a DnD companion with Player + DM collaboration, not just a character sheet.

The strongest product feature is local-first character management with cloud sharing/sync between players and DM.

## UX/UI Sprints 1-6: Complete
Sprints 1-6 (Dice Roller + Skeleton-loader, Home, Character Sheet, Create Character + scroll/keyboard fix, Spellbook, Bestiary) are done. The project is now in release hardening; current priorities are the R1-R5 sprints in `docs/release-plan-google-play.md`. DM Desktop Workspace stays out of scope until after release.

## Collaborative Editing Facts
- The character sheet is edited by multiple people at the same time (owners + editors), not just by its creator. This drives sync, Firestore rules, and account-deletion requirements. Full model in `docs/collaborative-editing.md`.
- `android/` is a committed bare project, so EAS Build does not run `expo prebuild`. Native changes must be made in `android/` directly (and mirrored in `app.json` for config accuracy); `app.json`-only edits to native-relevant fields have no effect on the build.
- `versionName` comes from `android/app/build.gradle`, not from `app.json`'s `version` field, in this bare-project setup.

## Product Memory
The app already includes these user-facing domains:
- local character storage and management;
- create/edit character flow;
- character detail tabs;
- DM utilities;
- initiative tools;
- bestiary;
- support/settings;
- cloud save/share for character sheets.

## Product Identity
This project is a mobile DnD tool with:
- Character Sheet optimized for gameplay sessions;
- DM tools for party and shared character management;
- cloud synchronization for collaboration;
- local storage as the reliability layer;
- strong support for homebrew mechanics.

## Key Product Principles
- Play Mode vs Edit Mode.
- Quick Action Bar for HP, rest, roll, conditions, and notes.
- Combat Summary Card.
- Flexible resource trackers.
- Custom fields and homebrew sections.
- Session Mode with low cognitive load.
- Shared characters between DM and players.

## Architectural Memory
- `src/context/Character-store.ts` is core to local persistence.
- `src/services/characterSheets.ts` is core to cloud sync and sharing.
- `src/services/firebase.ts` centralizes Firebase bootstrap.
- `App.tsx` wraps the app with `AuthProvider`, navigation, and toast.
- Navigation is centered around `src/navigation/AppNavigator.tsx` and nested navigators.
- Important share/save UI exists in `src/components/ShareCharacterSheetModal.tsx` and `src/shared/components/CharacterMenu/CharacterMenu.tsx`.

## Tooling Facts
Based on `package.json`:
- `npm run format` exists.
- `npm run typecheck` exists.
- `npm run lint` exists.
- `npm run lint:ui` exists.
- `npm run lint:theme` exists.
- `npm run test:unit` exists.
- There is no default `npm test` script.

## Working Assumptions For Future Tasks
- Preserve offline-first behavior.
- Prefer incremental edits.
- Prefer improving typing in files that are already being touched.
- Do not invent repository capabilities that are not present.
- Prefer Ukrainian in explanations unless code or the task naturally requires English.
