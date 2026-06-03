# AGENT.md

## Role
You are a Codex-style repository agent working inside `DnDCharacter` (`MythgateDND`).
Inspect the existing repository before changing anything and make the smallest safe change that solves the task.

This is **not** a greenfield project. It is a live Expo React Native app with local state, Firebase sync, existing navigation, and Android-first product priorities.

## Current Product Focus
The current product focus is UX/UI polish guided by the new sprint roadmap.

The first priority is **Dice Roller + Skeleton-loader + Home**. Do not treat older stage documents as the current sprint plan.

Current direction:
- DnD companion for players and DMs, not only a character sheet.
- Local-first character management with cloud sharing/sync between players and DM.
- Session-first gameplay UX before broad feature expansion.

## Current Sprint Roadmap
1. Sprint 1: Dice Roller + Skeleton-loader
2. Sprint 2: Home redesign
3. Sprint 3: Character Sheet session-first polish
4. Sprint 4: Create Character wizard + scroll/keyboard fix
5. Sprint 5: Spellbook polish
6. Sprint 6: Bestiary polish
7. Future: DM Desktop Workspace

Use `docs/ux-ui-roadmap.md` as the current source of truth.

## UX Principles
- Session-first UX.
- Clear separation between Play Mode and Edit Mode.
- 1-2 tap access for session actions.
- Local-first, Cloud-enhanced.
- Clear loading, empty, error, offline, pending-sync, and conflict states.
- Skeleton instead of blank loading screens.
- Android-first touch targets and keyboard behavior.

## DnD Product Principles
- Dice rolls must support d20 logic, modifiers, advantage, and disadvantage.
- Character Sheet must prioritize HP, AC, initiative, attacks, spells, conditions, and quick notes.
- Create Character should follow the DnD flow: identity, race/class/background, stats, combat, equipment, magic, personality, storage/review.
- Spellbook must support quick in-session lookup, filters, and character integration.
- Bestiary must support DM quick view and encounter preparation.

## Do Not Break
- Offline/local character persistence.
- Firebase auth flows.
- Firestore character sharing flows.
- Navigation between existing screens.
- Android usability.
- Local vs Cloud vs Shared state visibility.

## Coding Rules
- Do not introduce new `any` unless unavoidable.
- Prefer narrow interfaces/types near service boundaries and navigation params.
- Keep Firebase access in service modules, not ad hoc inside UI.
- Prefer `Pressable` and Android feedback for interactive UI.
- Keep styles consistent with local `style.ts` / `styles.ts` patterns.
- Extract reusable components only when needed by the current sprint.

## Validation
Use commands that exist in `package.json`:
- `npm run typecheck`
- `npm run lint`
- `npm run lint:ui`
- `npm run lint:theme`
- `npm run test:unit`
- `npm run format`

Only claim a validation command passed if it was actually run.

## Output Expectations
When summarizing work:
- start with the concrete result;
- list changed files;
- mention what was verified;
- mention remaining uncertainty plainly.
