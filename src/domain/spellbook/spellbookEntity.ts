import type { ContentLicense, ContentSource } from '@/domain/types/sourceMetadata';

export type SpellbookSource = ContentSource | 'imported';
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

export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: string;
}

export interface SpellbookSpell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: SpellComponents;
  duration: string;
  description: string;
  higherLevels: string;
  classes: string[];
  tags: string[];
  ritual: boolean;
  concentration: boolean;
  damageProfiles: SpellDamageProfile[];
  source: SpellbookSource;
  license: ContentLicense;
  createdAt: number;
  updatedAt: number;
}

export interface UpsertSpellbookSpellInput {
  spellId?: string;
  name: string;
  level?: number;
  school?: string;
  castingTime?: string;
  range?: string;
  components?: SpellComponents | string;
  duration?: string;
  description?: string;
  higherLevels?: string;
  classes?: string[] | string;
  tags?: string[];
  ritual?: boolean;
  concentration?: boolean;
  damageProfiles?: Array<Omit<SpellDamageProfile, 'id'> | SpellDamageProfile>;
  source?: SpellbookSource;
  license?: ContentLicense;
}

export type CharacterSpellStatus = 'available' | 'known' | 'prepared' | 'cantrip';
