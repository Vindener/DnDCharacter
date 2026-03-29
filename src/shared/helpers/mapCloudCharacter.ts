import type { CharacterDto } from '@/types/Character';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';

function num(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function mapCloudCharacterToLocalDto(doc: Record<string, unknown>): CharacterDto {
  const deathSavesDoc = (doc.deathSaves || {}) as Record<string, unknown>;
  const hpDoc = (doc.hp || {}) as Record<string, unknown>;

  return createEmptyCharacter({
    id: String(doc.id || Date.now().toString()),
    name: String(doc.name || 'Character'),
    class: String(doc.class || ''),
    subclass: typeof doc.subclass === 'string' ? doc.subclass : undefined,
    race: String(doc.race || ''),
    subrace: typeof doc.subrace === 'string' ? doc.subrace : undefined,
    background: typeof doc.background === 'string' ? doc.background : undefined,
    level: num(doc.level, 1),
    experience: num(doc.experience, 0),
    initiative: num(doc.initiative, 0),
    speed: num(doc.speed, 30),
    ac: num(doc.ac, 10),
    proficiencyBonus: num(doc.proficiencyBonus, 2),
    hp: {
      max: num(hpDoc.max, 10),
      current: num(hpDoc.current, 10),
      temp: num(hpDoc.temp, 0),
    },
    hitDice: typeof doc.hitDice === 'string' ? doc.hitDice : undefined,
    deathSaves: {
      successes: num(deathSavesDoc.successes ?? deathSavesDoc.success, 0),
      failures: num(deathSavesDoc.failures ?? deathSavesDoc.fail, 0),
    },
    stats: ((doc.stats || {}) as CharacterDto['stats']) || undefined,
    savingThrows: ((doc.savingThrows || {}) as CharacterDto['savingThrows']) || undefined,
    skills: ((doc.skills || {}) as CharacterDto['skills']) || undefined,
    traits: ((doc.traits || {}) as CharacterDto['traits']) || undefined,
    spells: ((doc.spells || {}) as CharacterDto['spells']) || undefined,
    inventory: Array.isArray(doc.inventory) ? (doc.inventory as string[]) : [],
    weapons: Array.isArray(doc.weapons) ? (doc.weapons as CharacterDto['weapons']) : [],
    proficiencies: Array.isArray(doc.proficiencies) ? (doc.proficiencies as string[]) : [],
    notes: typeof doc.notes === 'string' ? doc.notes : '',
    notesBlocks: ((doc.notesBlocks || {}) as CharacterDto['notesBlocks']) || undefined,
    conditions: Array.isArray(doc.conditions) ? (doc.conditions as string[]) : [],
    customFields: Array.isArray(doc.customFields) ? (doc.customFields as CharacterDto['customFields']) : [],
    customTrackers: Array.isArray(doc.customTrackers) ? (doc.customTrackers as CharacterDto['customTrackers']) : [],
    customSections: Array.isArray(doc.customSections) ? (doc.customSections as CharacterDto['customSections']) : [],
    customResources: Array.isArray(doc.customResources) ? (doc.customResources as CharacterDto['customResources']) : [],
    customResetRules: Array.isArray(doc.customResetRules) ? (doc.customResetRules as CharacterDto['customResetRules']) : [],
    customFeatureBlocks: Array.isArray(doc.customFeatureBlocks) ? (doc.customFeatureBlocks as CharacterDto['customFeatureBlocks']) : [],
    customSpellLists: Array.isArray(doc.customSpellLists) ? (doc.customSpellLists as CharacterDto['customSpellLists']) : [],
    combatTemplates: ((doc.combatTemplates || {}) as CharacterDto['combatTemplates']) || undefined,
    sessionMode: Boolean(doc.sessionMode),
    coins: ((doc.coins || undefined) as CharacterDto['coins']) || undefined,
    customCoins: ((doc.customCoins || undefined) as CharacterDto['customCoins']) || undefined,
    alliesAndOrganizations: typeof doc.alliesAndOrganizations === 'string' ? doc.alliesAndOrganizations : undefined,
    backstory: typeof doc.backstory === 'string' ? doc.backstory : undefined,
    campaign: typeof doc.campaign === 'string' ? doc.campaign : undefined,
    photoUri: typeof doc.photoUri === 'string' ? doc.photoUri : undefined,
  });
}
