# Merge Plan: DnDCharacter × FirebaseExpo (Character Sheets Sharing)

This folder contains **drop-in** files to integrate real-time sharing of **character sheets** with @react-native-firebase.

## What’s included
- `firestore.rules` — security rules: owners/editors, no delete by editors, minimal read exposure.
- `src/services/firebase.ts` — RNFirebase singletons (auth, firestore).
- `src/services/users.ts` — user index (`users`, `emailIndex`) with `emailLower`.
- `src/services/connections.ts` — connection requests (`pending/accepted/declined`).
- `src/services/characterSheets.ts` — CRUD + share helpers and subscriptions.
- `src/components/ShareCharacterSheetModal.tsx` — UI modal to share by email, list editors.

## How to integrate
1) **Install deps** in DnDCharacter:
   ```bash
   npm i @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
   ```

2) **Copy files** into your DnDCharacter project:
   - `firestore.rules` -> replace your Firestore rules.
   - `src/services/*` and `src/components/*` -> into your `src` tree.

3) **Deploy rules** (from project root):
   ```bash
   firebase deploy --only firestore:rules
   ```

4) **On login** (after Firebase Auth sign-in), call:
   ```ts
   import { ensureUserIndexOnLogin } from '@/services/users';
   ensureUserIndexOnLogin(); // creates/updates users/{uid} and emailIndex
   ```

5) **Use in UI**
   - Show “Share” in your character menu:
     ```tsx
     <ShareCharacterSheetModal
       visible={isShareOpen}
       onClose={() => setShareOpen(false)}
       sheetId={characterId}
     />
     ```
   - In character list, show a badge if `isShared`:
     `isShared = (doc.editors?.length ?? 0) > 0`.

## Notes
- **Connections** are preserved. On share, we create a connection if missing (status: `pending`). Editors are added immediately (as discussed). You can change to “require acceptance before edit” in `characterSheets.ts` if you prefer stricter flow.
- Editors cannot delete the document according to the security rules.
- No change history — last-write-wins with onSnapshot.
