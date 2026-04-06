import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPELLBOOK_SEED } from '@/shared/const/SpellbookSeed';
import { createStorageEnvelope, normalizeStorageEnvelope } from '@/domain/migrations';
import { spellMapper } from '@/domain/mappers';
import type { SpellbookSpell } from './spellbookEntity';
import { normalizeSpellName } from './characterSpellAdapter';
import type { SpellLocalRepository, SpellbookState } from './spellRepository';

const SPELLBOOK_STORAGE_KEY = 'SPELLBOOK_V1';
const FAVORITES_STORAGE_KEY = 'SPELLBOOK_FAVORITES_V1';

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

  return sortSpells(
    SPELLBOOK_SEED.map((spell, index) =>
      spellMapper.spellbookMapper.draftToEntity({
        id: `spell-system-${index + 1}`,
        name: String(spell.name || '').trim(),
        level: spell.level,
        school: String(spell.school || 'Універсальна').trim() || 'Універсальна',
        description: String(spell.description || '').trim(),
        tags: Array.isArray(spell.tags) ? spell.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [],
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

async function loadSpellbookState(): Promise<SpellbookState> {
  try {
    const [rawSpells, rawFavorites] = await Promise.all([
      AsyncStorage.getItem(SPELLBOOK_STORAGE_KEY),
      AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
    ]);

    const parsedSpells = parseStoredValue(rawSpells);
    const parsedFavorites = parseStoredValue(rawFavorites);

    const spellsEnvelope = normalizeStorageEnvelope<unknown[]>('spellbookSpells', parsedSpells, []);
    const favoriteEnvelope = normalizeStorageEnvelope<unknown[]>('spellbookFavorites', parsedFavorites, []);

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

    const shouldPersistSpells =
      spellsEnvelope.usedLegacyFormat ||
      spellsEnvelope.migrated ||
      !normalizedSpells.length ||
      spells.length !== normalizedSpells.length;

    const shouldPersistFavorites =
      favoriteEnvelope.usedLegacyFormat ||
      favoriteEnvelope.migrated ||
      favoriteSpellIds.length !== rawFavoriteIds.length;

    if (shouldPersistSpells) {
      await saveSpells(spells);
    }

    if (shouldPersistFavorites) {
      await saveFavoriteSpellIds(favoriteSpellIds);
    }

    return { spells, favoriteSpellIds };
  } catch {
    const fallback = buildSeedSpells();
    await saveSpells(fallback);
    await saveFavoriteSpellIds([]);
    return { spells: fallback, favoriteSpellIds: [] };
  }
}

export function createSpellLocalRepository(): SpellLocalRepository {
  return {
    loadSpellbookState,
    saveSpells,
    saveFavoriteSpellIds,
  };
}
