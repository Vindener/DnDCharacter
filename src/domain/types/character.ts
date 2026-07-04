import type { DeathSaves } from '@/types/DeathSaves';
import type { HitPoints } from '@/types/HitPoints';
import type { SavingThrows } from '@/types/SavingThrows';
import type { Skills } from '@/types/Skills';
import type { Spells } from '@/types/Spells';
import type { Stats } from '@/types/Stats';
import type { Traits } from '@/types/Traits';
import type { Weapon } from '@/types/Weapon';

export type CustomFieldType = 'text' | 'number' | 'boolean' | 'select';
export type CharacterTemplateId = 'standard-5e' | 'homebrew-light' | 'homebrew-heavy' | 'caster' | 'martial' | 'custom-blank';
export type SkillProficiencyRank = 'none' | 'half' | 'proficient' | 'expertise';

export interface CharacterEquipment {
  armor?: string;
  shield?: string;
  attunedItems?: string[];
  carryingCapacity?: number;
}

export interface CharacterCustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  value: string | number | boolean;
  options?: string[];
}

export type TrackerResetRule = 'none' | 'short-rest' | 'long-rest' | 'session';
export type TrackerVisibility = 'player' | 'dm' | 'both';

export interface CharacterTracker {
  id: string;
  label: string;
  current: number;
  max?: number;
  resetRule: TrackerResetRule;
  visibility?: TrackerVisibility;
  color?: string;
}

export interface CharacterCustomSection {
  id: string;
  title: string;
  content: string;
}

export interface CharacterCustomResource {
  id: string;
  label: string;
  current: number;
  max?: number;
  resetRule: TrackerResetRule;
  visibility?: TrackerVisibility;
  color?: string;
}

export interface CharacterCustomResetRule {
  id: string;
  targetId: string;
  trigger: 'short-rest' | 'long-rest' | 'session-start';
  mode: 'set' | 'increment' | 'decrement';
  value: number;
}

export interface CharacterCustomFeatureBlock {
  id: string;
  title: string;
  entries: string[];
}

export interface CharacterCustomSpellList {
  id: string;
  title: string;
  spells: string[];
}

export type HomebrewEntryKind = 'spell' | 'ability' | 'feat';

export interface CharacterHomebrewEntry {
  id: string;
  kind: HomebrewEntryKind;
  name: string;
  description: string;
  tags: string[];
  activation?: 'action' | 'bonus' | 'reaction' | 'passive' | 'special';
  linkedResourceId?: string;
}

export interface CharacterCustomNotesGroup {
  id: string;
  title: string;
  content: string;
  order: number;
  origin: 'seeded' | 'custom';
}

export interface CharacterNotesBlocks {
  session?: string;
  campaign?: string;
  goals?: string;
  relationships?: string;
  quests?: string;
}

export interface CharacterCombatTemplates {
  actions?: string[];
  bonusActions?: string[];
  reactions?: string[];
}

export type CharacterContentOrigin = 'srd-5.1' | 'homebrew' | 'custom' | 'legacy-custom';

export interface CharacterContentSourceRef {
  origin: CharacterContentOrigin;
  source?: 'srd-5.1' | 'homebrew' | 'user-custom';
  license?: 'ogl-1.0a' | 'custom' | 'unknown';
  id?: string;
  name?: string;
  legacyCustom?: boolean;
}

export interface CharacterContentSources {
  race?: CharacterContentSourceRef;
  subrace?: CharacterContentSourceRef;
  class?: CharacterContentSourceRef;
  background?: CharacterContentSourceRef;
  featuresAndTraits?: CharacterContentSourceRef[];
  equipment?: CharacterContentSourceRef[];
}

export interface CharacterModelBase {
  schemaVersion?: number;
  id: string;
  name: string;
  class: string;
  subclass?: string;
  classId?: string;
  race: string;
  subrace?: string;
  raceId?: string;
  subraceId?: string;
  background?: string;
  backgroundId?: string;
  contentSources?: CharacterContentSources;
  level: number;
  experience: number;
  initiative: number;
  speed: number;
  ac: number;
  proficiencyBonus?: number;
  alignment?: string;
  currency?: string;
  stats: Stats;
  savingThrows: SavingThrows;
  skills: Skills;
  skillProficiencies?: Partial<Record<keyof Skills, SkillProficiencyRank>>;
  proficiencies: string[];
  hp: HitPoints;
  hitDice: string;
  deathSaves: DeathSaves;
  inventory: string[];
  armorClassDetails?: string;
  equipment?: CharacterEquipment;
  weapons?: Weapon[];
  tools?: string[];
  traits: Traits;
  featuresAndTraits?: string[];
  spells: Spells;
  notes?: string;
  alliesAndOrganizations?: string;
  backstory?: string;
  campaign?: string;
  campaignId?: string;
  photoUri?: string;
  coins?: {
    gold: number;
    silver: number;
    copper: number;
  };
  customCoins?: Record<string, number>;
  characterTemplateId?: CharacterTemplateId;
  sessionMode?: boolean;
  conditions?: string[];
  customFields?: CharacterCustomField[];
  customTrackers?: CharacterTracker[];
  customSections?: CharacterCustomSection[];
  customResources?: CharacterCustomResource[];
  customResetRules?: CharacterCustomResetRule[];
  customFeatureBlocks?: CharacterCustomFeatureBlock[];
  customSpellLists?: CharacterCustomSpellList[];
  customNotesGroups?: CharacterCustomNotesGroup[];
  homebrewEntries?: CharacterHomebrewEntry[];
  notesBlocks?: CharacterNotesBlocks;
  combatTemplates?: CharacterCombatTemplates;
}

export type CharacterEntity = CharacterModelBase;

export type CharacterDto = CharacterModelBase;

export type CharacterDraft = Partial<Omit<CharacterEntity, 'id'>> & { id?: string };

export type CharacterViewModel = CharacterEntity;

