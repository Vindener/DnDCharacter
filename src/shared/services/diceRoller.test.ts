import { describe, expect, it } from 'vitest';
import { rollDice, rollFormula } from '@/shared/services/diceRoller';

function fixedRandom(...values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? values[values.length - 1] ?? 0;
}

describe('diceRoller service', () => {
  it('rolls 1d20', () => {
    const result = rollDice({ dice: 'd20', random: fixedRandom(0.6) });

    expect(result.rolls).toEqual([13]);
    expect(result.usedRoll).toBe(13);
    expect(result.total).toBe(13);
    expect(result.formula).toBe('1d20');
  });

  it('adds modifier', () => {
    const result = rollDice({ dice: 'd20', modifier: 5, random: fixedRandom(0.6) });

    expect(result.total).toBe(18);
    expect(result.modifier).toBe(5);
    expect(result.formula).toBe('1d20 + 5');
  });

  it('adds proficiency bonus when enabled', () => {
    const result = rollDice({
      dice: 'd20',
      modifier: 3,
      proficiencyBonus: 2,
      includeProficiency: true,
      random: fixedRandom(0.45),
    });

    expect(result.rolls).toEqual([10]);
    expect(result.proficiencyBonus).toBe(2);
    expect(result.total).toBe(15);
  });

  it('advantage uses highest d20', () => {
    const result = rollDice({ dice: 'd20', mode: 'advantage', random: fixedRandom(0.3, 0.75) });

    expect(result.rolls).toEqual([7, 16]);
    expect(result.usedRoll).toBe(16);
    expect(result.total).toBe(16);
  });

  it('disadvantage uses lowest d20', () => {
    const result = rollDice({ dice: 'd20', mode: 'disadvantage', random: fixedRandom(0.3, 0.75) });

    expect(result.rolls).toEqual([7, 16]);
    expect(result.usedRoll).toBe(7);
    expect(result.total).toBe(7);
  });

  it('marks critical success only on natural 20', () => {
    const result = rollDice({ dice: 'd20', modifier: -5, random: fixedRandom(0.99) });

    expect(result.rolls).toEqual([20]);
    expect(result.total).toBe(15);
    expect(result.isCriticalSuccess).toBe(true);
    expect(result.isCriticalFailure).toBe(false);
  });

  it('marks critical failure only on natural 1', () => {
    const result = rollDice({ dice: 'd20', modifier: 10, random: fixedRandom(0) });

    expect(result.rolls).toEqual([1]);
    expect(result.total).toBe(11);
    expect(result.isCriticalSuccess).toBe(false);
    expect(result.isCriticalFailure).toBe(true);
  });

  it('damage rolls do not trigger critical flags by themselves', () => {
    const result = rollDice({ dice: 'd6', count: 2, random: fixedRandom(0.99, 0.99) });

    expect(result.rolls).toEqual([6, 6]);
    expect(result.total).toBe(12);
    expect(result.isCriticalSuccess).toBe(false);
    expect(result.isCriticalFailure).toBe(false);
  });

  it('custom formula works', () => {
    const result = rollFormula({ formula: '2d6 + 3 + 1d8', random: fixedRandom(0.5, 0.1, 0.875) });

    expect(result.rolls).toEqual([4, 1, 8]);
    expect(result.usedRoll).toBe(13);
    expect(result.modifier).toBe(3);
    expect(result.total).toBe(16);
    expect(result.isCriticalSuccess).toBe(false);
  });
});
