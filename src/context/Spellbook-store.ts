import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { uuid } from 'expo-modules-core';
import { SPELLBOOK_SEED } from '@/shared/const/SpellbookSeed';
import { normalizeSpellName } from '@/shared/helpers/spellbook';
import type { Dnd5DamageType, SpellDamageProfile, SpellbookSpell, UpsertSpellbookSpellInput } from '@/types/Spellbook';

interface SpellbookStore {
  spells: SpellbookSpell[];
  favoriteSpellIds: string[];
  isLoaded: boolean;
  loadSpellbook: () => Promise<void>;
  upsertCustomSpell: (input: UpsertSpellbookSpellInput) => Promise<SpellbookSpell | null>;
  removeCustomSpell: (spellId: string) => Promise<void>;
  toggleFavorite: (spellId: string) => Promise<void>;
}

const SPELLBOOK_STORAGE_KEY = 'SPELLBOOK_V1';
const FAVORITES_STORAGE_KEY = 'SPELLBOOK_FAVORITES_V1';
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
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

function normalizeDamageProfiles(value: unknown): SpellDamageProfile[] {
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

function buildSeedSpells(): SpellbookSpell[] {
  const now = Date.now();
  return SPELLBOOK_SEED.map((spell, index) => ({
    id: `spell-system-${index + 1}`,
    name: String(spell.name || '').trim(),
    level: clampSpellLevel(spell.level),
    school: String(spell.school || 'Універсальна').trim() || 'Універсальна',
    description: String(spell.description || '').trim(),
    tags: Array.isArray(spell.tags) ? spell.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [],
    damageProfiles: normalizeDamageProfiles(spell.damageProfiles || []),
    source: 'system' as const,
    createdAt: now,
    updatedAt: now,
  }))
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

function normalizeStoredSpell(raw: unknown, fallbackIndex: number): SpellbookSpell | null {
  const cast = asRecord(raw);
  const name = String(cast?.name || '').trim();
  if (!name) return null;

  const source = cast?.source === 'custom' || cast?.source === 'imported' ? cast.source : 'system';
  const now = Date.now();

  return {
    id: String(cast?.id || `spell-${fallbackIndex}-${normalizeSpellName(name) || 'unnamed'}`),
    name,
    level: clampSpellLevel(Number(cast?.level)),
    school: String(cast?.school || 'Універсальна').trim() || 'Універсальна',
    description: String(cast?.description || '').trim(),
    tags: Array.isArray(cast?.tags) ? cast.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [],
    damageProfiles: normalizeDamageProfiles(cast?.damageProfiles),
    source,
    createdAt: Number(cast?.createdAt) || now,
    updatedAt: Number(cast?.updatedAt) || now,
  };
}

async function persistSpells(spells: SpellbookSpell[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SPELLBOOK_STORAGE_KEY, JSON.stringify(spells));
  } catch {}
}

async function persistFavorites(favoriteSpellIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteSpellIds));
  } catch {}
}

const useSpellbookStore = create<SpellbookStore>((set, get) => ({
  spells: [],
  favoriteSpellIds: [],
  isLoaded: false,

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
            .map((item, index) => normalizeStoredSpell(item, index))
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
    const nextDamageProfiles = normalizeDamageProfiles(input.damageProfiles || []);

    if (existing) {
      if (existing.source !== 'custom') {
        const now = Date.now();
        const createdFromBase: SpellbookSpell = {
          ...existing,
          id: `spell-custom-${uuid.v4()}`,
          name,
          level: clampSpellLevel(input.level ?? existing.level),
          school: String(input.school || existing.school || 'Власне').trim() || 'Власне',
          description: String(input.description || existing.description || '').trim(),
          tags: Array.isArray(input.tags)
            ? input.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
            : existing.tags,
          damageProfiles: nextDamageProfiles.length ? nextDamageProfiles : existing.damageProfiles,
          source: 'custom',
          createdAt: now,
          updatedAt: now,
        };
        const merged = [createdFromBase, ...current];
        set({ spells: merged });
        await persistSpells(merged);
        return createdFromBase;
      }

      const updated: SpellbookSpell = {
        ...existing,
        name,
        level: clampSpellLevel(input.level ?? existing.level),
        school: String(input.school || existing.school || 'Універсальна').trim() || 'Універсальна',
        description: String(input.description || existing.description || '').trim(),
        tags: Array.isArray(input.tags)
          ? input.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
          : existing.tags,
        damageProfiles: nextDamageProfiles.length ? nextDamageProfiles : existing.damageProfiles,
        updatedAt: Date.now(),
      };

      const merged = current.map((spell) => (spell.id === existing.id ? updated : spell));
      set({ spells: merged });
      await persistSpells(merged);
      return updated;
    }

    const now = Date.now();
    const created: SpellbookSpell = {
      id: `spell-custom-${uuid.v4()}`,
      name,
      level: clampSpellLevel(input.level),
      school: String(input.school || 'Власне').trim() || 'Власне',
      description: String(input.description || '').trim(),
      tags: Array.isArray(input.tags) ? input.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [],
      damageProfiles: nextDamageProfiles,
      source: 'custom',
      createdAt: now,
      updatedAt: now,
    };

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
}));

export default useSpellbookStore;
