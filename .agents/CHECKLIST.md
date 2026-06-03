# CHECKLIST.md

## Before UX/UI Changes
- Read the target screen.
- Read related styles/components.
- Check navigation params.
- Check related store/service if data is involved.
- Check loading, empty, error, offline, pending-sync, and conflict states.
- Check Android small-screen behavior.

## Loading States
- Use skeleton for data loading.
- Do not show empty state while data is still loading.
- Error state has priority over skeleton.
- Offline/pending-sync state must be visible where relevant.
- Skeleton should match the shape of the final content.

## DnD Correctness
- d20 rolls must support modifier, advantage, and disadvantage.
- Attack roll and damage roll must not be mixed.
- Critical success/failure applies to natural d20 results, not damage dice.
- Character Sheet must keep HP, AC, initiative, speed, proficiency, and conditions visible.
- Spellbook must preserve spell level, school, casting time, range, components, duration, and concentration/ritual tags.
- Bestiary must preserve AC, HP, speed, CR, traits, actions, and reactions.

## Mobile Usability
- Prefer Android-friendly touch targets.
- Avoid fixed footers that hide final form fields.
- Add enough `ScrollView` bottom padding when sticky actions exist.
- Use `keyboardShouldPersistTaps="handled"` where form interactions need it.
- Verify small-screen layout for dense cards, tabs, and action bars.

## Before Finishing
- Confirm imports are correct.
- Confirm no new `any` was introduced.
- Confirm Android interaction feedback is acceptable.
- Confirm formatting is clean.
- Run the narrowest useful validation command that exists.

## In The Final Report
- List changed files.
- State what behavior changed.
- State what was not changed.
- Mention validation commands actually run.
- Mention remaining technical debt if relevant.
