import type { CharacterEntity } from '@/domain/types';

export type AbilityStatsKey = keyof CharacterEntity['stats'];
export type SkillKey = keyof CharacterEntity['skills'];

const skillToStat: Record<SkillKey, AbilityStatsKey> = {
  // Strength
  athletics: 'strength',

  // Dexterity
  acrobatics: 'dexterity',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',

  // Intelligence
  arcana: 'intelligence',
  history: 'intelligence',
  investigation: 'intelligence',
  nature: 'intelligence',
  religion: 'intelligence',

  // Wisdom
  animalHandling: 'wisdom',
  insight: 'wisdom',
  medicine: 'wisdom',
  perception: 'wisdom',
  survival: 'wisdom',

  // Charisma
  deception: 'charisma',
  intimidation: 'charisma',
  performance: 'charisma',
  persuasion: 'charisma',
};

export default skillToStat;
