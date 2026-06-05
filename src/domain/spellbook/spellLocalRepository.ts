import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPELLBOOK_SEED } from '@/shared/const/SpellbookSeed';
import { createStorageEnvelope, normalizeStorageEnvelope } from '@/domain/migrations';
import { spellMapper } from '@/domain/mappers';
import type { SpellbookSpell, SpellComponents } from './spellbookEntity';
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
  const now = Date.now();
  const emptyComponents: SpellComponents = { verbal: false, somatic: false, material: '' };

  return sortSpells(
    SPELLBOOK_SEED.map((spell, index) =>
      spellMapper.spellbookMapper.draftToEntity({
        id: `spell-system-${index + 1}`,
        name: String(spell.name || '').trim(),
        level: spell.level,
        school: String(spell.school || 'Універсальна').trim() || 'Універсальна',
        castingTime: String(spell.castingTime || '').trim(),
        range: String(spell.range || '').trim(),
        components: typeof spell.components === 'string' ? emptyComponents : spell.components || emptyComponents,
        duration: String(spell.duration || '').trim(),
        description: String(spell.description || '').trim(),
        higherLevels: String(spell.higherLevels || '').trim(),
        classes: Array.isArray(spell.classes) ? spell.classes.map((className) => String(className || '').trim()).filter(Boolean) : [],
        tags: Array.isArray(spell.tags) ? spell.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [],
        ritual: Boolean(spell.ritual),
        concentration: Boolean(spell.concentration),
        damageProfiles: spellMapper.normalizeSpellbookDamageProfiles(spell.damageProfiles || []),
        source: 'system',
        createdAt: now,
        updatedAt: now,
      }),
    )
      .filter((spell) => Boolean(spell.name)),
  );
}

function mergeStoredWithSeed(stored: SpellbookSpell[], seed: SpellbookSpell[]): SpellbookSpell[] {
  const existingByName = new Set(stored.map((spell) => normalizeSpellName(spell.name)));
  const missingSeed = seed.filter((spell) => !existingByName.has(normalizeSpellName(spell.name)));
  if (!missingSeed.length) {
    return sortSpells(stored);
  }
  return sortSpells([...stored, ...missingSeed]);
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
    await AsyncStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(createStorageEnvelope('spellbookFavorites', favoriteSpellIds)),
    );
  } catch (_error) {
    /* intentionally ignored */
  }
}

async function savePinnedSpellIds(pinnedSpellIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PINS_STORAGE_KEY,
      JSON.stringify(createStorageEnvelope('spellbookPins', pinnedSpellIds)),
    );
  } catch (_error) {
    /* intentionally ignored */
  }
}

async function saveSpellNotesById(spellNotesById: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(
      NOTES_STORAGE_KEY,
      JSON.stringify(createStorageEnvelope('spellbookNotes', spellNotesById)),
    );
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
    const rawFavoriteIds = Array.isArray(favoriteEnvelope.data) ? favoriteEnvelope.data.map((item) => String(item)) : [];
    const favoriteSpellIds = rawFavoriteIds.filter((id) => knownIds.has(id));
    const rawPinnedIds = Array.isArray(pinsEnvelope.data) ? pinsEnvelope.data.map((item) => String(item)) : [];
    const pinnedSpellIds = rawPinnedIds.filter((id) => knownIds.has(id));
    const rawNotesById = notesEnvelope.data && typeof notesEnvelope.data === 'object' ? notesEnvelope.data : {};
    const spellNotesById = Object.fromEntries(
      Object.entries(rawNotesById)
        .filter(([id, value]) => knownIds.has(id) && String(value || '').trim())
        .map(([id, value]) => [id, String(value).trim()]),
    );

    const shouldPersistSpells =
      spellsEnvelope.usedLegacyFormat ||
      spellsEnvelope.migrated ||
      !normalizedSpells.length ||
      spells.length !== normalizedSpells.length;

    const shouldPersistFavorites =
      favoriteEnvelope.usedLegacyFormat ||
      favoriteEnvelope.migrated ||
      favoriteSpellIds.length !== rawFavoriteIds.length;
    const shouldPersistPins =
      pinsEnvelope.usedLegacyFormat ||
      pinsEnvelope.migrated ||
      pinnedSpellIds.length !== rawPinnedIds.length;
    const shouldPersistNotes =
      notesEnvelope.usedLegacyFormat ||
      notesEnvelope.migrated ||
      Object.keys(spellNotesById).length !== Object.keys(rawNotesById).length;

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
