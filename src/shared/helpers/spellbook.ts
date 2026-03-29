import type { CharacterDto } from '@/types/Character';
import type { CharacterSpellStatus } from '@/types/Spellbook';

export function normalizeSpellName(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase();
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

export function collectCharacterSpellNames(character: CharacterDto | null | undefined): string[] {
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

export function getCharacterSpellStatus(character: CharacterDto | null | undefined, spellName: string): CharacterSpellStatus {
  if (!character) return 'available';
  if (hasSpell(character.spells?.preparedSpells || [], spellName)) return 'prepared';
  if (hasSpell(character.spells?.cantrips || [], spellName)) return 'cantrip';
  if (hasSpell(character.spells?.knownSpells || [], spellName)) return 'known';
  return 'available';
}

export function applySpellStatus(character: CharacterDto, spellName: string, status: CharacterSpellStatus): CharacterDto {
  const name = String(spellName || '').trim();
  if (!name) return character;

  const known = [...(character.spells?.knownSpells || [])];
  const prepared = [...(character.spells?.preparedSpells || [])];
  const cantrips = [...(character.spells?.cantrips || [])];

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
        ...character.spells,
        ...cleaned,
      },
    };
  }

  if (status === 'known') {
    const cleaned = resetToAvailable();
    return {
      ...character,
      spells: {
        ...character.spells,
        knownSpells: addUniqueSpell(cleaned.knownSpells, name),
        preparedSpells: cleaned.preparedSpells,
        cantrips: cleaned.cantrips,
      },
    };
  }

  if (status === 'prepared') {
    const cleaned = resetToAvailable();
    return {
      ...character,
      spells: {
        ...character.spells,
        knownSpells: addUniqueSpell(cleaned.knownSpells, name),
        preparedSpells: addUniqueSpell(cleaned.preparedSpells, name),
        cantrips: cleaned.cantrips,
      },
    };
  }

  const cleaned = resetToAvailable();
  return {
    ...character,
    spells: {
      ...character.spells,
      knownSpells: cleaned.knownSpells,
      preparedSpells: cleaned.preparedSpells,
      cantrips: addUniqueSpell(cleaned.cantrips, name),
    },
  };
}
