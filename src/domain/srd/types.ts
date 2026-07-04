import type { ContentLicense, ContentSource } from '@/domain/types/sourceMetadata';
import type { Skills } from '@/types/Skills';
import type { Stats } from '@/types/Stats';

export type SrdAbilityId = keyof Stats;
export type SrdSkillId = keyof Skills;

export interface SrdContentBase {
  id: string;
  name: string;
  source: Extract<ContentSource, 'srd-5.1'>;
  license: Extract<ContentLicense, 'ogl-1.0a'>;
  tags: string[];
}

export interface SrdFeatureBase extends SrdContentBase {
  summary: string;
}

export interface SrdFlexibleAbilityScoreIncrease {
  count: number;
  amount: number;
  exclude?: SrdAbilityId[];
}

export interface SrdSubrace extends SrdContentBase {
  abilityScoreIncreases?: Partial<Record<SrdAbilityId, number>>;
  flexibleAbilityScoreIncrease?: SrdFlexibleAbilityScoreIncrease;
  languages?: string[];
  traits: SrdFeatureBase[];
}

export interface SrdRace extends SrdContentBase {
  speed: number;
  abilityScoreIncreases?: Partial<Record<SrdAbilityId, number>>;
  flexibleAbilityScoreIncrease?: SrdFlexibleAbilityScoreIncrease;
  languages: string[];
  traits: SrdFeatureBase[];
  subraces: SrdSubrace[];
}

export interface SrdSkillChoice {
  choose: number;
  from: SrdSkillId[];
}

export interface SrdStartingEquipment {
  base: string[];
  choices: Array<{
    label: string;
    options: string[];
  }>;
}

export interface SrdClassFeature extends SrdFeatureBase {
  level: number;
}

export interface SrdClass extends SrdContentBase {
  hitDie: number;
  primaryAbilities: SrdAbilityId[];
  savingThrows: SrdAbilityId[];
  proficiencies: string[];
  spellcastingAbility?: SrdAbilityId;
  skillChoices: SrdSkillChoice;
  startingEquipment: SrdStartingEquipment;
  features: SrdClassFeature[];
}

export interface SrdClassProgressionLevel {
  level: number;
  proficiencyBonus: number;
  features: string[];
}

export interface SrdClassProgression extends Omit<SrdContentBase, 'name'> {
  classId: string;
  levels: SrdClassProgressionLevel[];
}

export interface SrdEquipmentItem extends SrdContentBase {
  category: string;
}

export type SrdCondition = SrdFeatureBase;

export interface SrdSkill extends SrdContentBase {
  ability: SrdAbilityId;
}

export interface SrdLanguage extends SrdContentBase {
  category: 'standard' | 'exotic';
}

export interface SrdBackground extends SrdContentBase {
  skills: SrdSkillId[];
  tools: string[];
  languages: number;
  equipment: string[];
  feature: SrdFeatureBase;
  startingGold: number;
}
