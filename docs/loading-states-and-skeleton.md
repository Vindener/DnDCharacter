# Loading States and Skeleton

## Purpose
Use skeleton loaders to avoid blank loading screens and layout jumps.

Skeletons should match the shape of the content that will appear after loading.

## Global Rules
- Loading state: show skeleton.
- Empty state: show only after loading finished and data is empty.
- Error state: has priority over skeleton.
- Offline state: show explicit offline/pending-sync indicator.
- Conflict state: show explicit conflict indicator where relevant.

## Screens

### Home
Skeleton for:
- continue session card;
- character cards;
- GM preview;
- sync strip.

### Character Sheet
Skeleton for:
- character header;
- combat summary;
- tabs;
- primary cards.

### Spellbook
Skeleton for:
- filters;
- spell cards;
- detail preview.

### Bestiary
Skeleton for:
- filters;
- monster cards;
- monster detail.

## Implementation Notes
Suggested shared locations:
- `src/shared/ui/Skeleton*`
- `src/shared/components/Skeleton*`

Prefer shared UI tokens:
- `sp()` for spacing;
- `fs()` for typography;
- `rd()` for radius.

Do not show a "no data" empty state while the app is still loading.
