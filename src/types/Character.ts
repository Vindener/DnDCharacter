import { Stats } from './Stats';
import { SavingThrows } from './SavingThrows';
import { Skills } from './Skills';
import { HitPoints } from './HitPoints';
import { DeathSaves } from './DeathSaves';
import { Weapon } from './Weapon';
import { Traits } from './Traits';
import { Spells } from './Spells';

export type CustomFieldType = 'text' | 'number' | 'boolean' | 'select';

export interface CharacterCustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  value: string | number | boolean;
  options?: string[];
}

export type TrackerResetRule = 'none' | 'short-rest' | 'long-rest' | 'session';

export interface CharacterTracker {
  id: string;
  label: string;
  current: number;
  max?: number;
  resetRule: TrackerResetRule;
  color?: string;
}

export interface CharacterNotesBlocks {
  session?: string;
  campaign?: string;
  goals?: string;
  relationships?: string;
  quests?: string;
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
  photoUri?: string;
  coins?: {
    gold: number;
    silver: number;
    copper: number;
  };
  customCoins?: { [id: string]: number };
  sessionMode?: boolean;
  conditions?: string[];
  customFields?: CharacterCustomField[];
  customTrackers?: CharacterTracker[];
  notesBlocks?: CharacterNotesBlocks;
}

//TODO - fix  - complete
