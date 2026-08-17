import { describe, expect, it } from 'vitest';
import { evaluateEncounterDifficulty, getMonsterMultiplier } from '@/dm/domain/encounter';

describe('dm/domain/encounter/calculator', () => {
  it('calculates multipliers for normal, small, and large parties', () => {
    expect(getMonsterMultiplier(1, 4)).toBe(1);
    expect(getMonsterMultiplier(2, 4)).toBe(1.5);
    expect(getMonsterMultiplier(7, 2)).toBe(3);
    expect(getMonsterMultiplier(1, 6)).toBe(0.5);
  });

  it('returns no-data when there are no monsters', () => {
    const result = evaluateEncounterDifficulty([{ level: 3 }, { level: 3 }, { level: 3 }, { level: 3 }], []);

    expect(result.adjustedXP).toBe(0);
    expect(result.xpPerPlayer).toBe(0);
    expect(result.monstersCount).toBe(0);
    expect(result.difficulty).toBe('Немає даних');
  });

  it('treats zero-count monsters as zero XP contribution', () => {
    const result = evaluateEncounterDifficulty([{ level: 5 }, { level: 5 }, { level: 5 }, { level: 5 }], [{ challenge: '10', count: 0 }]);

    expect(result.baseXP).toBe(0);
    expect(result.adjustedXP).toBe(0);
    expect(result.monstersCount).toBe(0);
  });

  it('applies higher pressure for smaller parties vs larger parties', () => {
    const smallParty = evaluateEncounterDifficulty([{ level: 5 }, { level: 5 }], [{ challenge: '2', count: 3 }]);
    const largeParty = evaluateEncounterDifficulty(
      [{ level: 5 }, { level: 5 }, { level: 5 }, { level: 5 }, { level: 5 }, { level: 5 }],
      [{ challenge: '2', count: 3 }],
    );

    expect(smallParty.multiplier).toBeGreaterThan(largeParty.multiplier);
    expect(smallParty.adjustedXP).toBeGreaterThan(largeParty.adjustedXP);
  });
});
