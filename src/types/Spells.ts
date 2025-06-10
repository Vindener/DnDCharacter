import { SpellSlots } from './SpellSlots';

export interface Spells {
  spellcastingAbility: string;
  spellSaveDC: number;
  spellAttackBonus: number;
  spellSlots: SpellSlots;
  knownSpells: string[];
  preparedSpells: string[];
  cantrips: string[];
}
