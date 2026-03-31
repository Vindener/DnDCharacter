import type { CharacterDto, CharacterEntity, CharacterViewModel } from '@/domain/types';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

export function mapCharacterDtoToEntity(dto: CharacterDto): CharacterEntity {
  return createEmptyCharacter(dto);
}

export function mapCharacterEntityToViewModel(entity: CharacterEntity): CharacterViewModel {
  return { ...entity };
}

export function mapCharacterViewModelToDto(viewModel: CharacterViewModel): CharacterDto {
  return { ...viewModel };
}

export function mapCloudCharacterDocToDto(doc: Record<string, unknown>): CharacterDto {
  const deathSavesDoc = asRecord(doc.deathSaves);
  const hpDoc = asRecord(doc.hp);

  return createEmptyCharacter({
    id: String(doc.id || Date.now().toString()),
    name: String(doc.name || 'Character'),
    class: String(doc.class || ''),
    subclass: typeof doc.subclass === 'string' ? doc.subclass : undefined,
    race: String(doc.race || ''),
    subrace: typeof doc.subrace === 'string' ? doc.subrace : undefined,
    background: typeof doc.background === 'string' ? doc.background : undefined,
    level: toNumber(doc.level, 1),
    experience: toNumber(doc.experience, 0),
    initiative: toNumber(doc.initiative, 0),
    speed: toNumber(doc.speed, 30),
    ac: toNumber(doc.ac, 10),
    proficiencyBonus: toNumber(doc.proficiencyBonus, 2),
    hp: {
      max: toNumber(hpDoc?.max, 10),
      current: toNumber(hpDoc?.current, 10),
      temp: toNumber(hpDoc?.temp, 0),
    },
    hitDice: typeof doc.hitDice === 'string' ? doc.hitDice : undefined,
    deathSaves: {
      successes: toNumber(deathSavesDoc?.successes ?? deathSavesDoc?.success, 0),
      failures: toNumber(deathSavesDoc?.failures ?? deathSavesDoc?.fail, 0),
    },
    stats: (asRecord(doc.stats) as unknown as CharacterDto['stats']) || undefined,
    savingThrows: (asRecord(doc.savingThrows) as unknown as CharacterDto['savingThrows']) || undefined,
    skills: (asRecord(doc.skills) as unknown as CharacterDto['skills']) || undefined,
    traits: (asRecord(doc.traits) as unknown as CharacterDto['traits']) || undefined,
    spells: (asRecord(doc.spells) as unknown as CharacterDto['spells']) || undefined,
    inventory: toStringArray(doc.inventory),
    weapons: Array.isArray(doc.weapons) ? (doc.weapons as CharacterDto['weapons']) : [],
    proficiencies: toStringArray(doc.proficiencies),
    notes: typeof doc.notes === 'string' ? doc.notes : '',
    characterTemplateId: typeof doc.characterTemplateId === 'string' ? (doc.characterTemplateId as CharacterDto['characterTemplateId']) : undefined,
    notesBlocks: (asRecord(doc.notesBlocks) as CharacterDto['notesBlocks']) || undefined,
    customNotesGroups: Array.isArray(doc.customNotesGroups) ? (doc.customNotesGroups as CharacterDto['customNotesGroups']) : [],
    homebrewEntries: Array.isArray(doc.homebrewEntries) ? (doc.homebrewEntries as CharacterDto['homebrewEntries']) : [],
    conditions: toStringArray(doc.conditions),
    customFields: Array.isArray(doc.customFields) ? (doc.customFields as CharacterDto['customFields']) : [],
    customTrackers: Array.isArray(doc.customTrackers) ? (doc.customTrackers as CharacterDto['customTrackers']) : [],
    customSections: Array.isArray(doc.customSections) ? (doc.customSections as CharacterDto['customSections']) : [],
    customResources: Array.isArray(doc.customResources) ? (doc.customResources as CharacterDto['customResources']) : [],
    customResetRules: Array.isArray(doc.customResetRules) ? (doc.customResetRules as CharacterDto['customResetRules']) : [],
    customFeatureBlocks: Array.isArray(doc.customFeatureBlocks) ? (doc.customFeatureBlocks as CharacterDto['customFeatureBlocks']) : [],
    customSpellLists: Array.isArray(doc.customSpellLists) ? (doc.customSpellLists as CharacterDto['customSpellLists']) : [],
    combatTemplates: (asRecord(doc.combatTemplates) as CharacterDto['combatTemplates']) || undefined,
    sessionMode: Boolean(doc.sessionMode),
    coins: (asRecord(doc.coins) as CharacterDto['coins']) || undefined,
    customCoins: (asRecord(doc.customCoins) as CharacterDto['customCoins']) || undefined,
    alliesAndOrganizations: typeof doc.alliesAndOrganizations === 'string' ? doc.alliesAndOrganizations : undefined,
    backstory: typeof doc.backstory === 'string' ? doc.backstory : undefined,
    campaign: typeof doc.campaign === 'string' ? doc.campaign : undefined,
    campaignId: typeof doc.campaignId === 'string' ? doc.campaignId : undefined,
    photoUri: typeof doc.photoUri === 'string' ? doc.photoUri : undefined,
  });
}

