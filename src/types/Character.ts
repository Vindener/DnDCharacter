import { Stats } from './Stats';
import { SavingThrows } from './SavingThrows';
import { Skills } from './Skills';
import { HitPoints } from './HitPoints';
import { DeathSaves } from './DeathSaves';
import { Weapon } from './Weapon';
import { Traits } from './Traits';
import { Spells } from './Spells';

export type CustomFieldType = 'text' | 'number' | 'boolean' | 'select';
export type CharacterTemplateId = 'standard-5e' | 'homebrew-light' | 'homebrew-heavy' | 'caster' | 'martial' | 'custom-blank';

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

export interface CharacterDto {
  id: string;
  name: string;
  class: string;
  subclass?: string;
  race: string;
  subrace?: string;
  background?: string;
  level: number;
  experience: number;
  initiative: number;
  speed: number;
  ac: number; // Armor Class
  proficiencyBonus?: number;
  alignment?: string;
  currency?: string; // золото
  stats: Stats;
  savingThrows: SavingThrows;
  skills: Skills;

  proficiencies: string[]; // навички, інструменти, зброя, мови
  hp: HitPoints;
  hitDice: string;
  deathSaves: DeathSaves;

  inventory: string[];
  armorClassDetails?: string;
  weapons?: Weapon[];
  tools?: string[];

  traits: Traits;
  featuresAndTraits?: string[]; // Особливості класові, расові, фон

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
  customCoins?: { [id: string]: number };
  characterTemplateId?: CharacterTemplateId;
  sessionMode?: boolean;
  conditions?: string[];
  customFields?: CharacterCustomField[];
  // Deprecated compatibility field. Canonical resource model is customResources.
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

//TODO - fix  - complete
