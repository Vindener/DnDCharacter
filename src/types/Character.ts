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
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  savingThrows: {
    // рятівні кидки, чи є перевага
    strength: boolean;
    dexterity: boolean;
    constitution: boolean;
    intelligence: boolean;
    wisdom: boolean;
    charisma: boolean;
  };
  skills: {
    [key: string]: number;
    acrobatics: number;
    animalHandling: number;
    arcana: number;
    athletics: number;
    deception: number;
    history: number;
    insight: number;
    intimidation: number;
    investigation: number;
    medicine: number;
    nature: number;
    perception: number;
    performance: number;
    persuasion: number;
    religion: number;
    sleightOfHand: number;
    stealth: number;
    survival: number;
  };
  proficiencies: string[]; // навички, інструменти, зброя, мови
  hp: {
    max: number;
    current: number;
    temp: number;
  };
  hitDice: string; // "3d10"
  deathSaves: {
    successes: number;
    failures: number;
  };
  inventory: string[];
  armorClassDetails?: string;
  weapons?: {
    name: string;
    attackBonus: number;
    damage: string;
  }[];
  tools?: string[];
  traits: {
    personality: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  featuresAndTraits?: string[]; // Особливості класові, расові, фон
  spells: {
    spellcastingAbility: string; // "Intelligence" і тд
    spellSaveDC: number;
    spellAttackBonus: number;
    spellSlots: {
      [level: number]: {
        max: number;
        used: number;
      };
    };
    knownSpells: string[];
    preparedSpells: string[];
    cantrips: string[];
  };
  notes?: string;
  alliesAndOrganizations?: string;
  backstory?: string;
  campaign?: string;
  photoUri?: string;
}

//TODO - fix any
