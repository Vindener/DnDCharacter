# CODEX.md

## Codex-specific execution guide
This file tells Codex how to behave in this repository.

### Default posture
- inspect first;
- change as little as possible;
- keep behavior stable;
- validate only with commands that truly exist;
- report facts, not guesses.

### Good task pattern
1. Read the relevant files.
2. Confirm where the change belongs.
3. Make a minimal patch.
4. Run `npx tsc --noEmit` if feasible.
5. Run `npm run format` if feasible.
6. Summarize touched files and any remaining risk.

### For UI tasks
- prefer Android-friendly interactions;
- preserve current navigation contracts;
- avoid mixing data-fetching/cloud logic directly into presentational components.

### For data/cloud tasks
- preserve current Firestore field semantics unless the task explicitly changes schema;
- keep auth-null cases safe;
- do not assume remote documents always exist.

### For refactors
Allowed:
- local type tightening;
- helper extraction;
- duplicate cleanup within touched scope.

Avoid by default:
- cross-project architectural rewrites;
- dependency churn;
- folder restructuring for style only.
