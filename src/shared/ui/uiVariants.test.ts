import { describe, expect, it } from 'vitest';
import { darkColors } from '@/shared/styles/theme';
import { resolveButtonVariant, resolveCardVariant, resolveTextStyleVariant } from '@/shared/ui/variantResolvers';

describe('ui variants', () => {
  it('maps button variants to themed colors', () => {
    const primary = resolveButtonVariant('primary', darkColors);
    const danger = resolveButtonVariant('danger', darkColors);
    const ghost = resolveButtonVariant('ghost', darkColors);

    expect(primary.backgroundColor).toBe(darkColors.primary);
    expect(primary.textColor).toBe(darkColors.onPrimary);
    expect(danger.backgroundColor).toBe(darkColors.danger);
    expect(ghost.borderColor).toBe(darkColors.border);
  });

  it('maps card variants to surface shape', () => {
    const base = resolveCardVariant('default', darkColors);
    const outlined = resolveCardVariant('outlined', darkColors);
    const elevated = resolveCardVariant('elevated', darkColors);

    expect(base.backgroundColor).toBe(darkColors.card);
    expect(outlined.backgroundColor).toBe(darkColors.background);
    expect(elevated.elevation).toBe(2);
  });

  it('maps text variant and explicit weight', () => {
    const body = resolveTextStyleVariant('body');
    const titleBold = resolveTextStyleVariant('title', 'bold');

    expect(body.fontSize).toBe(13);
    expect(body.lineHeight).toBe(18);
    expect(titleBold.fontWeight).toBe('700');
  });
});
