import { describe, expect, it } from 'vitest';
import { designTokens, fontSize, fs, radius, rd, space, sp, typography } from '@/shared/styles/tokens';

describe('design tokens', () => {
  it('resolves spacing canonical and compatibility values', () => {
    expect(space('md')).toBe(8);
    expect(sp('xl')).toBe(12);
    expect(space(13)).toBe(13);
    expect(space(999)).toBe(999);
  });

  it('resolves radii canonical and compatibility values', () => {
    expect(radius('lg')).toBe(10);
    expect(rd('pill')).toBe(99);
    expect(radius(37)).toBe(37);
  });

  it('resolves typography sizes and variants', () => {
    expect(fontSize('body')).toBe(13);
    expect(fs(21)).toBe(21);

    const title = typography('title');
    expect(title.fontSize).toBe(18);
    expect(title.fontWeight).toBe('700');
    expect(title.lineHeight).toBe(26);
  });

  it('exposes design tokens contract', () => {
    expect(designTokens.spacing.md).toBe(8);
    expect(designTokens.radius.round).toBe(999);
    expect(designTokens.typography.variants.body.fontSize).toBe(13);
  });
});
