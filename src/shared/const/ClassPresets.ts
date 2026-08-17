export interface ClassPreset {
  hitDie: number;
  primaryAbilities: string[];
  savingThrows: string[];
  proficiencies: string[];
  spellcastingAbility?: string;
}

export const CLASS_PRESETS: Record<string, ClassPreset> = {
  barbarian: {
    hitDie: 12,
    primaryAbilities: ['strength', 'constitution'],
    savingThrows: ['strength', 'constitution'],
    proficiencies: ['легка броня', 'середня броня', 'щити', 'проста зброя', 'військова зброя'],
  },
  fighter: {
    hitDie: 10,
    primaryAbilities: ['strength', 'dexterity', 'constitution'],
    savingThrows: ['strength', 'constitution'],
    proficiencies: ['всі види броні', 'щити', 'проста зброя', 'військова зброя'],
  },
  paladin: {
    hitDie: 10,
    primaryAbilities: ['strength', 'charisma'],
    savingThrows: ['wisdom', 'charisma'],
    proficiencies: ['всі види броні', 'щити', 'проста зброя', 'військова зброя'],
    spellcastingAbility: 'charisma',
  },
  ranger: {
    hitDie: 10,
    primaryAbilities: ['dexterity', 'wisdom'],
    savingThrows: ['strength', 'dexterity'],
    proficiencies: ['легка броня', 'середня броня', 'щити', 'проста зброя', 'військова зброя'],
    spellcastingAbility: 'wisdom',
  },
  bard: {
    hitDie: 8,
    primaryAbilities: ['charisma'],
    savingThrows: ['dexterity', 'charisma'],
    proficiencies: ['легка броня', 'проста зброя', 'музичні інструменти'],
    spellcastingAbility: 'charisma',
  },
  cleric: {
    hitDie: 8,
    primaryAbilities: ['wisdom'],
    savingThrows: ['wisdom', 'charisma'],
    proficiencies: ['легка броня', 'середня броня', 'щити', 'проста зброя'],
    spellcastingAbility: 'wisdom',
  },
  druid: {
    hitDie: 8,
    primaryAbilities: ['wisdom'],
    savingThrows: ['intelligence', 'wisdom'],
    proficiencies: ['легка броня (без металу)', 'середня броня (без металу)', 'щити (без металу)', 'проста зброя'],
    spellcastingAbility: 'wisdom',
  },
  monk: {
    hitDie: 8,
    primaryAbilities: ['dexterity', 'wisdom'],
    savingThrows: ['strength', 'dexterity'],
    proficiencies: ['проста зброя', 'короткі мечі'],
  },
  rogue: {
    hitDie: 8,
    primaryAbilities: ['dexterity'],
    savingThrows: ['dexterity', 'intelligence'],
    proficiencies: ['легка броня', 'проста зброя', 'злодійські інструменти'],
  },
  warlock: {
    hitDie: 8,
    primaryAbilities: ['charisma'],
    savingThrows: ['wisdom', 'charisma'],
    proficiencies: ['легка броня', 'проста зброя'],
    spellcastingAbility: 'charisma',
  },
  artificer: {
    hitDie: 8,
    primaryAbilities: ['intelligence'],
    savingThrows: ['constitution', 'intelligence'],
    proficiencies: ['легка броня', 'середня броня', 'щити', 'проста зброя', 'ремісничі інструменти'],
    spellcastingAbility: 'intelligence',
  },
  wizard: {
    hitDie: 6,
    primaryAbilities: ['intelligence'],
    savingThrows: ['intelligence', 'wisdom'],
    proficiencies: ['кинджали', 'дротики', 'пращі', 'посохи', 'легкі арбалети'],
    spellcastingAbility: 'intelligence',
  },
  sorcerer: {
    hitDie: 6,
    primaryAbilities: ['charisma'],
    savingThrows: ['constitution', 'charisma'],
    proficiencies: ['кинджали', 'дротики', 'пращі', 'посохи', 'легкі арбалети'],
    spellcastingAbility: 'charisma',
  },
};
