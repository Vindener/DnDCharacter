import { create } from 'zustand';
import { uuid } from 'expo-modules-core';
import type { MonsterDto } from '@/types/Monster';
import {
  loadMonstersState,
  persistFavoriteMonsterIds,
  persistMonstersState,
  persistPinnedMonsterIds,
} from '@/dm/repositories/monsterRepository';

export interface MonsterStore {
  monsters: MonsterDto[];
  pinnedMonsterIds: string[];
  favoriteMonsterIds: string[];
  isLoaded: boolean;
  loadError: string | null;
  loadMonsters: () => Promise<void>;
  saveMonsters: (newMonsters: MonsterDto[]) => Promise<void>;
  addMonster: (monster: MonsterDto) => Promise<void>;
  addMonsters: (monsters: MonsterDto[]) => Promise<void>;
  updateMonster: (id: string, monster: MonsterDto) => Promise<void>;
  removeMonster: (id: string) => Promise<void>;
  togglePinnedMonster: (id: string) => Promise<void>;
  toggleFavoriteMonster: (id: string) => Promise<void>;
  clearPinnedMonsters: () => Promise<void>;
}

const useMonsterStore = create<MonsterStore>((set, get) => ({
  monsters: [],
  pinnedMonsterIds: [],
  favoriteMonsterIds: [],
  isLoaded: false,
  loadError: null,

  loadMonsters: async () => {
    try {
      const next = await loadMonstersState();
      set({
        monsters: next.monsters,
        pinnedMonsterIds: next.pinnedMonsterIds,
        favoriteMonsterIds: next.favoriteMonsterIds,
        isLoaded: true,
        loadError: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не вдалося завантажити монстрів.';
      set({ isLoaded: true, loadError: message });
    }
  },

  saveMonsters: async (newMonsters) => {
    try {
      const existingPins = get().pinnedMonsterIds;
      const existingFavorites = get().favoriteMonsterIds;
      const validPins = existingPins.filter((id) => newMonsters.some((monster) => monster.id === id));
      const validFavorites = existingFavorites.filter((id) => newMonsters.some((monster) => monster.id === id));
      await persistMonstersState(newMonsters, validPins, validFavorites);
      set({ monsters: newMonsters, pinnedMonsterIds: validPins, favoriteMonsterIds: validFavorites });
    } catch (_error) {
      /* intentionally ignored */
    }
  },

  addMonster: async (monster) => {
    const monsters = get().monsters;
    const monsterWithId = { ...monster, id: monster.id || uuid.v4() };
    if (monsters.some((item) => item.id === monsterWithId.id)) return;
    await get().saveMonsters([...monsters, monsterWithId]);
  },

  addMonsters: async (newMonsters) => {
    const monsters = get().monsters;
    const deduped = [
      ...monsters,
      ...newMonsters
        .map((monster) => ({ ...monster, id: monster.id || uuid.v4() }))
        .filter((monster) => !monsters.some((existing) => existing.id === monster.id)),
    ];
    await get().saveMonsters(deduped);
  },

  updateMonster: async (id, monster) => {
    const updated = get().monsters.map((item) => (item.id === id ? monster : item));
    await get().saveMonsters(updated);
  },

  removeMonster: async (id) => {
    const updated = get().monsters.filter((item) => item.id !== id);
    await get().saveMonsters(updated);
  },

  togglePinnedMonster: async (id) => {
    const currentPins = get().pinnedMonsterIds;
    const nextPins = currentPins.includes(id) ? currentPins.filter((itemId) => itemId !== id) : [...currentPins, id];
    try {
      await persistPinnedMonsterIds(nextPins);
      set({ pinnedMonsterIds: nextPins });
    } catch (_error) {
      /* intentionally ignored */
    }
  },

  toggleFavoriteMonster: async (id) => {
    const currentFavorites = get().favoriteMonsterIds;
    const nextFavorites = currentFavorites.includes(id) ? currentFavorites.filter((itemId) => itemId !== id) : [id, ...currentFavorites];
    try {
      await persistFavoriteMonsterIds(nextFavorites);
      set({ favoriteMonsterIds: nextFavorites });
    } catch (_error) {
      /* intentionally ignored */
    }
  },

  clearPinnedMonsters: async () => {
    try {
      await persistPinnedMonsterIds([]);
      set({ pinnedMonsterIds: [] });
    } catch (_error) {
      /* intentionally ignored */
    }
  },
}));

export default useMonsterStore;
