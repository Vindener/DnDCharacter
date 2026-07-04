import AsyncStorage from '@react-native-async-storage/async-storage';
import { uuid } from 'expo-modules-core';
import type { CharacterCustomResource } from '@/types/Character';
import type { ResourceTemplate } from '@/dm/domain/types';
import type { DmStore } from '@/stores/dmStore';
import { createStorageEnvelope, normalizeStorageEnvelope } from '@/domain/migrations';
import { getSrdMonsters } from '@/domain/srd/srdRepository';
import { srdMonsterToMonsterDto } from '@/domain/srd/adapters';
import type { MonsterDto } from '@/types/Monster';

type SetDmStore = (
  partial:
    | Partial<DmStore>
    | ((state: DmStore) => Partial<DmStore>),
) => void;

type DmStoreContext = {
  set: SetDmStore;
  get: () => DmStore;
};

type DmStoreEffects = Pick<
  DmStore,
  | 'loadMonsters'
  | 'saveMonsters'
  | 'addMonster'
  | 'addMonsters'
  | 'updateMonster'
  | 'removeMonster'
  | 'togglePinnedMonster'
  | 'toggleFavoriteMonster'
  | 'clearPinnedMonsters'
  | 'setRole'
  | 'loadRole'
  | 'loadUserTemplates'
  | 'addUserTemplateFromResource'
  | 'removeUserTemplate'
>;

const MONSTERS_STORAGE_KEY = 'monsters';
const PINS_STORAGE_KEY = 'monster-pins';
const FAVORITES_STORAGE_KEY = 'monster-favorites';
const ROLE_STORAGE_KEY = 'APP_ROLE_MODE_V1';
const USER_TEMPLATES_STORAGE_KEY = 'RESOURCE_USER_TEMPLATES_V1';

async function persistUserTemplates(templates: ResourceTemplate[]): Promise<void> {
  try {
    const envelope = createStorageEnvelope('dmUserTemplates', templates || []);
    await AsyncStorage.setItem(USER_TEMPLATES_STORAGE_KEY, JSON.stringify(envelope));
  } catch (_error) { /* intentionally ignored */ }
}

function normalizeRole(raw: unknown): 'Player' | 'DM' | 'Hybrid' {
  if (raw === 'Player' || raw === 'DM' || raw === 'Hybrid') return raw;
  return 'Hybrid';
}


function parseStoredValue(raw: string | null): unknown {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function isSrdMonster(monster: Pick<MonsterDto, 'source'>): boolean {
  return monster.source === 'srd-5.1';
}

function normalizeCustomMonster(monster: MonsterDto): MonsterDto {
  if (isSrdMonster(monster)) return monster;
  return {
    ...monster,
    source: monster.source || 'user-custom',
    license: monster.license || 'custom',
    isCustom: monster.isCustom ?? true,
  };
}

function getSrdMonsterSeed(): MonsterDto[] {
  return getSrdMonsters().map(srdMonsterToMonsterDto);
}

function mergeMonstersWithSrd(stored: MonsterDto[]): MonsterDto[] {
  const srdMonsters = getSrdMonsterSeed();
  const srdNames = new Set(srdMonsters.map((monster) => monster.name.trim().toLowerCase()));
  const custom = stored
    .filter((monster) => !isSrdMonster(monster))
    .map(normalizeCustomMonster)
    .filter((monster) => monster.id && monster.name);
  const customIds = new Set(custom.map((monster) => monster.id));
  const mergedSrd = srdMonsters.filter((monster) => !customIds.has(monster.id));
  const extras = custom.filter((monster) => !srdNames.has(monster.name.trim().toLowerCase()) || monster.isCustom);
  return [...extras, ...mergedSrd];
}

function persistableMonsters(monsters: MonsterDto[]): MonsterDto[] {
  return monsters.filter((monster) => !isSrdMonster(monster));
}
export function createDmStoreEffects({ set, get }: DmStoreContext): DmStoreEffects {
  const saveMonsters: DmStore['saveMonsters'] = async (newMonsters) => {
    try {
      const mergedMonsters = mergeMonstersWithSrd(newMonsters as MonsterDto[]);
      const existingPins = get().pinnedMonsterIds;
      const existingFavorites = get().favoriteMonsterIds;
      const validPins = existingPins.filter((id) => mergedMonsters.some((monster) => monster.id === id));
      const validFavorites = existingFavorites.filter((id) => mergedMonsters.some((monster) => monster.id === id));
      await AsyncStorage.setItem(MONSTERS_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmMonsters', persistableMonsters(mergedMonsters))));
      await AsyncStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmPins', validPins)));
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmMonsterFavorites', validFavorites)));
      set({ monsters: mergedMonsters, pinnedMonsterIds: validPins, favoriteMonsterIds: validFavorites, isLoaded: true, loadError: null });
    } catch (error) {
      set({ loadError: error instanceof Error ? error.message : 'Не вдалося зберегти бестіарій.' });
    }
  };

  return {
    loadMonsters: async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(MONSTERS_STORAGE_KEY);
        const monstersParsed = parseStoredValue(jsonValue);
        const monstersMigrated = normalizeStorageEnvelope<unknown[]>('dmMonsters', monstersParsed, []);
        const filtered = Array.isArray(monstersMigrated.data) ? monstersMigrated.data.filter(Boolean) : [];
        const mergedMonsters = mergeMonstersWithSrd(filtered as MonsterDto[]);

        const rawPins = await AsyncStorage.getItem(PINS_STORAGE_KEY);
        const pinsParsed = parseStoredValue(rawPins);
        const pinsMigrated = normalizeStorageEnvelope<string[]>('dmPins', pinsParsed, []);
        const validPins = Array.isArray(pinsMigrated.data) ? pinsMigrated.data.filter(Boolean) : [];
        const nextPins = validPins.filter((id) => mergedMonsters.some((monster) => monster.id === id));
        const rawFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        const favoritesParsed = parseStoredValue(rawFavorites);
        const favoritesMigrated = normalizeStorageEnvelope<string[]>('dmMonsterFavorites', favoritesParsed, []);
        const validFavorites = Array.isArray(favoritesMigrated.data) ? favoritesMigrated.data.filter(Boolean) : [];
        const nextFavorites = validFavorites.filter((id) => mergedMonsters.some((monster) => monster.id === id));
        set({
          monsters: mergedMonsters as DmStore['monsters'],
          pinnedMonsterIds: nextPins,
          favoriteMonsterIds: nextFavorites,
          isLoaded: true,
          loadError: null,
        });
      } catch (error) {
        set({ isLoaded: true, loadError: error instanceof Error ? error.message : 'Не вдалося завантажити бестіарій.' });
      }
    },

    saveMonsters,

    addMonster: async (monster) => {
      const monsters = get().monsters;
      const monsterWithId = normalizeCustomMonster({ ...monster, id: monster.id || uuid.v4() } as MonsterDto);
      if (monsters.some((item) => item.id === monsterWithId.id)) return;
      const updated = [...monsters, monsterWithId];
      await saveMonsters(updated);
    },

    addMonsters: async (newMonsters) => {
      const monsters = get().monsters;
      const deduped = [
        ...monsters,
        ...newMonsters
          .map((monster) => normalizeCustomMonster({ ...monster, id: monster.id || uuid.v4() } as MonsterDto))
          .filter((monster) => !monsters.some((existing) => existing.id === monster.id)),
      ];
      await saveMonsters(deduped);
    },

    updateMonster: async (id, monster) => {
      const target = get().monsters.find((item) => item.id === id);
      if (target && isSrdMonster(target)) return;
      const updated = get().monsters.map((item) => (item.id === id ? normalizeCustomMonster(monster as MonsterDto) : item));
      await saveMonsters(updated);
    },

    removeMonster: async (id) => {
      const target = get().monsters.find((item) => item.id === id);
      if (target && isSrdMonster(target)) return;
      const updated = get().monsters.filter((item) => item.id !== id);
      await saveMonsters(updated);
    },

    togglePinnedMonster: async (id) => {
      const currentPins = get().pinnedMonsterIds;
      const nextPins = currentPins.includes(id) ? currentPins.filter((itemId) => itemId !== id) : [...currentPins, id];
      try {
        await AsyncStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmPins', nextPins)));
        set({ pinnedMonsterIds: nextPins });
      } catch (_error) { /* intentionally ignored */ }
    },

    toggleFavoriteMonster: async (id) => {
      const currentFavorites = get().favoriteMonsterIds;
      const nextFavorites = currentFavorites.includes(id)
        ? currentFavorites.filter((itemId) => itemId !== id)
        : [id, ...currentFavorites];
      try {
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmMonsterFavorites', nextFavorites)));
        set({ favoriteMonsterIds: nextFavorites });
      } catch (_error) { /* intentionally ignored */ }
    },

    clearPinnedMonsters: async () => {
      try {
        await AsyncStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmPins', [])));
        set({ pinnedMonsterIds: [] });
      } catch (_error) { /* intentionally ignored */ }
    },

    setRole: async (role) => {
      set({ role });
      try {
        await AsyncStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(createStorageEnvelope('appRole', role)));
      } catch (_error) { /* intentionally ignored */ }
    },

    loadRole: async () => {
      try {
        const raw = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
        const parsed = parseStoredValue(raw);
        const migrated = normalizeStorageEnvelope<string>('appRole', parsed, 'Hybrid');
        set({ role: normalizeRole(migrated.data) });
      } catch (_error) { /* intentionally ignored */ }
    },

    loadUserTemplates: async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_TEMPLATES_STORAGE_KEY);
        const parsed = parseStoredValue(raw);
        const migrated = normalizeStorageEnvelope<unknown[]>('dmUserTemplates', parsed, []);
        if (!Array.isArray(migrated.data)) {
          set({ userTemplates: [] });
          return;
        }

        const normalized: ResourceTemplate[] = migrated.data
          .map((entry: unknown, index: number) => {
            const cast = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
            const resource = cast.resource && typeof cast.resource === 'object' ? (cast.resource as Record<string, unknown>) : {};

            return {
              id: String(cast.id || `user-template-${index}`),
              name: String(cast.name || `Шаблон ${index + 1}`),
              source: 'user' as const,
              resource: {
                label: String(resource.label || 'Ресурс'),
                current: Math.max(0, Number(resource.current) || 0),
                max: typeof resource.max === 'number' ? Math.max(0, resource.max) : undefined,
                resetRule: String(resource.resetRule || 'none') as CharacterCustomResource['resetRule'],
                visibility: resource.visibility as CharacterCustomResource['visibility'],
                color: typeof resource.color === 'string' ? resource.color : undefined,
              },
            };
          })
          .slice(0, 50);

        set({ userTemplates: normalized });
      } catch {
        set({ userTemplates: [] });
      }
    },

    addUserTemplateFromResource: async (resource, name) => {
      const current = get().userTemplates;
      const next: ResourceTemplate = {
        id: `user-template-${Date.now()}`,
        name: (name || resource.label || 'Власний шаблон').trim(),
        source: 'user',
        resource: {
          label: resource.label || 'Ресурс',
          current: Math.max(0, Number(resource.current) || 0),
          max: typeof resource.max === 'number' ? Math.max(0, resource.max) : undefined,
          resetRule: resource.resetRule || 'none',
          visibility: resource.visibility,
          color: resource.color,
        },
      };
      const merged = [next, ...current].slice(0, 50);
      set({ userTemplates: merged });
      await persistUserTemplates(merged);
    },

    removeUserTemplate: async (templateId) => {
      const merged = get().userTemplates.filter((template) => template.id !== templateId);
      set({ userTemplates: merged });
      await persistUserTemplates(merged);
    },
  };
}

