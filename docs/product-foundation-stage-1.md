# Stage 1: Product Foundation / UX Foundation

> Historical planning document.
> Do not use this as the current sprint plan.
> Current roadmap: `docs/ux-ui-roadmap.md`.

Date: 2026-03-29
Project: Mythgate 5e Companion (mobile)

## 1. Updated Positioning

Mythgate 5e Companion is a mobile character sheet for 5e and homebrew campaigns, optimized for:

- fast in-session usage;
- flexible between-session configuration;
- player/GM collaboration via cloud sync;
- guaranteed local access to data as the default safety baseline.

### Product Pillars

1. Player-friendly
- quick character sheet interaction;
- minimal UI noise during play;
- quick actions for frequent session operations;
- homebrew customization without hacks;
- offline-first access.

2. GM-friendly
- fast access to party and characters;
- controlled editing and synchronization;
- shared updates workflow;
- campaign control tools;
- bestiary, spells reference, notes, initiative as first-class GM tools.

## 2. Product Principles For Redesign

1. Session-first UX
- core actions must be reachable in 1-2 taps during play:
- change HP, add temp HP, roll dice, apply condition, rest, open spell/attack/note.

2. Edit separately from Play
- Play Mode: low-friction interaction, large touch targets, minimum forms;
- Edit Mode: full configuration surface with structured forms.

3. Local-first, Cloud-enhanced
- local data exists always;
- cloud provides collaboration and sync;
- user always sees explicit data status.

4. Homebrew as first-class
- native support for custom fields/resources/sections;
- custom reset rules;
- custom spell lists and feature blocks.

5. GM is not secondary
- GM workspace is a coherent operating area, not an incidental list of screens.

## 3. Roles and Capability Model

### Roles

- Player: owns and manages own sheet for play.
- GM: oversees party data and campaign tooling.
- Hybrid: can do both without switching accounts.

### Capability Matrix

| Capability | Player | GM | Hybrid |
| --- | --- | --- | --- |
| Quick session actions on own sheet | Yes | Optional | Yes |
| Full edit of own sheet | Yes | Optional | Yes |
| Edit another player's shared sheet | By permission | Yes (with permission) | Yes |
| Party overview | Optional | Yes | Yes |
| GM tools (notes, bestiary, initiative, spells ref) | Optional | Yes | Yes |
| Resolve sync conflicts | Own sheets | Shared/party sheets | Both |

## 4. Main User Flows

### Flow A: Quick Session Use (Play Mode)

1. User opens character and lands in Play Mode.
2. User performs quick actions (HP/temp HP/dice/condition/rest).
3. Changes are persisted locally immediately.
4. Sync status badge updates (`Pending sync` or `Synced`).

Success criteria:
- primary actions are 1-2 taps;
- no form-heavy interaction in play path.

### Flow B: Between-session Edit (Edit Mode)

1. User opens character and switches to Edit Mode.
2. User edits stats/spells/inventory/notes/homebrew blocks.
3. Validation runs per section and saves draft locally.
4. Cloud sync runs in background when available.

Success criteria:
- deep edit does not degrade Play Mode speed;
- unsaved local draft is never lost.

### Flow C: GM Edits Player Sheet

1. GM opens party roster.
2. GM opens shared player sheet (editor permission).
3. GM applies change in Edit Mode.
4. Change is synced and appears in player's shared timeline.

Success criteria:
- explicit attribution for who changed what;
- safe permissions (owner/editor model).

### Flow D: Player Edits, GM Sees Updates

1. Player edits own sheet locally.
2. Sync publishes changes to cloud shared state.
3. GM party view shows update marker and timestamp.
4. GM can review diff and continue.

Success criteria:
- near-real-time visibility online;
- clear status while one side is offline.

### Flow E: Offline Local Use

1. User opens app without network.
2. User performs session actions and edits.
3. Local queue stores pending changes.
4. On reconnect, sync engine applies queued changes with conflict checks.

Success criteria:
- full functional play/edit offline;
- zero data loss after reconnect.

## 5. Storage and Sync Model

### Canonical Layers

1. `LocalState` (device baseline)
- always writable/readable;
- contains current draft used by UI.

2. `CloudSharedState` (collaboration layer)
- shared canonical doc for owners/editors;
- source for remote updates.

3. `LastSyncState` (merge baseline)
- snapshot/version used to compute diffs and detect conflicts.

### Sync Status (visible to user)

- `Local only`
- `Pending upload`
- `Pending download`
- `In sync`
- `Conflict requires review`

### Conflict/Merge Policy

1. Local edit stores changed paths + `baseVersion`.
2. On sync, each changed path is compared against cloud changes since `baseVersion`.
3. If cloud path unchanged: auto-merge local change.
4. If both local and cloud changed same path: create conflict item.
5. Conflict resolution UI offers:
- keep local;
- keep cloud;
- merge manually (for text/list fields).

Priority rule:
- no silent overwrite for session-critical counters (`hp`, `tempHp`, `deathSaves`, `spellSlots`, custom trackers).

## 6. Character Data Structure (Target Logical Schema)

### 6.1 Core System Data

- identity: `id`, `name`, `portrait`, `class`, `race`, `background`;
- progression: `level`, `experience`, `proficiencyBonus`;
- base stats, saves, skills, proficiencies.

### 6.2 Combat Data

- hp block: `max/current/temp`;
- AC, initiative, speed, hit dice, death saves;
- attacks/weapons/actions;
- conditions and combat trackers.

### 6.3 Magic Data

- casting ability, DC, attack bonus;
- spell slots by level + used/available state;
- known/prepared/cantrip lists;
- custom spell collections for homebrew.

### 6.4 Inventory Data

- items with quantity, tags, notes;
- currency and custom coin/resource schemas.

### 6.5 Notes / Journal

- notes, backstory, campaign log, allies/organizations;
- session notes feed (player + GM shared visibility by permission).

### 6.6 Homebrew Extensions

- `customFields[]` (typed key/value blocks);
- `customSections[]` (named arbitrary content groups);
- `customResources[]` (value/max/reset policy);
- `customResetRules[]` (short/long/custom rest behavior);
- `customFeatureBlocks[]` and `customSpellLists[]`.

### 6.7 Custom Trackers

- reusable counters with metadata:
- `id`, `label`, `current`, `max?`, `resetRule`, `visibility`.

## 7. Session Mode Structure

### Play Mode (Session UI)

- sticky top bar: character name, sync status, mode switch;
- primary quick block: HP/temp HP, conditions, rest;
- quick actions row: dice, attack, spell, note;
- compact combat and resource cards;
- large controls optimized for one-hand use.

### Edit Mode (Configuration UI)

- structured sections: core/combat/magic/inventory/notes/homebrew;
- explicit save semantics (auto local + cloud status);
- advanced forms, reorder lists, rule configuration.

## 8. GM Workspace Structure

GM workspace must include:

- party overview (all shared characters);
- character access and edit entry;
- campaign notes;
- bestiary;
- spell reference;
- initiative board;
- shared change workflow (recent updates + conflicts).

## 9. Historical Stage 1 Deliverables (Definition of Done)

In the old stage plan, Stage 1 was considered complete when:

1. Positioning and product pillars are fixed.
2. Role model (`Player`, `GM`, `Hybrid`) is explicit.
3. Five core user flows are documented and accepted.
4. Local/cloud/last-sync/conflict model is defined.
5. Character data schema is partitioned into core sections and homebrew extensions.
6. Play Mode vs Edit Mode boundaries are fixed.
7. GM workspace is treated as first-class in IA.

## 10. Notes For Implementation (Stage 2+)

- Current project already has local storage (`AsyncStorage`) and cloud sharing (`characterSheets`) foundation.
- Next stage should convert this document into:
- navigation IA updates;
- explicit mode switch and session quick actions surface;
- typed sync metadata in store;
- conflict UI for shared edits.

## 11. Stage 1 Implementation Status (2026-03-29)

Stage 1 is now anchored in codebase foundations:

1. Roles fixed (`Player`, `GM`, `Hybrid`) with persisted app-level role state.
2. Local/cloud/last-sync/conflict model formalized as typed sync state and persisted sync store.
3. Conflict policy codified in helper logic (`collectConflictPaths`, `resolveSyncStatus`).
4. Character schema extended for session/homebrew foundation (`sessionMode`, `conditions`, `customFields`, `customTrackers`, `customSections`, `customResources`, `customResetRules`, `customFeatureBlocks`, `customSpellLists`, `notesBlocks`).
5. Local data normalization added in character store to keep old records compatible with new schema.
6. Cloud DTO mapping updated to carry Stage 1 foundation fields.

Stage 1 file scope is now fully implemented in product foundation layer:

- conflict resolution entry points are available in Character Sheet;
- flow instrumentation is added for role/session/open/quick-action/conflict events.



## 12. Cross-stage Note (2026-03-29)

- Stage 3 is defined as Homebrew-first system and is documented in `docs/product-homebrew-stage-3.md`.
- Historically, Stage 1 was used for role/capability model and baseline sync/conflict policy.


