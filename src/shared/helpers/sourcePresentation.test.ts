import { describe, expect, it } from 'vitest';
import { isBuiltInRulesSource, shouldDisplaySourceMetadata } from './sourcePresentation';

describe('source presentation', () => {
  it('keeps built-in rules metadata internal', () => {
    expect(isBuiltInRulesSource('srd-5.1')).toBe(true);
    expect(shouldDisplaySourceMetadata('srd-5.1')).toBe(false);
  });

  it.each(['homebrew', 'user-custom', 'imported'])('keeps %s metadata visible', (source) => {
    expect(isBuiltInRulesSource(source)).toBe(false);
    expect(shouldDisplaySourceMetadata(source)).toBe(true);
  });

  it('does not create empty metadata for a missing source', () => {
    expect(shouldDisplaySourceMetadata(undefined)).toBe(false);
    expect(shouldDisplaySourceMetadata(null)).toBe(false);
  });
});
