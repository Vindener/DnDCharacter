# Stage 3: Homebrew-first System

> Historical planning document.
> Do not use this as the current sprint plan.
> Current roadmap: `docs/ux-ui-roadmap.md`.

Date: 2026-03-29  
Project: Mythgate 5e Companion (mobile)

## Goal

Make character sheets usable for non-standard systems and campaign rules without breaking classic 5e structure.

- universal custom fields;
- universal custom resources;
- custom tracker templates;
- custom sections and notes groups;
- homebrew spells / abilities / feats;
- explicit Homebrew character label;
- template-first creation flow.

## Stage Order

- Stage 3 is officially Homebrew-first.
- Collaboration/sync quality focus is moved to Stage 4.
- Historically, Stage 1 (`product-foundation-stage-1.md`) was used for role model and sync policy.

## Scope Delivered In This Iteration

1. Canonical homebrew model:

- `characterTemplateId` with templates:
  - `standard-5e`
  - `homebrew-light`
  - `homebrew-heavy`
  - `caster`
  - `martial`
  - `custom-blank`
- `customResources[]` as canonical flexible resource system.
- `customNotesGroups[]` for notes groups.
- `homebrewEntries[]` with `kind: spell | ability | feat`.

2. Backward-compatible migration and normalization:

- `normalizeHomebrewV3()` on local/cloud read.
- one-way migration:
  - `customTrackers -> customResources`
  - `notesBlocks -> seeded customNotesGroups`
  - `customSpellLists/customFeatureBlocks -> homebrewEntries`
- legacy fields stay readable during transition.

3. Create Character templates (`Create-only`, `Prefill + Editable`):

- template selection in step flow;
- template prefill for resources/sections/entries;
- created character stores selected template id.

4. Homebrew UI expansion:

- Character screen now manages canonical resources.
- custom notes groups are editable and dynamic.
- custom sections and homebrew entries are editable.
- Spellbook includes core spells + homebrew spell entries.

5. Tracker templates:

- system templates are built-in.
- user templates are local-only and reusable between characters.

## UX Decisions

1. Homebrew label derives automatically:

- helper `isHomebrewCharacter(dto)` returns true when:
  - template is not `standard-5e`, or
  - canonical homebrew content exists.

2. No manual Homebrew override:

- label reflects data, not a toggle.

3. Notes model:

- legacy fixed notes are migrated to seeded groups;
- user can add/remove custom groups.

## Data & Sync Notes

- New canonical sync paths:
  - `homebrew.fields`
  - `homebrew.resources`
  - `homebrew.notes-groups`
  - `homebrew.sections`
  - `homebrew.entries`
- Homebrew conflict labels are surfaced in Character tab sections.

## Historical Definition Of Done For Stage 3

In the old stage plan, Stage 3 was considered complete when:

1. All 6 character templates can be selected at creation and prefill correctly.
2. Character Homebrew status is derived by a single helper, not ad hoc checks.
3. Legacy homebrew fields read correctly and migrate into canonical structures.
4. Character Homebrew tab supports fields/resources/sections/entries.
5. Notes are editable via custom notes groups.
6. Spellbook shows homebrew spell entries from characters.
7. System and user tracker templates can be applied, saved, and removed locally.

## Assumptions / Defaults

- No rule engine or formula automation in Stage 3 (structured-minimal only).
- User templates remain local-only in Stage 3.
- Role model and baseline sync policy from Stage 1 are unchanged.
