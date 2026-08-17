import { describe, expect, it } from 'vitest';
import { computeSkillBonus, getSkillProficiencyBonus } from './derived';

describe('derived character helpers', () => {
  it('computes skill proficiency ranks from ability modifier and proficiency bonus', () => {
    const stats = {
      strength: 10,
      dexterity: 16,
      constitution: 10,
      intelligence: 10,
      wisdom: 12,
      charisma: 10,
    };

    expect(computeSkillBonus({ stats, skill: 'stealth', rank: 'expertise', proficiencyBonus: 3 })).toBe(9);
    expect(computeSkillBonus({ stats, skill: 'perception', rank: 'half', proficiencyBonus: 3 })).toBe(2);
    expect(computeSkillBonus({ stats, skill: 'athletics', rank: 'proficient', proficiencyBonus: 3 })).toBe(3);
  });

  it('preserves legacy numeric skills when metadata is absent', () => {
    expect(
      computeSkillBonus({
        stats: { strength: 8 },
        skill: 'athletics',
        proficiencyBonus: 3,
        fallbackValue: 7,
      }),
    ).toBe(7);
  });

  it('maps rank labels to numeric proficiency additions', () => {
    expect(getSkillProficiencyBonus(undefined, 4)).toBe(0);
    expect(getSkillProficiencyBonus('none', 4)).toBe(0);
    expect(getSkillProficiencyBonus('half', 4)).toBe(2);
    expect(getSkillProficiencyBonus('proficient', 4)).toBe(4);
    expect(getSkillProficiencyBonus('expertise', 4)).toBe(8);
  });
});
