import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uuid } from 'expo-modules-core';
import { CustomCoin } from '@/types/CustomCoin';

interface CustomCoinsState {
  coins: CustomCoin[];
  load: () => Promise<void>;
  add: (data: Omit<CustomCoin, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const STORAGE_KEY = 'custom_coins';

const useCustomCoinsStore = create<CustomCoinsState>((set, get) => ({
  coins: [],
  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: CustomCoin[] = JSON.parse(raw || '[]');
      set({ coins: Array.isArray(parsed) ? parsed : [] });
    } catch (_error) { /* intentionally ignored */ }
  },
  add: async (data) => {
    const next: CustomCoin = { id: uuid.v4() as string, ...data };
    const updated = [...get().coins, next];
    set({ coins: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_error) { /* intentionally ignored */ }
  },
  remove: async (id) => {
    const updated = get().coins.filter((c) => c.id !== id);
    set({ coins: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_error) { /* intentionally ignored */ }
  },
  clearAll: async () => {
    set({ coins: [] });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (_error) { /* intentionally ignored */ }
  },
}));

export default useCustomCoinsStore;

