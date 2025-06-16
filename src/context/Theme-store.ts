import { create } from 'zustand';
import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDark: boolean;
  theme: Theme;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
}

const STORAGE_KEY = 'APP_THEME';

const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true,
  theme: DarkTheme,

  toggleTheme: async () => {
    const current = get().isDark;
    const newIsDark = !current;
    const newTheme = newIsDark ? DarkTheme : DefaultTheme;
    set({ isDark: newIsDark, theme: newTheme });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ isDark: newIsDark }));
    } catch {}
  },

  loadTheme: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      if (value) {
        const parsed = JSON.parse(value);
        const isDark = !!parsed.isDark;
        set({ isDark, theme: isDark ? DarkTheme : DefaultTheme });
      }
    } catch {}
  },
}));

export default useThemeStore;
