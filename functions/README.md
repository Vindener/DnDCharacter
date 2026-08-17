# Cloud Functions — Mythgate 5e Companion

One callable function: `deleteMyAccount`. It implements the account-deletion cascade
(PLY-1 / COL-10 in `docs/audit-2026-07.md` and `docs/collaborative-editing.md`) with
Firebase Admin rights, because `firestore.rules` structurally cannot let a departing
owner/editor rewrite `owners`/`editors` on documents shared with other people.

This package is deployed independently of the mobile app. It is **not** part of the
root npm workspace — it has its own `package.json`, `tsconfig.json`, and
`node_modules`. Root `npx tsc --noEmit` explicitly excludes `functions/`
(see root `tsconfig.json`), and root `npm run test:unit` does not run this
package's tests (its `vitest.config.ts` only exists inside `functions/`).

## What it does

`deleteMyAccount`:

1. Requires an authenticated caller (`request.auth.uid`).
2. For `characterSheets`, `dmCampaigns`, `dmCampaignNotes`: for every document
   where the caller is an owner or editor, applies the COL-10 decision table
   (`src/accountDeletionCascade.ts`) — delete / transfer ownership / drop from
   owners / drop from editors. Ownership transfer uses the client's
   `transferSelections` payload when a document has more than one editor
   (the client asks the user which one), otherwise defaults to the sole editor.
3. Deletes every `connections` doc where the caller is `fromUid` or `toUid`.
4. Deletes `emailIndex/{myEmailLower}` if it points at the caller, and `users/{uid}`.
5. Commits all of the above in chunks of ≤450 Firestore batch ops (atomic per
   chunk; a single user with 500+ owned/shared documents would not be fully
   atomic end-to-end — not expected at this app's scale, but worth knowing).
6. Only after the Firestore cascade succeeds, calls `admin.auth().deleteUser(uid)`.
   If that last step fails, the function returns `{ status: 'partial', stage:
'auth-delete-failed' }` instead of throwing, so the client can show a distinct
   "your data is gone but the sign-in account may still exist" message instead of
   a generic error.

The client re-authenticates with a fresh Google credential right before calling
this function (`src/shared/services/auth/google.ts#reauthenticateWithGoogle`),
so a stale cached session can't trigger deletion without the user actively
signing in again. The function itself doesn't need to re-check "recent login" —
that Firebase Auth constraint only applies to client-SDK operations like
`user.delete()`, not to `admin.auth().deleteUser()` from a callable.

## One-time Firebase Console setup (cannot be done from this repo)

- **Billing: this project must be on the Blaze (pay-as-you-go) plan.** Cloud
  Functions 2nd gen (what `firebase-functions/v2/https` deploys) refuses to
  deploy on the free Spark plan, even for a function that will see near-zero
  traffic. Firebase Console → Usage and billing → upgrade.
- **Enable the required APIs** (the first `firebase deploy --only functions`
  will prompt for this, but it can also be done ahead of time in Google Cloud
  Console): Cloud Functions API, Cloud Build API, Artifact Registry API,
  Eventarc API.
- **IAM**: no extra roles needed beyond what `firebase deploy` sets up by
  default for the deploying account (Firebase Admin / Editor).

## Local setup

```bash
cd functions
npm install
npm run build
```

## Tests

Pure decision-logic tests only (`accountDeletionCascade.test.ts`) — no emulator,
no network:

```bash
cd functions
npm test
```

The rest of `deleteMyAccount.ts` (the actual Firestore/Auth admin calls) is
**not** covered by this test suite — it needs the Firebase Emulator Suite.
See "Testing against the emulator" below before trusting a change to the
cascade logic itself.

## Testing against the emulator

```bash
firebase emulators:start --only functions,firestore,auth
```

Then point a local client at the emulator (in the mobile app, before calling
`fns.httpsCallable(...)`, call `connectFunctionsEmulator(getFunctions(), 'localhost', 5001)`
and the equivalent for Firestore/Auth — not wired up by default in this repo,
add it only in a local/dev build, never in the shipped app). Seed
`characterSheets`/`dmCampaigns`/`dmCampaignNotes`/`connections`/`users`/`emailIndex`
fixtures for the four owner/editor cases from the COL-10 table and confirm the
resulting documents match, per `docs/collaborative-editing.md` §4 test plan.

## Deploying

```bash
cd functions
npm run build
firebase deploy --only functions:deleteMyAccount
```

(`npm run deploy` from `functions/` does both steps.) This requires the Firebase
CLI to be installed and logged in (`npm install -g firebase-tools`, `firebase login`),
and the Blaze-plan/API prerequisites above.

To deploy the updated `firestore.rules` (allow owner-delete on `users`/`emailIndex`):

```bash
firebase deploy --only firestore:rules
```

## Runtime/Node version

`engines.node: "20"` in `package.json` pins the deployed Cloud Functions runtime
to Node 20, matching the mobile app's EAS Node version convention in the root
`CLAUDE.md`. Local dev Node version doesn't matter for the deployed function —
Firebase builds and runs it in its own Node 20 container regardless of the Node
version on your machine.
