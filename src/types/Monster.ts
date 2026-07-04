import type { ContentLicense, ContentSource } from '@/domain/types/sourceMetadata';

export interface MonsterActionDto {
  name: string;
  description: string;
}

export interface MonsterDto {
  id: string;
  name: string;
  size?: string;
  type?: string;
  alignment?: string;
  challenge?: string;
  challengeRating?: string;
  xp?: number;
  environment?: string;
  source?: ContentSource | 'imported' | string;
  license?: ContentLicense;
  tags?: string[];
  armorClass?: number;
  hitPoints?: number;
  hitDice?: string;
  speed?: string;
  savingThrows?: string;
  skills?: string;
  damageVulnerabilities?: string;
  damageResistances?: string;
  damageImmunities?: string;
  conditionImmunities?: string;
  senses?: string;
  languages?: string;
  traits?: string;
  reactions?: string;
  legendaryActions?: string;
  normalizedTraits?: MonsterActionDto[];
  normalizedActions?: MonsterActionDto[];
  normalizedReactions?: MonsterActionDto[];
  normalizedLegendaryActions?: MonsterActionDto[];
  mainAttack?: string;
  attackBonus?: string;
  damage?: string;
  isCustom?: boolean;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  actions?: string;
  photoUri?: string;
  notes?: string;
}
