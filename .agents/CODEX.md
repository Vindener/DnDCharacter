# CODEX.md

## Codex-Specific Execution Guide
This file tells Codex how to behave in this repository.

## Default Posture
- Inspect first.
- Change as little as possible.
- Keep behavior stable.
- Validate only with commands that truly exist.
- Report facts, not guesses.

## When Working On The Current Roadmap
1. Prefer Sprint 1 scope first: Dice Roller and Skeleton-loader.
2. Do not jump to DM Desktop unless explicitly requested.
3. Do not rewrite large screens fully unless the task asks for redesign.
4. Prefer extracting reusable components only when they are needed by the current sprint.
5. Keep UI changes Android-friendly.
6. Keep the current source of truth in `docs/ux-ui-roadmap.md`.

## Good Task Pattern
1. Read the relevant files.
2. Confirm where the change belongs.
3. Make a minimal patch.
4. Run the narrowest relevant validation command.
5. Summarize touched files and any remaining risk.

## For UI Tasks
- First ask whether the screen is used during a session.
- If yes, optimize for speed and clarity.
- Preserve current navigation contracts.
- Avoid mixing data-fetching/cloud logic directly into presentational components.
- Prefer 1-2 tap session actions.
- Keep gameplay screens readable and low-friction.

## For Data/Cloud Tasks
- Preserve current Firestore field semantics unless the task explicitly changes schema.
- Keep auth-null cases safe.
- Do not assume remote documents always exist.
- Keep local-first behavior intact.

## For Refactors
Allowed:
- local type tightening;
- helper extraction;
- duplicate cleanup within touched scope.

Avoid by default:
- cross-project architectural rewrites;
- dependency churn;
- folder restructuring for style only.
