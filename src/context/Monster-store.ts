import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MonsterDto } from '@/types/Monster';
import { uuid } from 'expo-modules-core';

interface MonsterStore {
  monsters: MonsterDto[];
  pinnedMonsterIds: string[];
  loadMonsters: () => Promise<void>;
  saveMonsters: (newMonsters: MonsterDto[]) => Promise<void>;
  addMonster: (monster: MonsterDto) => Promise<void>;
  addMonsters: (monsters: MonsterDto[]) => Promise<void>;
  updateMonster: (id: string, monster: MonsterDto) => Promise<void>;
  removeMonster: (id: string) => Promise<void>;
  togglePinnedMonster: (id: string) => Promise<void>;
  clearPinnedMonsters: () => Promise<void>;
}

const STORAGE_KEY = 'monsters';
const PINS_STORAGE_KEY = 'monster-pins';

const useMonsterStore = create<MonsterStore>((set, get) => ({
  monsters: [],
  pinnedMonsterIds: [],

  loadMonsters: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: MonsterDto[] = JSON.parse(jsonValue || '[]');
      const filtered = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      const rawPins = await AsyncStorage.getItem(PINS_STORAGE_KEY);
      const parsedPins = JSON.parse(rawPins || '[]');
      const validPins = Array.isArray(parsedPins) ? (parsedPins as string[]) : [];
      const nextPins = validPins.filter((id) => filtered.some((monster) => monster.id === id));
      set({ monsters: filtered, pinnedMonsterIds: nextPins });
    } catch {}
  },

  saveMonsters: async (newMonsters: MonsterDto[]) => {
    try {
      const existingPins = get().pinnedMonsterIds;
      const validPins = existingPins.filter((id) => newMonsters.some((monster) => monster.id === id));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMonsters));
      await AsyncStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(validPins));
      set({ monsters: newMonsters, pinnedMonsterIds: validPins });
    } catch {}
  },

  addMonster: async (monster: MonsterDto) => {
    const { monsters, saveMonsters } = get();
    const monsterWithId = { ...monster, id: monster.id || uuid.v4() };
    if (monsters.some((m) => m.id === monsterWithId.id)) return;
    const updated = [...monsters, monsterWithId];
    await saveMonsters(updated);
  },

  addMonsters: async (newMonsters: MonsterDto[]) => {
    const { monsters, saveMonsters } = get();
    const deduped = [
      ...monsters,
      ...newMonsters.map((m) => ({ ...m, id: m.id || uuid.v4() })).filter((m) => !monsters.some((ex) => ex.id === m.id)),
    ];
    await saveMonsters(deduped);
  },

  updateMonster: async (id: string, monster: MonsterDto) => {
    const { monsters, saveMonsters } = get();
    const updated = monsters.map((m) => (m.id === id ? monster : m));
    await saveMonsters(updated);
  },

  removeMonster: async (id: string) => {
    const { monsters, saveMonsters } = get();
    const updated = monsters.filter((m) => m.id !== id);
    await saveMonsters(updated);
  },

  togglePinnedMonster: async (id: string) => {
    const currentPins = get().pinnedMonsterIds;
    const nextPins = currentPins.includes(id) ? currentPins.filter((itemId) => itemId !== id) : [...currentPins, id];
    try {
      await AsyncStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(nextPins));
      set({ pinnedMonsterIds: nextPins });
    } catch {}
  },

  clearPinnedMonsters: async () => {
    try {
      await AsyncStorage.setItem(PINS_STORAGE_KEY, JSON.stringify([]));
      set({ pinnedMonsterIds: [] });
    } catch {}
  },
}));

export default useMonsterStore;
