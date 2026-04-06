import AsyncStorage from '@react-native-async-storage/async-storage';
import { uuid } from 'expo-modules-core';
import { SPELLBOOK_SEED } from '@/shared/const/SpellbookSeed';
import { normalizeSpellName } from '@/shared/helpers/spellbook';
import { spellMapper } from '@/domain/mappers';
import type { SpellbookSpell, SpellDamageProfile } from '@/domain/types';
import type { SpellbookStore } from '@/stores/spellbookStore';

type SetSpellbookStore = (
  partial:
    | Partial<SpellbookStore>
    | ((state: SpellbookStore) => Partial<SpellbookStore>),
) => void;

type SpellbookStoreContext = {
  set: SetSpellbookStore;
  get: () => SpellbookStore;
};

type SpellbookStoreEffects = Pick<
  SpellbookStore,
  'loadSpellbook' | 'upsertCustomSpell' | 'removeCustomSpell' | 'toggleFavorite'
>;

const SPELLBOOK_STORAGE_KEY = 'SPELLBOOK_V1';
const FAVORITES_STORAGE_KEY = 'SPELLBOOK_FAVORITES_V1';

function buildSeedSpells(): SpellbookSpell[] {
  const now = Date.now();

  return SPELLBOOK_SEED.map((spell, index) =>
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
    .filter((spell) => Boolean(spell.name))
    .sort((a, b) => (a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name, 'uk')));
}

function mergeStoredWithSeed(stored: SpellbookSpell[], seed: SpellbookSpell[]): SpellbookSpell[] {
  const existingByName = new Set(stored.map((spell) => normalizeSpellName(spell.name)));
  const missingSeed = seed.filter((spell) => !existingByName.has(normalizeSpellName(spell.name)));
  if (!missingSeed.length) {
    return [...stored].sort((a, b) => (a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name, 'uk')));
  }
  return [...stored, ...missingSeed].sort((a, b) => (a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name, 'uk')));
}

async function persistSpells(spells: SpellbookSpell[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SPELLBOOK_STORAGE_KEY, JSON.stringify(spells));
  } catch (_error) { /* intentionally ignored */ }
}

async function persistFavorites(favoriteSpellIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteSpellIds));
  } catch (_error) { /* intentionally ignored */ }
}

function toDamageProfiles(input: SpellbookSpell['damageProfiles'] | Array<Omit<SpellDamageProfile, 'id'> | SpellDamageProfile>): SpellbookSpell['damageProfiles'] {
  return spellMapper.normalizeSpellbookDamageProfiles(input || []);
}

export function createSpellbookStoreEffects({ set, get }: SpellbookStoreContext): SpellbookStoreEffects {
  return {
    loadSpellbook: async () => {
      try {
        const [rawSpells, rawFavorites] = await Promise.all([
          AsyncStorage.getItem(SPELLBOOK_STORAGE_KEY),
          AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
        ]);

        const parsedSpells = JSON.parse(rawSpells || 'null');
        const parsedFavorites = JSON.parse(rawFavorites || '[]');

        const normalizedSpells = Array.isArray(parsedSpells)
          ? parsedSpells
              .map((item, index) => spellMapper.normalizeStoredSpellbookSpell(item, index))
              .filter((item): item is SpellbookSpell => Boolean(item))
          : [];

        const seedSpells = buildSeedSpells();
        const spells = normalizedSpells.length ? mergeStoredWithSeed(normalizedSpells, seedSpells) : seedSpells;
        const knownIds = new Set(spells.map((spell) => spell.id));
        const favoriteSpellIds = Array.isArray(parsedFavorites)
          ? parsedFavorites.map((item) => String(item)).filter((id) => knownIds.has(id))
          : [];

        set({ spells, favoriteSpellIds, isLoaded: true });

        if (!normalizedSpells.length || spells.length !== normalizedSpells.length) {
          await persistSpells(spells);
        }
      } catch {
        const fallback = buildSeedSpells();
        set({ spells: fallback, favoriteSpellIds: [], isLoaded: true });
        await persistSpells(fallback);
      }
    },

    upsertCustomSpell: async (input) => {
      if (!get().isLoaded) {
        await get().loadSpellbook();
      }

      const name = String(input?.name || '').trim();
      if (!name) return null;

      const normalizedName = normalizeSpellName(name);
      const current = get().spells;
      const byId = input.spellId ? current.find((spell) => spell.id === input.spellId) : null;
      const existingCustomByName = current.find(
        (spell) => spell.source === 'custom' && normalizeSpellName(spell.name) === normalizedName,
      );
      const existing = byId?.source === 'custom' ? byId : existingCustomByName || byId;

      if (existing) {
        if (existing.source !== 'custom') {
          const now = Date.now();
          const createdFromBase = spellMapper.spellbookMapper.draftToEntity({
            ...existing,
            id: `spell-custom-${uuid.v4()}`,
            source: 'custom',
            name,
            level: input.level ?? existing.level,
            school: String(input.school || existing.school || 'Власне').trim() || 'Власне',
            description: String(input.description || existing.description || '').trim(),
            tags: Array.isArray(input.tags)
              ? input.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
              : existing.tags,
            damageProfiles: toDamageProfiles(input.damageProfiles ?? existing.damageProfiles),
            createdAt: now,
            updatedAt: now,
          });

          const merged = [createdFromBase, ...current];
          set({ spells: merged });
          await persistSpells(merged);
          return createdFromBase;
        }

        const updated = spellMapper.spellbookMapper.draftToEntity({
          ...existing,
          name,
          level: input.level ?? existing.level,
          school: String(input.school || existing.school || 'Універсальна').trim() || 'Універсальна',
          description: String(input.description || existing.description || '').trim(),
          tags: Array.isArray(input.tags)
            ? input.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
            : existing.tags,
          damageProfiles: toDamageProfiles(input.damageProfiles ?? existing.damageProfiles),
          updatedAt: Date.now(),
        });

        const merged = current.map((spell) => (spell.id === existing.id ? updated : spell));
        set({ spells: merged });
        await persistSpells(merged);
        return updated;
      }

      const created = spellMapper.spellbookInputToEntity({
        ...input,
        name,
        spellId: input.spellId || `spell-custom-${uuid.v4()}`,
      });

      const merged = [created, ...current];
      set({ spells: merged });
      await persistSpells(merged);
      return created;
    },

    removeCustomSpell: async (spellId) => {
      if (!get().isLoaded) {
        await get().loadSpellbook();
      }

      const target = get().spells.find((spell) => spell.id === spellId);
      if (!target || target.source !== 'custom') return;

      const spells = get().spells.filter((spell) => spell.id !== spellId);
      const favoriteSpellIds = get().favoriteSpellIds.filter((id) => id !== spellId);
      set({ spells, favoriteSpellIds });

      await Promise.all([persistSpells(spells), persistFavorites(favoriteSpellIds)]);
    },

    toggleFavorite: async (spellId) => {
      if (!get().isLoaded) {
        await get().loadSpellbook();
      }

      const current = get().favoriteSpellIds;
      const next = current.includes(spellId) ? current.filter((id) => id !== spellId) : [spellId, ...current];
      set({ favoriteSpellIds: next });
      await persistFavorites(next);
    },
  };
}
