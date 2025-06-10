import { Stats } from './Stats';
import { SavingThrows } from './SavingThrows';
import { Skills } from './Skills';
import { HitPoints } from './HitPoints';
import { DeathSaves } from './DeathSaves';
import { Weapon } from './Weapon';
import { Traits } from './Traits';
import { Spells } from './Spells';

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
}

//TODO - fix  - complete
