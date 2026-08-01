import { describe, expect, it } from 'vitest';
import { rollInitiativeFor, sortByInitiative } from '@/dm/domain/initiative';
import type { InitiativeCombatant } from '@/dm/domain/types';

function combatant(overrides: Partial<InitiativeCombatant>): InitiativeCombatant {
  return {
    id: 'c-1',
    name: 'Test',
    source: 'player',
    roll: 0,
    initiativeMod: 0,
    hpCurrent: 10,
    conditions: [],
    defeated: false,
    order: 0,
    ...overrides,
  };
}

describe('dm/domain/initiative/roll', () => {
  it('rolls 1d20 + modifier and reports the total', () => {
    const result = rollInitiativeFor(3, 'Aragorn', () => 0.5);
    expect(result.rolls).toEqual([11]);
    expect(result.total).toBe(14);
  });

  it('sorts combatants by roll descending', () => {
    const sorted = sortByInitiative([
      combatant({ id: 'a', roll: 10, initiativeMod: 0 }),
      combatant({ id: 'b', roll: 18, initiativeMod: 0 }),
      combatant({ id: 'c', roll: 14, initiativeMod: 0 }),
    ]);

    expect(sorted.map((c) => c.id)).toEqual(['b', 'c', 'a']);
    expect(sorted.map((c) => c.order)).toEqual([0, 1, 2]);
  });

  it('breaks a tied roll by higher initiative modifier', () => {
    const sorted = sortByInitiative([
      combatant({ id: 'low-mod', roll: 15, initiativeMod: 1 }),
      combatant({ id: 'high-mod', roll: 15, initiativeMod: 4 }),
    ]);

    expect(sorted.map((c) => c.id)).toEqual(['high-mod', 'low-mod']);
  });

  it('falls back to original array order when roll and modifier both tie', () => {
    const sorted = sortByInitiative([
      combatant({ id: 'first', roll: 12, initiativeMod: 2 }),
      combatant({ id: 'second', roll: 12, initiativeMod: 2 }),
    ]);

    expect(sorted.map((c) => c.id)).toEqual(['first', 'second']);
  });
});
