import { describe, expect, it } from 'vitest';
import { parseSpellFormInput, safeParseSpellFormInput } from '@/domain/schemas';

describe('spell.schema', () => {
  it('parses spell form input and normalizes tags and damage profiles', () => {
    const parsed = parseSpellFormInput({
      name: ' Fireball ',
      level: '3',
      school: 'Evocation',
      description: 'Big boom',
      tags: 'aoe, fire, aoe',
      damageProfiles: 'Hit | 8d6 | fire\nFallback | 1d6 | unknown',
    });

    expect(parsed.name).toBe('Fireball');
    expect(parsed.level).toBe(3);
    expect(parsed.tags).toEqual(['aoe', 'fire']);
    expect(parsed.damageProfiles).toHaveLength(2);
    expect(parsed.damageProfiles?.[0]?.damageType).toBe('fire');
    expect(parsed.damageProfiles?.[1]?.damageType).toBe('force');
  });

  it('returns validation issue for empty name', () => {
    const result = safeParseSpellFormInput({ name: '   ', level: '1' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('name');
    }
  });
});
