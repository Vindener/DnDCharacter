import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MonsterDto } from '@/types/Monster';
import { uuid } from 'expo-modules-core';

interface MonsterStore {
  monsters: MonsterDto[];
  loadMonsters: () => Promise<void>;
  saveMonsters: (newMonsters: MonsterDto[]) => Promise<void>;
  addMonster: (monster: MonsterDto) => Promise<void>;
  updateMonster: (id: string, monster: MonsterDto) => Promise<void>;
  removeMonster: (id: string) => Promise<void>;
}

const STORAGE_KEY = 'monsters';

const useMonsterStore = create<MonsterStore>((set, get) => ({
  monsters: [],

  loadMonsters: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: MonsterDto[] = JSON.parse(jsonValue || '[]');
      const filtered = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      set({ monsters: filtered });
    } catch {}
  },

  saveMonsters: async (newMonsters: MonsterDto[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMonsters));
      set({ monsters: newMonsters });
    } catch {}
  },

  addMonster: async (monster: MonsterDto) => {
    const { monsters, saveMonsters } = get();
    const monsterWithId = { ...monster, id: monster.id || uuid.v4() };
    const updated = [...monsters, monsterWithId];
    await saveMonsters(updated);
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
}));

export default useMonsterStore;
