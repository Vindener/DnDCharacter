import { z } from 'zod';
import type { CharacterEntity, CharacterDraft, SkillProficiencyRank } from '@/domain/types';
import { parseHomebrew } from './homebrew.schema';
import { normalizeCharacterSpells } from './spell.schema';
import { asRecord, safeParseWithIssues, toBoolean, toFiniteStringRecord, toNumber, toString, toStringArray, toTrimmedString } from './utils';
import { migratePayloadToLatest } from '@/domain/migrations';

function parseStats(raw: unknown): CharacterEntity['stats'] {
  const cast = asRecord(raw);
  return {
    strength: toNumber(cast.strength, 10),
    dexterity: toNumber(cast.dexterity, 10),
    constitution: toNumber(cast.constitution, 10),
    intelligence: toNumber(cast.intelligence, 10),
    wisdom: toNumber(cast.wisdom, 10),
    charisma: toNumber(cast.charisma, 10),
  };
}

function parseSavingThrows(raw: unknown): CharacterEntity['savingThrows'] {
  const cast = asRecord(raw);
  return {
    strength: toBoolean(cast.strength, false),
    dexterity: toBoolean(cast.dexterity, false),
    constitution: toBoolean(cast.constitution, false),
    intelligence: toBoolean(cast.intelligence, false),
    wisdom: toBoolean(cast.wisdom, false),
    charisma: toBoolean(cast.charisma, false),
  };
}

function parseSkills(raw: unknown): CharacterEntity['skills'] {
  const cast = asRecord(raw);
  return {
    acrobatics: toNumber(cast.acrobatics, 0),
    animalHandling: toNumber(cast.animalHandling, 0),
    arcana: toNumber(cast.arcana, 0),
    athletics: toNumber(cast.athletics, 0),
    deception: toNumber(cast.deception, 0),
    history: toNumber(cast.history, 0),
    insight: toNumber(cast.insight, 0),
    intimidation: toNumber(cast.intimidation, 0),
    investigation: toNumber(cast.investigation, 0),
    medicine: toNumber(cast.medicine, 0),
    nature: toNumber(cast.nature, 0),
    perception: toNumber(cast.perception, 0),
    performance: toNumber(cast.performance, 0),
    persuasion: toNumber(cast.persuasion, 0),
    religion: toNumber(cast.religion, 0),
    sleightOfHand: toNumber(cast.sleightOfHand, 0),
    stealth: toNumber(cast.stealth, 0),
    survival: toNumber(cast.survival, 0),
  };
}

function parseSkillProficiencies(raw: unknown): CharacterEntity['skillProficiencies'] {
  const cast = asRecord(raw);
  const result: CharacterEntity['skillProficiencies'] = {};
  const ranks = new Set(['none', 'half', 'proficient', 'expertise']);

  Object.entries(cast).forEach(([key, value]) => {
    const rank = String(value || '').trim();
    if (!ranks.has(rank)) return;
    const skillKey = key as keyof CharacterEntity['skills'];
    result[skillKey] = rank as SkillProficiencyRank;
  });

  return Object.keys(result).length ? result : undefined;
}

function parseEquipment(raw: unknown): CharacterEntity['equipment'] {
  const cast = asRecord(raw);
  const equipment: CharacterEntity['equipment'] = {
    armor: toTrimmedString(cast.armor) || undefined,
    shield: toTrimmedString(cast.shield) || undefined,
    attunedItems: toStringArray(cast.attunedItems, { dedupe: true }),
    carryingCapacity: Number.isFinite(Number(cast.carryingCapacity))
      ? Math.max(0, toNumber(cast.carryingCapacity, 0))
      : undefined,
  };

  if (!equipment.armor && !equipment.shield && !equipment.attunedItems?.length && equipment.carryingCapacity === undefined) {
    return undefined;
  }

  return equipment;
}

function parseTraits(raw: unknown): CharacterEntity['traits'] {
  const cast = asRecord(raw);
  return {
    personality: toString(cast.personality, ''),
    ideals: toString(cast.ideals, ''),
    bonds: toString(cast.bonds, ''),
    flaws: toString(cast.flaws, ''),
  };
}

function parseHitPoints(raw: unknown): CharacterEntity['hp'] {
  const cast = asRecord(raw);
  return {
    max: toNumber(cast.max, 8),
    current: toNumber(cast.current, 8),
    temp: Math.max(0, toNumber(cast.temp, 0)),
  };
}

function parseDeathSaves(raw: unknown): CharacterEntity['deathSaves'] {
  const cast = asRecord(raw);
  return {
    successes: toNumber(cast.successes ?? cast.success, 0),
    failures: toNumber(cast.failures ?? cast.fail, 0),
  };
}

function parseWeapons(raw: unknown): CharacterEntity['weapons'] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const cast = asRecord(item);
    return {
      name: toString(cast.name, ''),
      attackBonus: toNumber(cast.attackBonus, 0),
      damage: toString(cast.damage, '1d6'),
    };
  });
}

function parseCoins(raw: unknown): CharacterEntity['coins'] {
  if (raw === null || raw === undefined) return undefined;
  const cast = asRecord(raw);
  return {
    gold: Math.max(0, toNumber(cast.gold, 0)),
    silver: Math.max(0, toNumber(cast.silver, 0)),
    copper: Math.max(0, toNumber(cast.copper, 0)),
  };
}

function parseCharacterEntity(raw: unknown): CharacterEntity {
  const migrated = migratePayloadToLatest<Record<string, unknown>>('character', raw).data;
  const cast = asRecord(migrated);
  const homebrew = parseHomebrew(cast);
  const customCoins = toFiniteStringRecord(cast.customCoins);

  return {
    schemaVersion: Number.isFinite(Number(cast.schemaVersion)) ? Math.max(1, Math.floor(Number(cast.schemaVersion))) : undefined,
    id: toTrimmedString(cast.id),
    name: toString(cast.name, ''),
    class: toString(cast.class, ''),
    subclass: toTrimmedString(cast.subclass) || undefined,
    race: toString(cast.race, ''),
    subrace: toTrimmedString(cast.subrace) || undefined,
    background: toTrimmedString(cast.background) || undefined,
    level: Math.max(1, Math.floor(toNumber(cast.level, 1))),
    experience: Math.max(0, toNumber(cast.experience, 0)),
    initiative: toNumber(cast.initiative, 0),
    speed: toNumber(cast.speed, 30),
    ac: toNumber(cast.ac, 10),
    proficiencyBonus: toNumber(cast.proficiencyBonus, 2),
    alignment: toTrimmedString(cast.alignment) || undefined,
    currency: toTrimmedString(cast.currency) || undefined,
    stats: parseStats(cast.stats),
    savingThrows: parseSavingThrows(cast.savingThrows),
    skills: parseSkills(cast.skills),
    skillProficiencies: parseSkillProficiencies(cast.skillProficiencies),
    proficiencies: toStringArray(cast.proficiencies, { dedupe: true }),
    hp: parseHitPoints(cast.hp),
    hitDice: toTrimmedString(cast.hitDice) || '1d6',
    deathSaves: parseDeathSaves(cast.deathSaves),
    inventory: toStringArray(cast.inventory),
    armorClassDetails: toTrimmedString(cast.armorClassDetails) || undefined,
    equipment: parseEquipment(cast.equipment),
    weapons: parseWeapons(cast.weapons),
    tools: toStringArray(cast.tools),
    traits: parseTraits(cast.traits),
    featuresAndTraits: toStringArray(cast.featuresAndTraits),
    spells: normalizeCharacterSpells(cast.spells),
    notes: toString(cast.notes, ''),
    alliesAndOrganizations: toTrimmedString(cast.alliesAndOrganizations) || undefined,
    backstory: toTrimmedString(cast.backstory) || undefined,
    campaign: toTrimmedString(cast.campaign) || undefined,
    campaignId: toTrimmedString(cast.campaignId) || undefined,
    photoUri: toTrimmedString(cast.photoUri) || undefined,
    coins: parseCoins(cast.coins),
    customCoins: Object.keys(customCoins).length ? customCoins : undefined,
    sessionMode: toBoolean(cast.sessionMode, false),
    conditions: toStringArray(cast.conditions, { dedupe: true }),

    characterTemplateId: homebrew.characterTemplateId,
    customFields: homebrew.customFields,
    customTrackers: homebrew.customTrackers,
    customSections: homebrew.customSections,
    customResources: homebrew.customResources,
    customResetRules: homebrew.customResetRules,
    customFeatureBlocks: homebrew.customFeatureBlocks,
    customSpellLists: homebrew.customSpellLists,
    customNotesGroups: homebrew.customNotesGroups,
    homebrewEntries: homebrew.homebrewEntries,
    notesBlocks: homebrew.notesBlocks,

    combatTemplates: {
      actions: toStringArray(asRecord(cast.combatTemplates).actions),
      bonusActions: toStringArray(asRecord(cast.combatTemplates).bonusActions),
      reactions: toStringArray(asRecord(cast.combatTemplates).reactions),
    },
  };
}

export const characterSchema: z.ZodType<CharacterEntity> = z.any().transform((value) => parseCharacterEntity(value));

export function parseCharacter(input: unknown): CharacterEntity {
  return characterSchema.parse(input);
}

export function parseCharacterDraft(input: unknown): CharacterDraft {
  return parseCharacter(input);
}

export function safeParseCharacter(input: unknown) {
  return safeParseWithIssues(characterSchema, input);
}

export function normalizeCharacter(input: unknown): CharacterEntity {
  return parseCharacter(input);
}




