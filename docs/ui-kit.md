# UI Kit and Design Tokens

Date: 2026-04-06

## Purpose

This project uses a unified style system for:
- spacing;
- typography;
- radii.

Use token helpers instead of raw numeric literals in style objects.

## Token Helpers

Import from `@/shared/styles/tokens`:

- `sp(value)` for spacing (`padding`, `margin`, `gap`)
- `fs(value)` for `fontSize`
- `rd(value)` for `borderRadius`

Examples:

```ts
padding: sp(12),
fontSize: fs(14),
borderRadius: rd(10),
```

## Typography

Use `typography(variant)` and `Text` component variants for consistent text rhythm.

Supported variants:

- `caption`
- `bodySm`
- `body`
- `bodyLg`
- `label`
- `subtitle`
- `titleSm`
- `title`
- `titleLg`
- `display`

## Base UI Components

Import from `@/shared/ui`:

- `Screen`
- `Card`
- `Button`
- `Text`
- `Input`
- `Chip`
- `Section`

Guidelines:

- Prefer these primitives for new UI code.
- Interactive elements should use `Pressable` (with `android_ripple` where appropriate).
- Keep business logic outside UI primitives.

## Guardrails

Use:

```bash
npm run lint:ui
```

`lint:ui` is a soft report. It lists raw spacing/typography/radius literals and exits successfully.

## Skeleton UI

New loading components should follow the same token system:

- `sp()` for spacing
- `fs()` for typography
- `rd()` for radius
- shared UI primitives where possible

Skeletons should match the shape of the real content and avoid layout jumps.

## Allowed and Disallowed

Allowed:

- `padding: sp(12)`
- `fontSize: fs(14)`
- `borderRadius: rd(12)`

Disallowed in new code:

- `padding: 12`
- `fontSize: 14`
- `borderRadius: 12`
