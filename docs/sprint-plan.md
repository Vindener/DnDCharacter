# Sprint Plan

## Sprint 1: Dice Roller + Skeleton-loader

Goal:
Improve the dice experience and loading UX.

Scope:
- Dice UI polish.
- d20, d4, d6, d8, d10, d12, d100.
- Modifiers.
- Advantage/disadvantage.
- Roll history.
- Reusable dice logic.
- Skeleton components.
- Skeleton on Home, Character, Spellbook, and Bestiary.

Out of scope:
- Full Character Sheet redesign.
- DM Desktop.
- Firebase schema changes.

Definition of Done:
- Dice can be rolled normally.
- d20 supports advantage/disadvantage.
- Roll result shows formula and total.
- Skeleton appears during loading.
- Empty state does not appear during loading.

## Sprint 2: Home

Goal:
Make Home a fast start center for active play.

Scope:
- Continue Session block.
- Character cards with HP, AC, initiative, and sync/share badges.
- Quick actions for Create Character, Roll Dice, Spellbook, Bestiary, and DM tools.
- DM preview when DM data exists.
- Sync status strip.

Out of scope:
- Full DM Desktop.
- New cloud schema.
- Deep Character Sheet redesign.

Definition of Done:
- Home answers "What can I continue right now?"
- Loading, empty, offline, pending-sync, and conflict states are explicit.
- Quick actions navigate to the correct screens.

## Sprint 3: Character Sheet

Goal:
Make Character Sheet the primary in-session gameplay screen.

Scope:
- Play Mode and Edit Mode separation.
- Combat Summary Card.
- Quick Action Bar.
- Roll actions near abilities, saves, skills, attacks, damage, and spells.
- Better visibility for HP, AC, initiative, speed, proficiency, spell slots, conditions, and notes.

Out of scope:
- Full rule automation engine.
- DM Desktop.
- Broad data model rewrite unless required by the screen polish.

Definition of Done:
- Session-critical information is visible quickly.
- Play Mode is not a heavy form.
- Edit Mode remains available for full configuration.

## Sprint 4: Create Character + Scroll/Keyboard Fix

Goal:
Make character creation guided, understandable, and usable on small screens.

Scope:
- Wizard flow.
- Scroll/keyboard behavior fix.
- Sticky Back/Next actions with safe content padding.
- Steps for identity, race/class/background, stats, combat, equipment, magic, personality, storage/share, and review.
- Partial draft preservation.

Out of scope:
- Replacing navigation architecture.
- Firebase schema changes.
- Full homebrew rule engine.

Definition of Done:
- User can complete character creation without fields hidden by keyboard/footer.
- Back/Next does not lose entered data.
- Review screen shows the important mechanical summary.

## Sprint 5: Spellbook

Goal:
Make Spellbook an in-session tool for players and DMs.

Scope:
- Search.
- Filters by level, class, school, ritual, and concentration.
- Tabs for all/prepared/known/favorites/custom.
- Complete spell cards and detail view.
- Character integration for prepared/known/favorite state.

Out of scope:
- Full spell rules automation.
- DM Desktop.
- New remote schema unless explicitly needed.

Definition of Done:
- Spell lookup is fast during play.
- Spell metadata is preserved.
- Empty/search-no-results/filter states are clear.

## Sprint 6: Bestiary

Goal:
Make Bestiary a fast DM encounter tool.

Scope:
- Search.
- Filters by CR, type, environment, size, source, and favorites.
- Monster cards with AC, HP, speed, CR, and main attack data.
- Monster detail with traits, actions, reactions, and notes.
- Pin/add-to-encounter flow.

Out of scope:
- Full encounter builder rewrite.
- DM Desktop.
- Automated balancing engine unless explicitly requested.

Definition of Done:
- DM can quickly find, inspect, pin, and prepare monsters.
- Monster mechanical data is not hidden deep in long text.
- Loading, empty, and search states are clear.

## Future Sprint: DM Desktop Workspace

Goal:
Create a larger DM workspace after the mobile player/DM UX polish cycle.

Scope ideas:
- campaign workspace;
- party overview;
- encounter builder;
- notes and secrets;
- shared character timeline;
- desktop-first layouts.

Do not start this sprint during the first polish cycle unless explicitly requested.
