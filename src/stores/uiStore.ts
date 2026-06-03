import { create } from 'zustand';
import { DarkTheme, type Theme } from '@react-navigation/native';
import type { ThemeColors } from '@/shared/styles/theme';
import { darkColors } from '@/shared/styles/theme';
import type { CustomCoin } from '@/types/CustomCoin';
import { createUiStoreEffects } from '@/services/storeEffects/uiStoreEffects';

export interface UiStore {
  isDark: boolean;
  theme: Theme;
  colors: ThemeColors;
  coins: CustomCoin[];
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
  load: () => Promise<void>;
  add: (data: Omit<CustomCoin, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const useUiStore = create<UiStore>((set, get) => {
  const effects = createUiStoreEffects({ set, get });

  return {
    isDark: true,
    theme: DarkTheme,
    colors: darkColors,
    coins: [],
    toggleTheme: effects.toggleTheme,
    loadTheme: effects.loadTheme,
    load: effects.load,
    add: effects.add,
    remove: effects.remove,
    clearAll: effects.clearAll,
  };
});

export default useUiStore;
