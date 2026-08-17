import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStorageEnvelope, normalizeStorageEnvelope } from '@/domain/migrations';
import { spellMapper } from '@/domain/mappers';
import { getSrdSpells } from '@/domain/srd/srdRepository';
import { srdSpellToSpellbookSpell } from '@/domain/srd/adapters';
import type { SpellbookSpell } from './spellbookEntity';
import { normalizeSpellName } from './characterSpellAdapter';
import type { SpellLocalRepository, SpellbookState } from './spellRepository';

const SPELLBOOK_STORAGE_KEY = 'SPELLBOOK_V1';
const FAVORITES_STORAGE_KEY = 'SPELLBOOK_FAVORITES_V1';
const PINS_STORAGE_KEY = 'SPELLBOOK_PINS_V1';
const NOTES_STORAGE_KEY = 'SPELLBOOK_NOTES_V1';

function parseStoredValue(raw: string | null): unknown {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sortSpells(spells: SpellbookSpell[]): SpellbookSpell[] {
  return [...spells].sort((a, b) => (a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name, 'uk')));
}

function buildSeedSpells(): SpellbookSpell[] {
  return sortSpells(
    getSrdSpells()
      .map(srdSpellToSpellbookSpell)
      .filter((spell) => Boolean(spell.name)),
  );
}

function mergeStoredWithSeed(stored: SpellbookSpell[], seed: SpellbookSpell[]): SpellbookSpell[] {
  const customStored = stored.filter((spell) => spell.source !== 'srd-5.1');
  const existingByName = new Set(seed.map((spell) => normalizeSpellName(spell.name)));
  const extraSystemByName = stored.filter((spell) => spell.source === 'srd-5.1' && !existingByName.has(normalizeSpellName(spell.name)));
  const mergedStored = [...customStored, ...extraSystemByName];
  const mergedByName = new Set(mergedStored.map((spell) => normalizeSpellName(spell.name)));
  const missingSeed = seed.filter((spell) => !mergedByName.has(normalizeSpellName(spell.name)));
  if (!missingSeed.length) {
    return sortSpells(mergedStored);
  }
  return sortSpells([...mergedStored, ...missingSeed]);
}

function buildLegacyIdMap(stored: SpellbookSpell[], spells: SpellbookSpell[]): Map<string, string> {
  const byName = new Map(spells.map((spell) => [normalizeSpellName(spell.name), spell.id]));
  return new Map(
    stored
      .map((spell) => [spell.id, byName.get(normalizeSpellName(spell.name))] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );
}

function remapKnownIds(rawIds: string[], knownIds: Set<string>, legacyIdMap: Map<string, string>): string[] {
  return Array.from(
    new Set(
      rawIds.map((id) => (knownIds.has(id) ? id : legacyIdMap.get(id))).filter((id): id is string => Boolean(id) && knownIds.has(id)),
    ),
  );
}

async function saveSpells(spells: SpellbookSpell[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SPELLBOOK_STORAGE_KEY, JSON.stringify(createStorageEnvelope('spellbookSpells', spells)));
  } catch (_error) {
    /* intentionally ignored */
  }
}

async function saveFavoriteSpellIds(favoriteSpellIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(createStorageEnvelope('spellbookFavorites', favoriteSpellIds)));
  } catch (_error) {
    /* intentionally ignored */
  }
}

async function savePinnedSpellIds(pinnedSpellIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(createStorageEnvelope('spellbookPins', pinnedSpellIds)));
  } catch (_error) {
    /* intentionally ignored */
  }
}

async function saveSpellNotesById(spellNotesById: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(createStorageEnvelope('spellbookNotes', spellNotesById)));
  } catch (_error) {
    /* intentionally ignored */
  }
}

async function loadSpellbookState(): Promise<SpellbookState> {
  try {
    const [rawSpells, rawFavorites, rawPins, rawNotesStored] = await Promise.all([
      AsyncStorage.getItem(SPELLBOOK_STORAGE_KEY),
      AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
      AsyncStorage.getItem(PINS_STORAGE_KEY),
      AsyncStorage.getItem(NOTES_STORAGE_KEY),
    ]);

    const parsedSpells = parseStoredValue(rawSpells);
    const parsedFavorites = parseStoredValue(rawFavorites);
    const parsedPins = parseStoredValue(rawPins);
    const parsedNotes = parseStoredValue(rawNotesStored);

    const spellsEnvelope = normalizeStorageEnvelope<unknown[]>('spellbookSpells', parsedSpells, []);
    const favoriteEnvelope = normalizeStorageEnvelope<unknown[]>('spellbookFavorites', parsedFavorites, []);
    const pinsEnvelope = normalizeStorageEnvelope<unknown[]>('spellbookPins', parsedPins, []);
    const notesEnvelope = normalizeStorageEnvelope<Record<string, unknown>>('spellbookNotes', parsedNotes, {});

    const normalizedSpells = Array.isArray(spellsEnvelope.data)
      ? spellsEnvelope.data
          .map((item, index) => spellMapper.normalizeStoredSpellbookSpell(item, index))
          .filter((item): item is SpellbookSpell => Boolean(item))
      : [];

    const seedSpells = buildSeedSpells();
    const spells = normalizedSpells.length ? mergeStoredWithSeed(normalizedSpells, seedSpells) : seedSpells;

    const knownIds = new Set(spells.map((spell) => spell.id));
    const legacyIdMap = buildLegacyIdMap(normalizedSpells, spells);
    const rawFavoriteIds = Array.isArray(favoriteEnvelope.data) ? favoriteEnvelope.data.map((item) => String(item)) : [];
    const favoriteSpellIds = remapKnownIds(rawFavoriteIds, knownIds, legacyIdMap);
    const rawPinnedIds = Array.isArray(pinsEnvelope.data) ? pinsEnvelope.data.map((item) => String(item)) : [];
    const pinnedSpellIds = remapKnownIds(rawPinnedIds, knownIds, legacyIdMap);
    const rawNotesById = notesEnvelope.data && typeof notesEnvelope.data === 'object' ? notesEnvelope.data : {};
    const spellNotesById = Object.fromEntries(
      Object.entries(rawNotesById)
        .map(([id, value]) => [knownIds.has(id) ? id : legacyIdMap.get(id), value] as const)
        .filter(
          (entry): entry is readonly [string, unknown] =>
            Boolean(entry[0]) && knownIds.has(entry[0]) && Boolean(String(entry[1] || '').trim()),
        )
        .map(([id, value]) => [id, String(value).trim()]),
    );

    const shouldPersistSpells =
      spellsEnvelope.usedLegacyFormat || spellsEnvelope.migrated || !normalizedSpells.length || spells.length !== normalizedSpells.length;

    const shouldPersistFavorites =
      favoriteEnvelope.usedLegacyFormat || favoriteEnvelope.migrated || favoriteSpellIds.length !== rawFavoriteIds.length;
    const shouldPersistPins = pinsEnvelope.usedLegacyFormat || pinsEnvelope.migrated || pinnedSpellIds.length !== rawPinnedIds.length;
    const shouldPersistNotes =
      notesEnvelope.usedLegacyFormat || notesEnvelope.migrated || Object.keys(spellNotesById).length !== Object.keys(rawNotesById).length;

    if (shouldPersistSpells) {
      await saveSpells(spells);
    }

    if (shouldPersistFavorites) {
      await saveFavoriteSpellIds(favoriteSpellIds);
    }

    if (shouldPersistPins) {
      await savePinnedSpellIds(pinnedSpellIds);
    }

    if (shouldPersistNotes) {
      await saveSpellNotesById(spellNotesById);
    }

    return { spells, favoriteSpellIds, pinnedSpellIds, spellNotesById };
  } catch {
    const fallback = buildSeedSpells();
    await saveSpells(fallback);
    await saveFavoriteSpellIds([]);
    await savePinnedSpellIds([]);
    await saveSpellNotesById({});
    return { spells: fallback, favoriteSpellIds: [], pinnedSpellIds: [], spellNotesById: {} };
  }
}

export function createSpellLocalRepository(): SpellLocalRepository {
  return {
    loadSpellbookState,
    saveSpells,
    saveFavoriteSpellIds,
    savePinnedSpellIds,
    saveSpellNotesById,
  };
}
