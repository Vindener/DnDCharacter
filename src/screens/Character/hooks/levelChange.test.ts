import { describe, expect, it } from 'vitest';
import { applyLevelChange, buildNextHitDice, MAX_CHARACTER_LEVEL, MIN_CHARACTER_LEVEL, type LevelChangeDraftValues } from './levelChange';

const baseDraft: LevelChangeDraftValues = {
  stats: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  hp: {
    current: 8,
    max: 8,
  },
  ac: 12,
  initiative: 2,
  proficiencyBonus: 2,
};

describe('levelChange helpers', () => {
  it('clamps target level into 1..20 range', () => {
    const low = applyLevelChange({ level: 3, experience: 999, hitDice: '3d8', hpTemp: 0 }, -5, baseDraft);
    const high = applyLevelChange({ level: 3, experience: 999, hitDice: '3d8', hpTemp: 0 }, 999, baseDraft);

    expect(low.level).toBe(MIN_CHARACTER_LEVEL);
    expect(high.level).toBe(MAX_CHARACTER_LEVEL);
  });

  it('keeps XP unchanged on level transitions', () => {
    const next = applyLevelChange({ level: 5, experience: 12345, hitDice: '5d10', hpTemp: 4 }, 6, baseDraft);

    expect(next.experience).toBe(12345);
  });

  it('updates hit dice count by level delta and preserves sides', () => {
    expect(buildNextHitDice('5d10', 5, 6)).toBe('6d10');
    expect(buildNextHitDice('5d10', 5, 4)).toBe('4d10');
    expect(buildNextHitDice('1d6', 1, 1)).toBe('1d6');
  });

  it('validates and clamps draft fields', () => {
    const next = applyLevelChange({ level: 4, experience: 50, hitDice: '4d8', hpTemp: -5 }, 3, {
      stats: {
        strength: -10,
        dexterity: 0,
        constitution: 1.4,
        intelligence: 17.8,
        wisdom: 14,
        charisma: 12,
      },
      hp: {
        current: 999,
        max: 0,
      },
      ac: -100,
      initiative: -8,
      proficiencyBonus: 55,
    });

    expect(next.stats.strength).toBe(1);
    expect(next.stats.dexterity).toBe(1);
    expect(next.stats.intelligence).toBe(18);
    expect(next.hp.max).toBe(1);
    expect(next.hp.current).toBe(1);
    expect(next.hp.temp).toBe(0);
    expect(next.ac).toBe(0);
    expect(next.initiative).toBe(0);
    expect(next.proficiencyBonus).toBe(10);
  });

  it('keeps hit dice stable when target level is unchanged', () => {
    const next = applyLevelChange({ level: 7, experience: 777, hitDice: '7d12', hpTemp: 1 }, 7, baseDraft);

    expect(next.level).toBe(7);
    expect(next.hitDice).toBe('7d12');
  });
});
