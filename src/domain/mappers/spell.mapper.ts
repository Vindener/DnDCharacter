import { uuid } from 'expo-modules-core';
import type {
  CharacterDto,
  CharacterEntity,
  Dnd5DamageType,
  SpellDamageProfile,
  SpellbookSpell,
  UpsertSpellbookSpellInput,
} from '@/domain/types';

type CharacterSpellsEntity = CharacterEntity['spells'];
type CharacterSpellsDto = CharacterDto['spells'];
type CharacterSpellsDraft = Partial<CharacterSpellsEntity> | null | undefined;
type SpellbookDraft = (Omit<Partial<SpellbookSpell>, 'damageProfiles'> & {
  damageProfiles?: UpsertSpellbookSpellInput['damageProfiles'] | SpellDamageProfile[] | null;
}) | null | undefined;

const DAMAGE_TYPES: Dnd5DamageType[] = [
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

const DEFAULT_CHARACTER_SPELLS: CharacterSpellsEntity = {
  spellcastingAbility: '',
  spellSaveDC: 0,
  spellAttackBonus: 0,
  spellSlots: {},
  knownSpells: [],
  preparedSpells: [],
  cantrips: [],
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function clampSpellLevel(value: number | undefined): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(9, Math.max(0, Number(value)));
}

function normalizeDamageType(value: unknown): Dnd5DamageType {
  const normalized = String(value || '').trim().toLowerCase() as Dnd5DamageType;
  if (DAMAGE_TYPES.includes(normalized)) return normalized;
  return 'force';
}

export function normalizeSpellbookDamageProfiles(value: unknown): SpellDamageProfile[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index): SpellDamageProfile | null => {
      const cast = asRecord(entry);
      const label = String(cast?.label || '').trim();
      const formula = String(cast?.formula || '').trim();
      if (!label || !formula) return null;
      const condition = String(cast?.condition || '').trim();

      return {
        id: String(cast?.id || `damage-${index}-${Date.now()}`),
        label,
        formula,
        damageType: normalizeDamageType(cast?.damageType),
        condition: condition || undefined,
      };
    })
    .filter((item): item is SpellDamageProfile => Boolean(item));
}

function normalizeCharacterSpells(raw: CharacterSpellsDraft): CharacterSpellsEntity {
  const cast = asRecord(raw) || {};
  const spellSlots = asRecord(cast.spellSlots) || {};

  const normalizedSlots: CharacterSpellsEntity['spellSlots'] = {};
  Object.entries(spellSlots).forEach(([level, value]) => {
    const slot = asRecord(value);
    if (!slot) return;
    normalizedSlots[Number(level)] = {
      max: Math.max(0, Number(slot.max) || 0),
      used: Math.max(0, Number(slot.used) || 0),
    };
  });

  return {
    ...DEFAULT_CHARACTER_SPELLS,
    spellcastingAbility: String(cast.spellcastingAbility || '').trim(),
    spellSaveDC: Math.max(0, Number(cast.spellSaveDC) || 0),
    spellAttackBonus: Number(cast.spellAttackBonus) || 0,
    spellSlots: normalizedSlots,
    knownSpells: toStringArray(cast.knownSpells),
    preparedSpells: toStringArray(cast.preparedSpells),
    cantrips: toStringArray(cast.cantrips),
  };
}

function normalizeSpellbookSpell(raw: SpellbookDraft, fallbackId?: string): SpellbookSpell {
  const cast = asRecord(raw) || {};
  const name = String(cast.name || '').trim() || 'Unnamed Spell';
  const source = cast.source === 'custom' || cast.source === 'imported' ? cast.source : 'system';
  const now = Date.now();

  return {
    id: String(cast.id || fallbackId || `spell-${uuid.v4()}`),
    name,
    level: clampSpellLevel(Number(cast.level)),
    school: String(cast.school || 'Універсальна').trim() || 'Універсальна',
    description: String(cast.description || '').trim(),
    tags: toStringArray(cast.tags),
    damageProfiles: normalizeSpellbookDamageProfiles(cast.damageProfiles),
    source,
    createdAt: Number(cast.createdAt) || now,
    updatedAt: Number(cast.updatedAt) || now,
  };
}

export function dtoToEntity(dto: CharacterSpellsDto): CharacterSpellsEntity {
  return normalizeCharacterSpells(dto);
}

export function entityToDto(entity: CharacterSpellsEntity): CharacterSpellsDto {
  return normalizeCharacterSpells(entity);
}

export function draftToEntity(draft: CharacterSpellsDraft): CharacterSpellsEntity {
  return normalizeCharacterSpells(draft);
}

export function normalizeStoredSpellbookSpell(raw: unknown, fallbackIndex: number): SpellbookSpell | null {
  const cast = asRecord(raw);
  const name = String(cast?.name || '').trim();
  if (!name) return null;
  return normalizeSpellbookSpell(cast, `spell-${fallbackIndex}-${name.toLowerCase().replace(/\s+/g, '-')}`);
}

export function spellbookInputToEntity(input: UpsertSpellbookSpellInput, existing?: SpellbookSpell): SpellbookSpell {
  const base = existing ? normalizeSpellbookSpell(existing, existing.id) : normalizeSpellbookSpell({}, `spell-custom-${uuid.v4()}`);
  const name = String(input.name || '').trim() || base.name;
  const now = Date.now();

  return normalizeSpellbookSpell(
    {
      ...base,
      id: existing?.id || input.spellId || `spell-custom-${uuid.v4()}`,
      name,
      level: input.level ?? base.level,
      school: input.school ?? base.school,
      description: input.description ?? base.description,
      tags: Array.isArray(input.tags) ? input.tags : base.tags,
      damageProfiles: input.damageProfiles ?? base.damageProfiles,
      source: existing?.source === 'custom' || existing?.source === 'imported' ? existing.source : 'custom',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    },
    existing?.id || input.spellId,
  );
}

export const spellbookMapper = {
  dtoToEntity(dto: SpellbookSpell): SpellbookSpell {
    return normalizeSpellbookSpell(dto, dto.id);
  },
  entityToDto(entity: SpellbookSpell): SpellbookSpell {
    return normalizeSpellbookSpell(entity, entity.id);
  },
  draftToEntity(draft: SpellbookDraft): SpellbookSpell {
    return normalizeSpellbookSpell(draft);
  },
};

