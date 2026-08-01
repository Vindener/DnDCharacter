import { rollDice, type DiceRollResult } from '@/shared/services/diceRoller';
import type { InitiativeCombatant } from '@/dm/domain/types';

export function rollInitiativeFor(modifier: number, label?: string, random?: () => number): DiceRollResult {
  return rollDice({ dice: 'd20', modifier, label, random });
}

// Stable sort: roll desc, tie-break by modifier desc (5e RAW: higher DEX wins ties),
// then original array position. Reassigns `order` to the resulting position so the
// GM's later drag-reorder has an authoritative field to write back to.
export function sortByInitiative(combatants: InitiativeCombatant[]): InitiativeCombatant[] {
  return combatants
    .map((combatant, index) => ({ combatant, index }))
    .sort((a, b) => b.combatant.roll - a.combatant.roll || b.combatant.initiativeMod - a.combatant.initiativeMod || a.index - b.index)
    .map(({ combatant }, order) => ({ ...combatant, order }));
}
