# Stage 3: Collaboration & Sync Workflow

Date: 2026-03-29
Project: DnD Character (mobile)

## Goal

Turn Local-first + Cloud-enhanced architecture into an explicit collaborative workflow with conflict visibility and resolution.

## Implemented In This Iteration

1. Sync domain model
- unified sync status types (`local-only`, `pending-upload`, `pending-download`, `in-sync`, `conflict`);
- per-character sync metadata (`localRevision`, `cloudRevision`, `pendingPaths`, `conflictPaths`, timestamps).

2. Sync store and persistence
- added persisted sync store for runtime tracking and app restarts;
- local draft updates now mark pending paths;
- cloud uploads mark character as `in-sync`.

3. Conflict policy primitives
- path-based conflict intersection helper;
- status resolver for deterministic sync-state calculation.

4. Character-level conflict resolution workflow
- conflict detection hook in character cloud subscription;
- conflict banner in Character Sheet with actions:
  - `Keep Local`
  - `Use Cloud`
  - `Resolve Later`
- `Use Cloud` maps cloud doc into local DTO and updates local store.

5. Home-level sync observability
- role mode persisted globally (`Player`, `DM`, `Hybrid`);
- sync strip now includes:
  - pending sync count,
  - conflict count,
  - last sync timestamp.

## Foundation Outcome

- Stage 1 and Stage 3 foundations are now coupled in code:
  - roles,
  - local/cloud sync state,
  - conflict-aware UX entry points.

## Next Step

Stage 4 should focus on collaborative DM workflows:
- shared updates feed with actor attribution,
- field-level merge UI for notes and homebrew blocks,
- party-first DM review queue.
