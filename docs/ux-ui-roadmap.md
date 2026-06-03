# UX/UI Roadmap

## Current Priority Order
1. Dice Roller + Skeleton-loader
2. Home
3. Character Sheet
4. Create Character + scroll/keyboard fix
5. Spellbook
6. Bestiary
7. Future: DM Desktop Workspace

## Product Direction
DnDCharacter is not only a mobile character sheet.
It is a DnD companion for players and DMs with local-first storage, cloud sync, shared sheets, and homebrew support.

The first polish cycle should improve visible quality without rewriting the product architecture.

## UX Principles
- Session-first UX.
- 1-2 tap actions for in-session workflows.
- Clear Play Mode vs Edit Mode separation.
- Local-first, Cloud-enhanced.
- Skeleton for loading.
- Explicit empty, error, offline, pending-sync, and conflict states.
- Android-first usability.

## Screen Priorities

### Dice Roller
Priority:
- make dice rolling visually clear and satisfying;
- support d20 logic, common dice, modifiers, advantage, and disadvantage;
- show formula, raw rolls, used roll, and total;
- keep roll history;
- prepare reusable dice logic for Character Sheet integration.

Out of scope for the first pass:
- full Character Sheet redesign;
- DM Desktop;
- Firebase schema changes.

### Home
Priority:
- make Home a fast start center, not a static menu;
- show continue session;
- show character cards with Local/Cloud/Shared state;
- expose quick actions for Create Character, Roll Dice, Spellbook, Bestiary, and DM tools;
- show sync/offline/conflict status.

### Character Sheet
Priority:
- make Character Sheet session-first;
- keep HP, AC, initiative, attacks, spells, conditions, and quick notes visible;
- separate Play Mode from Edit Mode;
- make roll actions available next to stats, saves, skills, attacks, and spells.

### Create Character
Priority:
- turn Create Character into a wizard;
- fix scroll and keyboard behavior;
- follow DnD character creation flow;
- preserve partial draft data while navigating between steps.

### Spellbook
Priority:
- make Spellbook useful during a session;
- support fast search and filters;
- preserve complete spell metadata;
- support favorites/prepared/known/custom states;
- integrate with Character Sheet magic workflows.

### Bestiary
Priority:
- make Bestiary a DM combat tool, not only a reference list;
- expose AC, HP, speed, CR, traits, actions, reactions, and quick attack data;
- support search, filters, pinned monsters, and encounter preparation.

### Future: DM Desktop Workspace
DM Desktop Workspace is a later larger direction.
Do not start it during the first UX/UI polish cycle unless explicitly requested.
