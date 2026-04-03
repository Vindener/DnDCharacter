import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppRole } from '@/types/Product';

interface AppRoleState {
  role: AppRole;
  setRole: (role: AppRole) => Promise<void>;
  loadRole: () => Promise<void>;
}

const STORAGE_KEY = 'APP_ROLE_MODE_V1';

const useAppRoleStore = create<AppRoleState>((set) => ({
  role: 'Hybrid',

  setRole: async (role) => {
    set({ role });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, role);
    } catch (_error) { /* intentionally ignored */ }
  },

  loadRole: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      if (value === 'Player' || value === 'DM' || value === 'Hybrid') {
        set({ role: value });
      }
    } catch (_error) { /* intentionally ignored */ }
  },
}));

export default useAppRoleStore;

