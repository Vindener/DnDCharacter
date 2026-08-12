# Stage 5: GM Experience Redesign (GM-first Mode)

> Historical planning document.
> Do not use this as the current sprint plan.
> Current roadmap: `docs/ux-ui-roadmap.md`.

Date: 2026-03-29
Project: Mythgate 5e Companion (mobile)

## Goal

Make GM workflow a first-class mode, not a player sheet extension.

- dedicated GM dashboard and flows;
- campaign-aware party operations;
- cloud/offline campaign notes with conflict handling;
- quick edit for shared player sheets with GM attribution;
- encounter prep handoff into initiative.

Cross-stage alignment:
- Historically, Stage 1 was used for role model and sync conflict baseline.
- Historically, Stage 2 was used for play/edit separation.
- Historically, Stage 3 was used for homebrew canonical model.
- Historically, Stage 4 was used for sync/share/attribution terminology.

## Scope Delivered

1. GM dashboard IA redesign:
- `Party Overview` block;
- `Shared Character Access + Quick Edit` block;
- `Campaign Notes` block;
- `Encounter Prep Starter` block;
- `Recent Shared Changes` block;
- quick reference entrypoints to `Bestiary`, `Spellbook`, `Initiative`.

2. GM stack extensions:
- `DMPartyOverview`;
- `DMQuickEdit({ characterId })`;
- `DMCampaignNotes({ campaignId? })`;
- `DMEncounterPrep({ campaignId? })`.

3. Campaign core (MVP+):
- `campaignId` added to character schema;
- dedicated campaign entities (`dmCampaigns`) with local cache + cloud sync;
- migration path from legacy `character.campaign` to `campaignId`;
- party grouping by campaign id with legacy fallback.

4. Campaign notes (Cloud + Offline):
- dedicated campaign notes entities (`dmCampaignNotes`);
- local cache + offline queue (`upsert/delete`);
- shared sync states aligned with Stage 4 labels;
- note-level conflict entry with explicit resolution actions:
  - keep local
  - keep cloud
  - merge manual

5. Expanded GM quick edit:
- HP/current/temp;
- conditions;
- initiative and AC;
- spell slots (used/max quick adjustments);
- custom resources;
- inventory add/remove;
- short note append;
- quick edit pushes shared history with `actorRole: GM`.

6. Encounter prep starter flow:
- select campaign;
- auto-pull party from campaign-linked characters;
- add monsters from bestiary (pinned-first);
- difficulty preview via encounter thresholds;
- initiative seed handoff in one action.

## Data and Interface Notes

- `CharacterDto` now includes `campaignId?: string`; legacy `campaign?: string` is preserved.
- New GM domain types:
  - `DMCampaign`
  - `DMCampaignNote`
  - `DMCampaignNoteSyncState`
  - `EncounterPrepDraft`
  - `InitiativeSeed`
- `Initiative` route now accepts optional seed payload from encounter prep.

## Firestore Access Model

New collections follow owner/editor model consistent with Stage 1 capabilities:
- `dmCampaigns`
- `dmCampaignNotes`

Rules mirror `characterSheets` semantics:
- owner has full update rights;
- editor can update content fields but cannot mutate ownership arrays.

## Historical Acceptance Signals

In the old stage plan, Stage 5 was considered complete when:

1. GM has a dedicated dashboard with GM-native IA and workflows.
2. Party overview is campaign-aware and not limited to local characters.
3. GM can quick-edit shared sheets without entering full player edit flow.
4. Campaign notes remain usable offline and synchronize once online.
5. Note conflicts are explicit and resolvable in-app.
6. Encounter prep can start initiative with prefilled lineup.
7. Recent shared changes are visible in dashboard and link to deep queue.

## Assumptions

- Owner/editor model remains unchanged (no granular ACL in Stage 5).
- No rules automation engine in this stage.
- Bestiary and Spellbook remain standalone screens with GM quick access.
