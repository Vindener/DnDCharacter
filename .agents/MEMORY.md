# MEMORY.md

## Stable repository memory
- Repository name: `DnDCharacter`
- Product/app name in code: `MythgateDND`
- Codebase type: Expo React Native application with Android native folder committed
- Package manager: `npm`
- Primary platform priority: Android
- Tech stack: React 19, React Native 0.79, Expo 53, TypeScript, Zustand, AsyncStorage, Firebase Auth, Firestore
- TS config uses path aliases: `@/*` -> `src/*`, `@/assets/*` -> `assets/*`
- Formatting script exists: `npm run format`
- Default `test` and `lint` scripts do not exist in `package.json`

## Product memory
The app already includes these user-facing domains:
- local character storage and management
- create/edit character flow
- character detail tabs
- DM utilities
- initiative tools
- bestiary
- support/settings
- cloud save/share for character sheets

## Architectural memory
- `src/context/Character-store.ts` is core to local persistence.
- `src/services/characterSheets.ts` is core to cloud sync and sharing.
- `src/services/firebase.ts` centralizes Firebase bootstrap.
- `App.tsx` wraps the app with `AuthProvider`, navigation, and toast.
- Navigation is centered around `src/navigation/AppNavigator.tsx` and nested navigators.
- Important share/save UI exists in `src/components/ShareCharacterSheetModal.tsx` and `src/shared/components/CharacterMenu/CharacterMenu.tsx`.

## Working assumptions for future tasks
- Preserve offline-first behavior.
- Prefer incremental edits.
- Prefer improving typing in files that are already being touched.
- Do not invent repository capabilities that are not present.
- Prefer Ukrainian in explanations unless code or the task naturally requires English.

## Product Identity

This project is a mobile DnD tool with:

- Character sheet optimized for gameplay sessions
- DM tools for managing party and shared characters
- Cloud synchronization for collaboration
- Local storage as base reliability layer
- Strong support for homebrew mechanics

## Key Features (IMPORTANT)

- Play Mode vs Edit Mode
- Quick Action Bar (HP, Rest, Roll, etc.)
- Combat Summary Card
- Flexible resource trackers
- Custom fields (homebrew)
- Session Mode (low cognitive load)
- Shared characters between DM and players