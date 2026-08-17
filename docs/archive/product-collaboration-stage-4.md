# Stage 4: Cloud Collaboration as Flagship

> Historical planning document.
> Do not use this as the current sprint plan.
> Current roadmap: `docs/ux-ui-roadmap.md`.

Date: 2026-03-29
Project: Mythgate 5e Companion (mobile)

## Goal

Move cloud/shared from a background technical feature to a visible product advantage:

- unified sync/share statuses on key screens;
- explicit collaboration semantics for GM/Player workflows;
- offline-aware sync feedback and manual sync control;
- conflict-safe section merge with visible review flow.

## Scope Delivered

1. Unified status semantics:

- `Sync status` shown as one of:
  - `Local only`
  - `Synced`
  - `Pending sync`
  - `Offline changes pending`
  - `Conflict detected`
- `Share status` shown as one of:
  - `Shared with GM`
  - `Shared with Player`
- same terminology across `Home`, `Character`, `GM Home`, `GM Shared Updates`.

2. Sync visibility and controls:

- sync indicator and transport feedback in Character header;
- `Sync now` action in Character and GM Shared Updates;
- auto-sync feedback states (`syncing/uploading/downloading/synced/error`);
- NetInfo-based offline detection with pending queue messaging.

3. Conflict policy:

- section-based conflict detection (`overview`, `combat`, `magic`, `inventory`, `notes`, `homebrew`);
- auto-merge path for non-overlapping sections;
- conflict prompt for same-section overlap;
- no silent overwrite path for session-critical counters.

4. Change source marker + light revision history:

- shared history entries now carry attribution (`GM|Player`) and compact path summary;
- Character shows tab-level marker and compact history;
- GM Shared Updates shows light timeline rows with source marker and summary.

5. Copy semantics:

- `Local copy` (detached local clone);
- `Shared live copy` (open/edit shared sheet directly);
- `Duplicate from shared` (new independent copy from shared payload);
- actions exposed explicitly from Character menu and GM Shared Updates queue.

6. Onboarding:

- Create Character storage step now explains `Local`, `Cloud`, `Shared`;
- Review step includes collaboration consequences and sync behavior hints.

## Data / Interface Notes

- `CharacterSyncState` now includes transport metadata (`transportState`, `transportMessage`, `lastSyncError`, `lastSyncAttemptAt`).
- `CharacterChangeHistoryEntry` now includes:
  - `actorRole?: GM|Player`
  - `summary?: string`
- `upsertCharacterSheetFromLocal` now supports `actorRole` in options for history attribution.

## Historical Acceptance Signals

In the old stage plan, Stage 4 was considered complete when:

1. User can see sync/share state from all primary collaboration surfaces.
2. Offline edits are explicitly represented as pending sync.
3. Manual sync is available where users review and edit shared data.
4. Conflict flow is section-aware and visibly reviewable.
5. GM/player attribution appears in shared history, not only raw uid.
6. Copy semantics are explicit and predictable (no hidden behavior).
