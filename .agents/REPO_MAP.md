# REPO_MAP.md

## High-Level Map

- `App.tsx` - root app composition, auth provider, navigator, toast
- `src/navigation/` - app tabs and nested navigators
- `src/screens/` - screen entry points
- `src/shared/components/` - reusable UI
- `src/shared/ui/` - shared UI primitives
- `src/shared/styles/` - design tokens and shared styles
- `src/context/` - Zustand stores for local state
- `src/services/` - domain/cloud services
- `src/shared/services/` - auth/firestore/file/toast helpers
- `src/types/` - shared DTOs and domain types
- `src/shared/helpers/` - calculations and pure helpers

## Current Roadmap Areas

### Dice

- `src/screens/Dice/`
- `src/screens/DiceRoller/`

### Home

- `src/screens/Home/`

### Character

- `src/screens/Character/`
- `src/screens/Character/Character.tsx`

### Create Character

- `src/screens/CreateCharacter/`
- `src/screens/CreateCharacter/CreateCharacter.tsx`

### Spellbook

- `src/screens/Spellbook/`
- `src/domain/spellbook/`

### Bestiary

- `src/screens/Bestiary/`
- `src/screens/Monster/`

### Shared UI

- `src/shared/ui/`
- `src/shared/styles/`
- `src/shared/components/`

Suggested Skeleton location:

- `src/shared/ui/Skeleton*`
- or `src/shared/components/Skeleton*`

Do not create Skeleton code during documentation-only tasks.

## Important Flows

1. Local character flow:

- create/edit character;
- persist in Zustand + AsyncStorage.

2. Cloud sync flow:

- auth user;
- map local DTO to Firestore doc;
- upsert or create remote sheet.

3. Sharing flow:

- owners/editors arrays in Firestore;
- invite by email and connection creation.

## High-Impact Files

- `App.tsx`
- `src/navigation/AppNavigator.tsx`
- `src/context/Character-store.ts`
- `src/services/characterSheets.ts`
- `src/services/firebase.ts`
- `src/components/ShareCharacterSheetModal.tsx`
- `src/screens/CreateCharacter/CreateCharacter.tsx`
- `src/screens/Character/Character.tsx`
- `src/shared/components/CharacterMenu/CharacterMenu.tsx`
