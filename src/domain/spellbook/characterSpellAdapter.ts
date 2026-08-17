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
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (!raw) return '';
  if (CLASS_PRESETS[raw]) return raw;

  for (const [classKey, uaLabel] of Object.entries(CLASS_TRANSLATIONS)) {
    if (
      String(uaLabel || '')
        .trim()
        .toLowerCase() === raw
    )
      return classKey;
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

// A spell name can reach here as its current-locale display name (what the spell picker
// and starting-spell auto-fill write) or as the spell's base/English name (what toggling a
// reference-list status button writes) — the two can legitimately differ for the same SRD
// spell. Callers that already know both forms pass them as aliases so a status set under
// one form is still found and cleared under the other.
function toNameAliases(spellName: string | string[]): string[] {
  const raw = Array.isArray(spellName) ? spellName : [spellName];
  return raw.map((value) => String(value || '').trim()).filter(Boolean);
}

function hasAnySpell(list: string[], names: string[]): boolean {
  if (!names.length) return false;
  const keys = new Set(names.map(normalizeSpellName));
  return list.some((entry) => keys.has(normalizeSpellName(entry)));
}

function addUniqueSpell(list: string[], spellName: string): string[] {
  const next = String(spellName || '').trim();
  if (!next) return list;
  if (hasSpell(list, next)) return list;
  return [...list, next];
}

function removeAnySpell(list: string[], names: string[]): string[] {
  if (!names.length) return list;
  const keys = new Set(names.map(normalizeSpellName));
  return list.filter((entry) => !keys.has(normalizeSpellName(entry)));
}

export function collectCharacterSpellNames(character: CharacterEntity | null | undefined): string[] {
  if (!character) return [];
  const names = new Map<string, string>();
  [...(character.spells?.knownSpells || []), ...(character.spells?.preparedSpells || []), ...(character.spells?.cantrips || [])].forEach(
    (name) => {
      const trimmed = String(name || '').trim();
      if (!trimmed) return;
      const key = normalizeSpellName(trimmed);
      if (!names.has(key)) names.set(key, trimmed);
    },
  );
  return Array.from(names.values());
}

export function getCharacterSpellStatus(character: CharacterEntity | null | undefined, spellName: string | string[]): CharacterSpellStatus {
  if (!character) return 'available';
  const names = toNameAliases(spellName);
  if (!names.length) return 'available';
  if (hasAnySpell(character.spells?.preparedSpells || [], names)) return 'prepared';
  if (hasAnySpell(character.spells?.cantrips || [], names)) return 'cantrip';
  if (hasAnySpell(character.spells?.knownSpells || [], names)) return 'known';
  return 'available';
}

export function applySpellStatus(
  character: CharacterEntity,
  spellName: string | string[],
  status: CharacterSpellStatus,
  options?: { preparedLimit?: number | null },
): CharacterEntity {
  const names = toNameAliases(spellName);
  const name = names[0];
  if (!name) return character;

  const known = [...(character.spells?.knownSpells || [])];
  const prepared = [...(character.spells?.preparedSpells || [])];
  const cantrips = [...(character.spells?.cantrips || [])];
  const preparedLimit = typeof options?.preparedLimit === 'number' ? Math.max(0, options.preparedLimit) : null;
  const alreadyPrepared = hasAnySpell(prepared, names);

  const resetToAvailable = () => ({
    knownSpells: removeAnySpell(known, names),
    preparedSpells: removeAnySpell(prepared, names),
    cantrips: removeAnySpell(cantrips, names),
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
