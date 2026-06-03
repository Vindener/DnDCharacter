import { uuid } from 'expo-modules-core';
import { z } from 'zod';
import type {
  CharacterEntity,
  Dnd5DamageType,
  SpellDamageProfile,
  SpellbookSpell,
  UpsertSpellbookSpellInput,
} from '@/domain/types';
import { asRecord, clampNumber, safeParseWithIssues, toNumber, toString, toStringArray, toTrimmedString } from './utils';

export const SPELL_DAMAGE_TYPES: Dnd5DamageType[] = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
];

const SPELL_SOURCE: SpellbookSpell['source'][] = ['system', 'custom', 'imported'];

function normalizeSpellLevel(value: unknown, fallback = 1): number {
  return clampNumber(Math.floor(toNumber(value, fallback)), 0, 9);
}

function normalizeDamageType(value: unknown): Dnd5DamageType {
  const normalized = toTrimmedString(value).toLowerCase() as Dnd5DamageType;
  if (SPELL_DAMAGE_TYPES.includes(normalized)) return normalized;
  return 'force';
}

function parseDamageProfile(raw: unknown, index: number): SpellDamageProfile | null {
  const cast = asRecord(raw);
  const label = toTrimmedString(cast.label);
  const formula = toTrimmedString(cast.formula);
  if (!label || !formula) return null;

  return {
    id: toTrimmedString(cast.id) || `damage-${index}-${Date.now()}`,
    label,
    formula,
    damageType: normalizeDamageType(cast.damageType),
    condition: toTrimmedString(cast.condition) || undefined,
  };
}

function parseDamageProfilesFromText(value: string): SpellDamageProfile[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelRaw, formulaRaw, damageTypeRaw, conditionRaw] = line.split('|').map((part) => part.trim());
      const label = labelRaw || 'Шкода';
      const formula = formulaRaw || '1d6';
      return {
        id: `damage-${label}-${formula}-${Date.now()}`,
        label,
        formula,
        damageType: normalizeDamageType(damageTypeRaw),
        condition: conditionRaw || undefined,
      } as SpellDamageProfile;
    });
}

function parseDamageProfiles(raw: unknown): SpellDamageProfile[] {
  if (typeof raw === 'string') {
    return parseDamageProfilesFromText(raw);
  }

  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, index) => parseDamageProfile(entry, index))
    .filter((entry): entry is SpellDamageProfile => Boolean(entry));
}

function parseSpellbookSpell(raw: unknown, fallbackId?: string): SpellbookSpell {
  const cast = asRecord(raw);
  const name = toTrimmedString(cast.name) || 'Unnamed Spell';
  const sourceCandidate = toTrimmedString(cast.source) as SpellbookSpell['source'];
  const source = SPELL_SOURCE.includes(sourceCandidate) ? sourceCandidate : 'system';
  const now = Date.now();

  return {
    id: toTrimmedString(cast.id) || fallbackId || `spell-${uuid.v4()}`,
    name,
    level: normalizeSpellLevel(cast.level, 1),
    school: toTrimmedString(cast.school) || 'Універсальна',
    description: toString(cast.description, '').trim(),
    tags: toStringArray(cast.tags, { dedupe: true }),
    damageProfiles: parseDamageProfiles(cast.damageProfiles),
    source,
    createdAt: toNumber(cast.createdAt, now),
    updatedAt: toNumber(cast.updatedAt, now),
  };
}

function parseCharacterSpells(raw: unknown): CharacterEntity['spells'] {
  const cast = asRecord(raw);
  const spellSlotsRaw = asRecord(cast.spellSlots);
  const spellSlots: CharacterEntity['spells']['spellSlots'] = {};

  Object.entries(spellSlotsRaw).forEach(([key, value]) => {
    const level = Number(key);
    if (!Number.isFinite(level)) return;
    const slot = asRecord(value);
    spellSlots[level] = {
      max: Math.max(0, toNumber(slot.max, 0)),
      used: Math.max(0, toNumber(slot.used, 0)),
    };
  });

  return {
    spellcastingAbility: toTrimmedString(cast.spellcastingAbility),
    spellSaveDC: Math.max(0, toNumber(cast.spellSaveDC, 0)),
    spellAttackBonus: toNumber(cast.spellAttackBonus, 0),
    spellSlots,
    knownSpells: toStringArray(cast.knownSpells, { dedupe: true }),
    preparedSpells: toStringArray(cast.preparedSpells, { dedupe: true }),
    cantrips: toStringArray(cast.cantrips, { dedupe: true }),
  };
}

function parseUpsertSpellInput(raw: unknown): UpsertSpellbookSpellInput {
  const cast = asRecord(raw);
  const tagsRaw = cast.tags;
  const parsedTags = typeof tagsRaw === 'string'
    ? Array.from(new Set(tagsRaw
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)))
    : toStringArray(tagsRaw, { dedupe: true });

  return {
    spellId: toTrimmedString(cast.spellId) || undefined,
    name: toTrimmedString(cast.name),
    level: normalizeSpellLevel(cast.level, 1),
    school: toTrimmedString(cast.school) || 'Власне',
    description: toString(cast.description, '').trim(),
    tags: parsedTags,
    damageProfiles: parseDamageProfiles(cast.damageProfiles).map((profile) => ({
      label: profile.label,
      formula: profile.formula,
      damageType: profile.damageType,
      condition: profile.condition,
    })),
  };
}

function buildSpellFormPayload(raw: unknown): UpsertSpellbookSpellInput {
  const parsed = parseUpsertSpellInput(raw);
  return {
    ...parsed,
    level: normalizeSpellLevel(parsed.level, 1),
  };
}

export const spellDamageProfileSchema: z.ZodType<SpellDamageProfile> = z.any().transform((value) => {
  const parsed = parseDamageProfile(value, 0);
  if (!parsed) {
    return {
      id: `damage-${Date.now()}`,
      label: 'Шкода',
      formula: '1d6',
      damageType: 'force',
      condition: undefined,
    } as SpellDamageProfile;
  }
  return parsed;
});

export const spellSchema: z.ZodType<SpellbookSpell> = z.any().transform((value) => parseSpellbookSpell(value));
export const characterSpellsSchema: z.ZodType<CharacterEntity['spells']> = z.any().transform((value) => parseCharacterSpells(value));
export const upsertSpellbookSpellInputSchema: z.ZodType<UpsertSpellbookSpellInput> = z.any().transform((value) => parseUpsertSpellInput(value));

export const spellFormSchema = z
  .any()
  .transform((value) => buildSpellFormPayload(value))
  .superRefine((value, ctx) => {
    if (!value.name.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['name'],
        message: 'Вкажіть назву закляття.',
      });
    }
  });

export function normalizeSpellbookDamageProfiles(value: unknown): SpellDamageProfile[] {
  return parseDamageProfiles(value);
}

export function normalizeCharacterSpells(value: unknown): CharacterEntity['spells'] {
  return characterSpellsSchema.parse(value);
}

export function normalizeSpell(value: unknown): SpellbookSpell {
  return spellSchema.parse(value);
}

export function parseSpell(value: unknown): SpellbookSpell {
  return normalizeSpell(value);
}

export function parseSpellbookStored(value: unknown, fallbackIndex: number): SpellbookSpell | null {
  const parsed = parseSpellbookSpell(value, `spell-${fallbackIndex}`);
  if (!parsed.name.trim()) return null;
  return parsed;
}

export function parseSpellUpsertInput(value: unknown): UpsertSpellbookSpellInput {
  return upsertSpellbookSpellInputSchema.parse(value);
}

export function parseSpellFormInput(value: unknown): UpsertSpellbookSpellInput {
  return spellFormSchema.parse(value);
}

export function safeParseSpellFormInput(value: unknown) {
  return safeParseWithIssues(spellFormSchema, value);
}

export function safeParseSpell(value: unknown) {
  return safeParseWithIssues(spellSchema, value);
}


