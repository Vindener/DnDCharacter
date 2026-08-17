# Stage 2: Redesign Character Experience

> Historical planning document.
> Do not use this as the current sprint plan.
> Current roadmap: `docs/ux-ui-roadmap.md`.

Date: 2026-03-29
Project: Mythgate 5e Companion (mobile)

## Goal

Make character sheet a true in-session core feature that can replace paper sheets:

- faster actions during play;
- clear Play vs Edit separation;
- less cognitive load;
- first-class homebrew support;
- visible sync/context status.

Note on cross-stage consistency:

- Historically, Stage 1 (`product-foundation-stage-1.md`) was used for role model and sync policy.
- Stage 2 terminology follows Stage 1 role set: `Player`, `GM`, `Hybrid`.

## Scope Delivered In This Iteration

1. Character screen redesign foundations:

- `Play Mode / Edit Mode` toggle;
- `Session Mode` toggle;
- `Combat Summary Card`;
- `Quick Action Bar` (`-HP`, `+HP`, `Temp HP`, `Roll`, `Short Rest`, `Long Rest`, `Condition`, `Note`);
- tabs: `Overview`, `Combat`, `Magic`, `Inventory`, `Notes`, `Homebrew`;
- collapsible secondary sections to reduce noise;
- separate notes domain (`notesBlocks`) from system mechanics;
- custom fields and flexible trackers UI in Homebrew tab.

2. Data model extension for redesign:

- `sessionMode`;
- `conditions`;
- `customFields`;
- `customTrackers`;
- `notesBlocks`;
- persisted in local + cloud DTO mapping.

3. Home redesign foundations:

- role switch (`Player`, `GM`, `Hybrid`);
- resume block with `Continue Session`;
- live character preview cards with badges (`Local`, `Synced`, `Shared`, `Homebrew`);
- GM preview block with quick entry points;
- quick actions panel;
- sync/status strip.

4. Spellbook quick-access screen:

- added `Spellbook` route in stack;
- aggregated spells from local characters for quick lookup.

## UX Decisions (Character)

### Play Mode

- prioritized top-to-bottom:

1. identity/status
2. combat summary
3. quick actions
4. tab-specific view

- design intent:
- 1-2 tap access to session-critical actions;
- large touch targets;
- collapsed secondary data by default in non-primary tabs.

### Edit Mode

- structured per tab (not mixed into play surface):
- `Overview`: identity/progression;
- `Combat`: HP/AC/speed/initiative;
- `Magic`: casting config, spell lists, slots;
- `Inventory`: items/notes/currency;
- `Notes`: session/campaign/goals/relationships/quests;
- `Homebrew`: custom fields + trackers.

## UI/UX Plan By Screens (A–E)

### A. Home

Target role: action hub.

Current implementation baseline:

- role switch;
- resume and continue session;
- character cards with statuses;
- GM preview section;
- quick actions;
- sync strip.

Next pass:

- prioritize “last active session” timeline;
- add explicit cloud conflict badges;
- add “pending shared updates” drill-down screen.

### B. Character Sheet

Implemented as Stage 2 core.

Next pass:

- add richer combat action templates (actions/bonus/reactions);
- add explicit conflict indicator on field level;
- add tab-level per-user change history for shared sheets.

### C. Create Character

Stage 2 decision:

- keep existing multi-step flow now;
- align it with target 7-step onboarding in next dedicated pass.

Next pass targets:

- start-method step;
- storage/share step (`Local only` vs `Local + Cloud`);
- review with explicit sync onboarding hints.

### D. GM

Current project state:

- GM entry and tools exist, but still broad.

Next pass targets:

- party overview as primary card;
- shared sheet management lane;
- session tools lane;
- campaign tools lane;
- recent shared updates workflow.

### E. Bestiary

Current project state:

- list + details present.

Next pass targets:

- stronger filters (`CR`, `type`, `environment`, `source`, tags);
- collapsible long sections;
- GM quick view and encounter pinning.

## Historical Definition Of Done For Stage 2

In the old stage plan, Stage 2 was considered complete when:

1. Character screen has Play/Edit split with session-first quick action flow.
2. Session-critical stats are always visible in Combat Summary Card.
3. Tabs reflect product information architecture.
4. Notes and system mechanics are separated.
5. Homebrew fields and trackers are directly manageable in UI.
6. Home acts as launch center, not static list.

## Next Step

Stage 3 should focus on Homebrew-first system quality:

- canonical homebrew model (`characterTemplateId`, `customResources`, `customNotesGroups`, `homebrewEntries`);
- template-driven Create Character flow (`standard-5e`, `homebrew-light`, `homebrew-heavy`, `caster`, `martial`, `custom-blank`);
- migration and normalization from legacy fields (`customTrackers`, `notesBlocks`, `customSpellLists`, `customFeatureBlocks`);
- derived Homebrew badge logic and expanded Homebrew/Spellbook UX.

Stage 4 should focus on shared collaboration quality:

- explicit sync state model in store;
- conflict review UI;
- GM party-first workflows and shared change timeline.
