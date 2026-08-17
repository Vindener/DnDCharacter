---
description: 'Use when working on React Native Expo screens/components/services in this repo. Enforces Android-first UX, strict TypeScript (no any), Zustand store patterns, and Firestore service conventions.'
name: 'DnDCharacter Mobile RN Standards'
applyTo:
  - 'src/**/*.ts'
  - 'src/**/*.tsx'
---

# DnDCharacter Mobile Standards

## Scope

- React Native (Expo managed workflow) code under `src/`.
- Prefer compatibility with both Android and iOS, but optimize UX for Android first.

## TypeScript Rules

- Hard rule: do not use `any` in props, route params, state, service inputs, or outputs.
- Define explicit `type` or `interface` for component props and Firestore DTOs.
- Prefer narrow return types for helpers and services.

## Component and UI Rules

- Use functional components and React hooks only.
- Extract non-trivial stateful logic into custom hooks.
- For interactive controls, prefer `Pressable` and include `android_ripple` when it fits the UX.
- For long lists, use `FlatList` (or `FlashList`) instead of `ScrollView`.

## Navigation and Screen Rules

- Strongly type route params with navigation param lists.
- Avoid untyped route usage (for example `route: any`).

## Styling Rules

- Use `StyleSheet.create` and keep styles in a dedicated style file.
- Follow one naming convention for style files per feature. Prefer `style.ts`.
- Use theme-driven colors (for example `getStyles(colors)`) instead of hardcoded color literals in components.
- For elevation/shadows, include Android behavior (`elevation`) when visual depth is required.

## Zustand and State Rules

- Keep stores focused by domain and colocated in `src/context/`.
- Expose typed state and actions from stores.
- Keep side-effect heavy logic out of components when it can live in store actions/services.

## Firebase/Firestore Service Rules

- Keep Firestore access inside service modules in `src/services/`.
- Validate authentication before user-scoped operations.
- Keep DTO mapping explicit (app model <-> Firestore document shape).
- Keep collection/document path constants centralized per service to avoid path drift.
- Add defensive checks for missing documents and nullable fields.

## Consistency Rules

- Keep naming conventions consistent with existing code:
  - Components/types: PascalCase
  - Service functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE
- Use English for code comments by default.
