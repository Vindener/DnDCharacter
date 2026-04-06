import { spellMapper } from '@/domain/mappers';
import type { CharacterEntity } from '@/domain/types/character';
import { CLASS_PRESETS } from '@/shared/const/ClassPresets';
import { CLASS_TRANSLATIONS } from '@/shared/const/CharacterClass';
import { calculateModifier } from '@/shared/helpers/calculateModifier';
import type { CharacterSpellStatus } from './spellbookEntity';

export function normalizeSpellName(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

type AbilityKey = keyof CharacterEntity['stats'];

const PREPARED_FULL_CASTER_CLASSES = new Set(['cleric', 'druid', 'wizard']);
const PREPARED_HALF_CASTER_CLASSES = new Set(['paladin', 'artificer']);

function normalizeClassKey(value: string): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (CLASS_PRESETS[raw]) return raw;

  for (const [classKey, uaLabel] of Object.entries(CLASS_TRANSLATIONS)) {
    if (String(uaLabel || '').trim().toLowerCase() === raw) return classKey;
  }

  return raw;
}

function normalizeAbilityKey(value: string): AbilityKey | null {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (!raw) return null;

  const aliases: Record<string, AbilityKey> = {
    strength: 'strength',
    str: 'strength',
    dexterity: 'dexterity',
    dex: 'dexterity',
    constitution: 'constitution',
    con: 'constitution',
    intelligence: 'intelligence',
    int: 'intelligence',
    wisdom: 'wisdom',
    wis: 'wisdom',
    charisma: 'charisma',
    cha: 'charisma',
  };

  return aliases[raw] || null;
}

function resolveSpellcastingAbility(character: CharacterEntity): AbilityKey | null {
  const fromSpells = normalizeAbilityKey(character.spells?.spellcastingAbility || '');
  if (fromSpells) return fromSpells;

  const classKey = normalizeClassKey(character.class);
  const presetAbility = CLASS_PRESETS[classKey]?.spellcastingAbility;
  return normalizeAbilityKey(presetAbility || '');
}

export function getPreparedSpellsLimit(character: CharacterEntity | null | undefined): number | null {
  if (!character) return null;
  const classKey = normalizeClassKey(character.class);
  const abilityKey = resolveSpellcastingAbility(character);
  if (!abilityKey) return null;

  const abilityScore = Number(character.stats?.[abilityKey] ?? 10) || 10;
  const abilityMod = calculateModifier(abilityScore);
  const level = Math.max(1, Number(character.level) || 1);

  if (PREPARED_FULL_CASTER_CLASSES.has(classKey)) {
    return Math.max(1, level + abilityMod);
  }

  if (PREPARED_HALF_CASTER_CLASSES.has(classKey)) {
    return Math.max(1, Math.floor(level / 2) + abilityMod);
  }

  return null;
}

function hasSpell(list: string[], name: string): boolean {
  const key = normalizeSpellName(name);
  return list.some((entry) => normalizeSpellName(entry) === key);
}

function addUniqueSpell(list: string[], spellName: string): string[] {
  const next = String(spellName || '').trim();
  if (!next) return list;
  if (hasSpell(list, next)) return list;
  return [...list, next];
}

function removeSpell(list: string[], spellName: string): string[] {
  const key = normalizeSpellName(spellName);
  return list.filter((entry) => normalizeSpellName(entry) !== key);
}

export function collectCharacterSpellNames(character: CharacterEntity | null | undefined): string[] {
  if (!character) return [];
  const names = new Map<string, string>();
  [...(character.spells?.knownSpells || []), ...(character.spells?.preparedSpells || []), ...(character.spells?.cantrips || [])].forEach((name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    const key = normalizeSpellName(trimmed);
    if (!names.has(key)) names.set(key, trimmed);
  });
  return Array.from(names.values());
}

export function getCharacterSpellStatus(character: CharacterEntity | null | undefined, spellName: string): CharacterSpellStatus {
  if (!character) return 'available';
  if (hasSpell(character.spells?.preparedSpells || [], spellName)) return 'prepared';
  if (hasSpell(character.spells?.cantrips || [], spellName)) return 'cantrip';
  if (hasSpell(character.spells?.knownSpells || [], spellName)) return 'known';
  return 'available';
}

export function applySpellStatus(
  character: CharacterEntity,
  spellName: string,
  status: CharacterSpellStatus,
  options?: { preparedLimit?: number | null },
): CharacterEntity {
  const name = String(spellName || '').trim();
  if (!name) return character;

  const known = [...(character.spells?.knownSpells || [])];
  const prepared = [...(character.spells?.preparedSpells || [])];
  const cantrips = [...(character.spells?.cantrips || [])];
  const preparedLimit = typeof options?.preparedLimit === 'number' ? Math.max(0, options.preparedLimit) : null;
  const alreadyPrepared = hasSpell(prepared, name);

  const resetToAvailable = () => ({
    knownSpells: removeSpell(known, name),
    preparedSpells: removeSpell(prepared, name),
    cantrips: removeSpell(cantrips, name),
  });

  if (status === 'available') {
    const cleaned = resetToAvailable();
    return {
      ...character,
      spells: {
        ...spellMapper.draftToEntity({
          ...character.spells,
          ...cleaned,
        }),
      },
    };
  }

  if (status === 'known') {
    const cleaned = resetToAvailable();
    return {
      ...character,
      spells: {
        ...spellMapper.draftToEntity({
          ...character.spells,
          knownSpells: addUniqueSpell(cleaned.knownSpells, name),
          preparedSpells: cleaned.preparedSpells,
          cantrips: cleaned.cantrips,
        }),
      },
    };
  }

  if (status === 'prepared') {
    const cleaned = resetToAvailable();
    if (preparedLimit !== null && !alreadyPrepared && cleaned.preparedSpells.length >= preparedLimit) {
      return character;
    }
    return {
      ...character,
      spells: {
        ...spellMapper.draftToEntity({
          ...character.spells,
          knownSpells: addUniqueSpell(cleaned.knownSpells, name),
          preparedSpells: addUniqueSpell(cleaned.preparedSpells, name),
          cantrips: cleaned.cantrips,
        }),
      },
    };
  }

  const cleaned = resetToAvailable();
  return {
    ...character,
    spells: {
      ...spellMapper.draftToEntity({
        ...character.spells,
        knownSpells: cleaned.knownSpells,
        preparedSpells: cleaned.preparedSpells,
        cantrips: addUniqueSpell(cleaned.cantrips, name),
      }),
    },
  };
}
