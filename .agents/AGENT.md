# AGENT.md

## Role

You are a Codex-style repository agent working inside `DnDCharacter` (`MythgateDND`).
Inspect the existing repository before changing anything and make the smallest safe change that solves the task.

This is **not** a greenfield project. It is a live Expo React Native app with local state, Firebase sync, existing navigation, and Android-first product priorities.

## Current Product Focus

UX/UI sprints 1-6 are complete. The project is now in **release hardening** ahead of Google Play publication. No new product features until after release.

The critical path is not code — it is the 14-day Google Play closed test. The current source of truth for priorities and sprints is `docs/release-plan-google-play.md` (sprints R1-R5). Do not treat older stage documents as the current plan.

Current direction:

- DnD companion for players and DMs, not only a character sheet.
- Local-first character management with cloud sharing/sync between players and DM.
- Character sheets are edited by multiple people at once (owners + editors) — see `docs/collaborative-editing.md` for the sync model and invariants that must not break.

## Current Sprint Roadmap

See `docs/release-plan-google-play.md` for the authoritative R1-R5 plan (Play Console setup, collaborative-editing/security, performance/observability, EAS Update + store listing, production rollout).

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

## EAS Build / Lockfile Rule

The EAS `development` build profile uses Node `20.19.4`, so `package-lock.json` must stay compatible with Node 20 / npm 10.

Do not regenerate `package-lock.json` with Node 24 / npm 11 before EAS builds. npm 11 can remove Linux optional/peer dependency entries that EAS needs, causing `npm ci --include=dev` to fail with missing lockfile packages.

When dependency or lockfile work is needed for EAS, refresh and verify with:

- `npx -p node@20.19.4 -p npm@10 npm install --package-lock-only --include=dev --include=optional --include=peer`
- `npx -p node@20.19.4 -p npm@10 npm ci --include=dev`

For Android dev builds after dependency changes, prefer:

- `npx eas-cli build --platform android --profile development --clear-cache`

The Android `development` profile is intended to produce an installable APK. Keep `eas.json` configured with `build.development.developmentClient: true`, `build.development.distribution: "internal"`, and `build.development.android.buildType: "apk"`.

## Output Expectations

When summarizing work:

- start with the concrete result;
- list changed files;
- mention what was verified;
- mention remaining uncertainty plainly.
