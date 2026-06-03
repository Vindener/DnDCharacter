import { uuid } from 'expo-modules-core';
import type {
  CharacterDto,
  CharacterEntity,
  SpellDamageProfile,
  SpellbookSpell,
  UpsertSpellbookSpellInput,
} from '@/domain/types';
import {
  normalizeCharacterSpells,
  normalizeSpell,
  normalizeSpellbookDamageProfiles,
  parseSpellbookStored,
  parseSpellUpsertInput,
} from '@/domain/schemas';

type CharacterSpellsEntity = CharacterEntity['spells'];
type CharacterSpellsDto = CharacterDto['spells'];
type CharacterSpellsDraft = Partial<CharacterSpellsEntity> | null | undefined;
type SpellbookDraft = (Omit<Partial<SpellbookSpell>, 'damageProfiles'> & {
  damageProfiles?: UpsertSpellbookSpellInput['damageProfiles'] | SpellDamageProfile[] | null;
}) | null | undefined;

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
  return parseSpellbookStored(raw, fallbackIndex);
}

export function spellbookInputToEntity(input: UpsertSpellbookSpellInput, existing?: SpellbookSpell): SpellbookSpell {
  const normalizedInput = parseSpellUpsertInput(input);
  const now = Date.now();

  const base = existing
    ? normalizeSpell(existing)
    : normalizeSpell({
        id: normalizedInput.spellId || `spell-custom-${uuid.v4()}`,
        source: 'custom',
        name: normalizedInput.name || 'Unnamed Spell',
        level: normalizedInput.level ?? 1,
        school: normalizedInput.school || 'Власне',
        description: normalizedInput.description || '',
        tags: normalizedInput.tags || [],
        damageProfiles: normalizedInput.damageProfiles || [],
        createdAt: now,
        updatedAt: now,
      });

  return normalizeSpell({
    ...base,
    id: existing?.id || normalizedInput.spellId || base.id,
    name: normalizedInput.name || base.name,
    level: normalizedInput.level ?? base.level,
    school: normalizedInput.school || base.school,
    description: normalizedInput.description ?? base.description,
    tags: normalizedInput.tags ?? base.tags,
    damageProfiles: normalizeSpellbookDamageProfiles(normalizedInput.damageProfiles ?? base.damageProfiles),
    source: existing?.source === 'custom' || existing?.source === 'imported' ? existing.source : 'custom',
    createdAt: existing?.createdAt || base.createdAt || now,
    updatedAt: now,
  });
}

export const spellbookMapper = {
  dtoToEntity(dto: SpellbookSpell): SpellbookSpell {
    return normalizeSpell(dto);
  },
  entityToDto(entity: SpellbookSpell): SpellbookSpell {
    return normalizeSpell(entity);
  },
  draftToEntity(draft: SpellbookDraft): SpellbookSpell {
    return normalizeSpell(draft);
  },
};

export { normalizeSpellbookDamageProfiles };
