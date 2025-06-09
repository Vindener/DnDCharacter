export interface CharacterDto {
  id: string;
  name: string;
  class: string;
  race: string;
  level: number;
  experience: number;
  initiative: number;
  speed: any;
  ac: any;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  skills: {
    acrobatics: number;
    arcana: number;
    athletics: number;
    stealth: number;
  };
  hp: {
    max: number;
    current: number;
    temp: number;
  };
  death_saves: {
    successes: number;
    failures: number;
  };
  inventory: string[];
  traits: {
    personality: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  spells: any;
  photoUri?: string;
}

//TODO - fix any
