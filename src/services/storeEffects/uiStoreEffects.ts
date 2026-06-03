import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { uuid } from 'expo-modules-core';
import { darkColors, lightColors } from '@/shared/styles/theme';
import type { UiStore } from '@/stores/uiStore';

type SetUiStore = (
  partial:
    | Partial<UiStore>
    | ((state: UiStore) => Partial<UiStore>),
) => void;

type UiStoreContext = {
  set: SetUiStore;
  get: () => UiStore;
};

type UiStoreEffects = Pick<UiStore, 'toggleTheme' | 'loadTheme' | 'load' | 'add' | 'remove' | 'clearAll'>;

const THEME_STORAGE_KEY = 'APP_THEME';
const CUSTOM_COINS_STORAGE_KEY = 'custom_coins';

export function createUiStoreEffects({ set, get }: UiStoreContext): UiStoreEffects {
  return {
    toggleTheme: async () => {
      const current = get().isDark;
      const newIsDark = !current;
      const newTheme = newIsDark ? DarkTheme : DefaultTheme;
      const newColors = newIsDark ? darkColors : lightColors;
      set({ isDark: newIsDark, theme: newTheme, colors: newColors });
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ isDark: newIsDark }));
      } catch (_error) { /* intentionally ignored */ }
    },

    loadTheme: async () => {
      try {
        const value = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (value) {
          const parsed = JSON.parse(value);
          const isDark = !!parsed.isDark;
          set({
            isDark,
            theme: isDark ? DarkTheme : DefaultTheme,
            colors: isDark ? darkColors : lightColors,
          });
        }
      } catch (_error) { /* intentionally ignored */ }
    },

    load: async () => {
      try {
        const raw = await AsyncStorage.getItem(CUSTOM_COINS_STORAGE_KEY);
        const parsed = JSON.parse(raw || '[]');
        set({ coins: Array.isArray(parsed) ? parsed : [] });
      } catch (_error) { /* intentionally ignored */ }
    },

    add: async (data) => {
      const next = { id: uuid.v4() as string, ...data };
      const updated = [...get().coins, next];
      set({ coins: updated });
      try {
        await AsyncStorage.setItem(CUSTOM_COINS_STORAGE_KEY, JSON.stringify(updated));
      } catch (_error) { /* intentionally ignored */ }
    },

    remove: async (id) => {
      const updated = get().coins.filter((coin) => coin.id !== id);
      set({ coins: updated });
      try {
        await AsyncStorage.setItem(CUSTOM_COINS_STORAGE_KEY, JSON.stringify(updated));
      } catch (_error) { /* intentionally ignored */ }
    },

    clearAll: async () => {
      set({ coins: [] });
      try {
        await AsyncStorage.setItem(CUSTOM_COINS_STORAGE_KEY, JSON.stringify([]));
      } catch (_error) { /* intentionally ignored */ }
    },
  };
}
