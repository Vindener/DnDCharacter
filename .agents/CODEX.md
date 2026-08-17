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

1. UX/UI sprints 1-6 are done; the project is in release hardening. Follow the R1-R5 plan in `docs/release-plan-google-play.md` instead of the old sprint order.
2. Do not jump to DM Desktop or other new features unless explicitly requested.
3. Do not rewrite large screens fully unless the task asks for redesign.
4. Prefer extracting reusable components only when they are needed by the current task.
5. Keep UI changes Android-friendly.
6. Keep the current source of truth in `docs/release-plan-google-play.md`.

## Good Task Pattern

1. Read the relevant files.
2. Confirm where the change belongs.
3. Make a minimal patch.
4. Run the narrowest relevant validation command.
5. Summarize touched files and any remaining risk.

## Dependency / EAS Builds

- The EAS `development` profile uses Node `20.19.4`; keep `package-lock.json` compatible with Node 20 / npm 10.
- Do not regenerate `package-lock.json` with Node 24 / npm 11 before EAS builds. It can drop Linux optional/peer lockfile entries and break `npm ci --include=dev` on EAS.
- If refreshing the lockfile for EAS, use `npx -p node@20.19.4 -p npm@10 npm install --package-lock-only --include=dev --include=optional --include=peer`.
- Verify the EAS install step with `npx -p node@20.19.4 -p npm@10 npm ci --include=dev`.
- For Android development builds after dependency changes, use `npx eas-cli build --platform android --profile development --clear-cache`.
- The Android `development` profile should produce an APK; keep `build.development.android.buildType` set to `"apk"` in `eas.json`.

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
