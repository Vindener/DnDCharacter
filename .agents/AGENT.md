# AGENT.md

## Role
You are a Codex-style repository agent working inside `DnDCharacter` (`MythgateDND`).
Your job is to inspect the existing code first, then make the smallest safe change that solves the task without damaging working flows.

This is **not** a greenfield project. Treat it as a live Expo + React Native codebase with local state, Firebase sync, and Android-first product priorities.

---

## Project snapshot
- App type: Expo React Native mobile app
- Product: Dungeons & Dragons companion / character manager
- Primary platform: Android
- Package manager: `npm`
- Language: TypeScript
- State: Zustand + AsyncStorage
- Cloud: Firebase Auth + Firestore
- Navigation: React Navigation

Main user flows currently present in the repository:
- character creation
- local character editing and persistence
- character detail tabs
- cloud save/share of character sheets
- bestiary
- DM tools
- initiative flow
- settings/support

---

## Codex operating principles

### 1. Read before writing
Before changing code, inspect the files actually involved.
At minimum, read:
- target screen/component/service;
- related types;
- related store if state is involved;
- related navigation file if route params are involved.

Do not make assumptions from framework habits alone.

### 2. Prefer the smallest correct diff
Choose narrow edits over rewrites.
Good:
- fixing a type contract;
- extracting one helper;
- tightening a Firestore mapper;
- improving one screen interaction.

Avoid unless explicitly requested:
- massive folder reshuffles;
- broad renames;
- replacing architecture patterns wholesale;
- upgrading core dependencies opportunistically.

### 3. Preserve product-critical behavior
Do not break:
- offline/local character persistence;
- Firebase auth flows;
- Firestore character sharing flows;
- navigation between existing screens;
- Android usability.

When a task touches one of those flows, explicitly verify the related code path first.

### 4. Improve code quality only where touched
When editing a file:
- avoid introducing new `any`;
- prefer explicit types for params and service returns;
- keep code consistent with surrounding conventions;
- do not expand scope just to "clean everything up".

### 5. Be honest about repository reality
Only claim commands/checks passed if they were actually run.
This repository does **not** currently provide default `lint` or `test` scripts.

---

## Repository-specific guidance

### Important directories
- `src/screens/` — screen-level UI
- `src/shared/components/` — reusable presentational/shared components
- `src/modules/` — larger reusable UI modules
- `src/navigation/` — navigation structure
- `src/context/` — Zustand stores
- `src/services/` — domain and Firebase-related services
- `assets/` — visual assets
- `android/` — native Android project

### High-impact files
Start here when a task touches related behavior:
- `App.tsx`
- `src/navigation/AppNavigator.tsx`
- `src/context/Character-store.ts`
- `src/services/characterSheets.ts`
- `src/services/firebase.ts`
- `src/components/ShareCharacterSheetModal.tsx`
- `src/screens/CreateCharacter/CreateCharacter.tsx`
- `src/screens/Character/Character.tsx`
- `src/shared/components/CharacterMenu/CharacterMenu.tsx`

---

## Coding rules for this repo

### TypeScript
- Do not introduce new `any` unless absolutely unavoidable.
- Prefer narrow interfaces/types near service boundaries and navigation params.
- Keep return shapes explicit for async service functions.

### Components
- Prefer functional components.
- Prefer `Pressable` for interactive UI when practical.
- Add `android_ripple` when it improves Android feedback.
- Keep styles in `style.ts` / `styles.ts` following the local feature convention.

### State and services
- Keep UI orchestration in screens/components.
- Keep reusable logic in helpers, stores, or services.
- Keep Firebase access in service modules, not ad-hoc inside UI.

### Firestore / auth changes
When touching cloud code:
- assume auth can be null or delayed;
- validate document existence;
- preserve existing owner/editor sharing semantics;
- avoid silent schema drift;
- prefer explicit mapper functions over implicit object spreading.

---

## Codex workflow
Use this order whenever possible:
1. Inspect the relevant files.
2. Identify the minimal safe edit.
3. Update types first if needed.
4. Implement logic.
5. Adjust UI only as much as necessary.
6. Run validation commands that actually exist.
7. Report exactly what changed, which files were touched, and any remaining risk.

---

## Validation commands
Use only commands that match this repository:
- install deps: `npm install`
- start expo: `npm start`
- android dev: `npx expo start --android`
- web dev: `npm run web`
- format: `npm run format`
- type-check: `npx tsc --noEmit`

Do not claim `npm run test` or `npm run lint` succeeded unless you first added those scripts and actually ran them.

---

## Output expectations for Codex
When summarizing work:
- start with the concrete result;
- list files changed;
- mention what you verified;
- mention remaining uncertainty plainly;
- do not oversell confidence.


## Core Product Principles (MANDATORY)

This is NOT just a CRUD mobile app.

This project is:

- Session-first DnD tool
- Player + DM collaboration system
- Local-first with cloud enhancement
- Homebrew-friendly character system

Agent MUST prioritize:

1. Fast in-session interactions over deep forms
2. Clear separation between Play Mode and Edit Mode
3. Minimal cognitive load during gameplay
4. Visibility of Local vs Cloud vs Shared state
5. Support for homebrew/custom mechanics as first-class feature

## UX Rules (STRICT)

When modifying UI:

- NEVER overload screens with long forms in gameplay mode
- ALWAYS prefer quick actions over deep navigation
- ALWAYS separate:
  - system data (stats, HP, AC)
  - gameplay notes
  - homebrew data

- During session:
  - user should tap, not read
  - user should act in 1-2 taps

  ## Character Modes

Every character-related UI must support:

- Play Mode (default)
  - fast access
  - large controls
  - no heavy editing

- Edit Mode
  - full configuration
  - forms and structure editing

Agent must NOT mix these modes in one UI.

## Data Model Philosophy

- Local data ALWAYS exists
- Cloud is used for:
  - synchronization
  - collaboration (DM <-> Player)
- Shared state is a core feature

Agent must always show:
- sync status
- data origin (local/cloud/shared)