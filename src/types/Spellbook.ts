export type SpellbookSource = 'system' | 'custom' | 'imported';
export type Dnd5DamageType =
  | 'acid'
  | 'bludgeoning'
  | 'cold'
  | 'fire'
  | 'force'
  | 'lightning'
  | 'necrotic'
  | 'piercing'
  | 'poison'
  | 'psychic'
  | 'radiant'
  | 'slashing'
  | 'thunder';

export interface SpellDamageProfile {
  id: string;
  label: string;
  formula: string;
  damageType: Dnd5DamageType;
  condition?: string;
}

export interface SpellbookSpell {
  id: string;
  name: string;
  level: number;
  school: string;
  description: string;
  tags: string[];
  damageProfiles: SpellDamageProfile[];
  source: SpellbookSource;
  createdAt: number;
  updatedAt: number;
}

export interface UpsertSpellbookSpellInput {
  spellId?: string;
  name: string;
  level?: number;
  school?: string;
  description?: string;
  tags?: string[];
  damageProfiles?: Array<Omit<SpellDamageProfile, 'id'> | SpellDamageProfile>;
}

export type CharacterSpellStatus = 'available' | 'known' | 'prepared' | 'cantrip';
