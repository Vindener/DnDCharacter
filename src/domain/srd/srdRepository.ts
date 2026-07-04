import { srdData } from '@/data/srd';
import {
  parseSrdArray,
  srdBackgroundSchema,
  srdClassProgressionSchema,
  srdClassSchema,
  srdConditionSchema,
  srdEquipmentItemSchema,
  srdLanguageSchema,
  srdMonsterSchema,
  srdRaceSchema,
  srdReferenceEntrySchema,
  srdSkillSchema,
  srdSpellSchema,
} from './schemas';
import type {
  SrdBackground,
  SrdClass,
  SrdClassProgression,
  SrdClassProgressionLevel,
  SrdCondition,
  SrdEquipmentItem,
  SrdLanguage,
  SrdMonster,
  SrdRace,
  SrdReferenceEntry,
  SrdSkill,
  SrdSpell,
} from './types';

const races = parseSrdArray<SrdRace>(srdRaceSchema, srdData.races);
const classes = parseSrdArray<SrdClass>(srdClassSchema, srdData.classes);
const classProgressions = parseSrdArray<SrdClassProgression>(srdClassProgressionSchema, srdData.classProgression);
const backgrounds = parseSrdArray<SrdBackground>(srdBackgroundSchema, srdData.backgrounds);
const conditions = parseSrdArray<SrdCondition>(srdConditionSchema, srdData.conditions);
const equipment = parseSrdArray<SrdEquipmentItem>(srdEquipmentItemSchema, srdData.equipment);
const languages = parseSrdArray<SrdLanguage>(srdLanguageSchema, srdData.languages);
const monsters = parseSrdArray<SrdMonster>(srdMonsterSchema, srdData.monsters);
const references = parseSrdArray<SrdReferenceEntry>(srdReferenceEntrySchema, srdData.references);
const skills = parseSrdArray<SrdSkill>(srdSkillSchema, srdData.skills);
const spells = parseSrdArray<SrdSpell>(srdSpellSchema, srdData.spells);

export function getSrdRaces(): SrdRace[] {
  return races;
}

export function getSrdRaceById(id: string): SrdRace | undefined {
  return races.find((race) => race.id === id);
}

export function getSrdClasses(): SrdClass[] {
  return classes;
}

export function getSrdClassById(id: string): SrdClass | undefined {
  return classes.find((item) => item.id === id);
}

export function getClassProgression(classId: string, level: number): SrdClassProgressionLevel | undefined {
  const progression = classProgressions.find((item) => item.classId === classId);
  return progression?.levels.find((item) => item.level === level);
}

export function getSrdClassProgressions(): SrdClassProgression[] {
  return classProgressions;
}

export function getAvailableSkillsForClass(classId: string): SrdSkill[] {
  const srdClass = getSrdClassById(classId);
  if (!srdClass) return [];
  const allowed = new Set<string>(srdClass.skillChoices.from);
  return skills.filter((skill) => allowed.has(skill.id));
}

export function getStartingEquipmentForClass(classId: string) {
  return getSrdClassById(classId)?.startingEquipment;
}

export function getConditions(): SrdCondition[] {
  return conditions;
}

export function getEquipment(): SrdEquipmentItem[] {
  return equipment;
}

export function getSrdSpells(): SrdSpell[] {
  return spells;
}

export function getSrdSpellById(id: string): SrdSpell | undefined {
  return spells.find((spell) => spell.id === id);
}

export function getSrdMonsters(): SrdMonster[] {
  return monsters;
}

export function getSrdMonsterById(id: string): SrdMonster | undefined {
  return monsters.find((monster) => monster.id === id);
}

export function getSrdReferences(): SrdReferenceEntry[] {
  return references;
}

export function getSrdReferenceById(id: string): SrdReferenceEntry | undefined {
  return references.find((entry) => entry.id === id);
}

export function getSrdBackgrounds(): SrdBackground[] {
  return backgrounds;
}

export function getSrdBackgroundById(id: string): SrdBackground | undefined {
  return backgrounds.find((item) => item.id === id);
}

export function getSrdLanguages(): SrdLanguage[] {
  return languages;
}

export function getSrdSkills(): SrdSkill[] {
  return skills;
}
