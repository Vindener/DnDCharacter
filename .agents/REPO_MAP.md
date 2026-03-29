# REPO_MAP.md

## High-level map
- `App.tsx` — root app composition, auth provider, navigator, toast
- `src/navigation/` — app tabs and nested navigators
- `src/screens/` — screen entry points
- `src/shared/components/` — reusable UI
- `src/context/` — Zustand stores for local state
- `src/services/` — domain/cloud services
- `src/shared/services/` — auth/firestore/file/toast helpers
- `src/types/` — shared DTOs and domain types
- `src/shared/helpers/` — calculations and pure helpers

## Important flows
1. Local character flow
   - create/edit character
   - persist in Zustand + AsyncStorage
2. Cloud sync flow
   - auth user
   - map local DTO to Firestore doc
   - upsert or create remote sheet
3. Sharing flow
   - owners/editors arrays in Firestore
   - invite by email and connection creation
