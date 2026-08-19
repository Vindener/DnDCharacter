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
  analyticsConsentEnabled: boolean;
  firebaseDebugToastsEnabled: boolean;
  forceShowSyncStrip: boolean;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
  load: () => Promise<void>;
  add: (data: Omit<CustomCoin, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  setAnalyticsConsent: (enabled: boolean) => Promise<void>;
  loadAnalyticsConsent: () => Promise<void>;
  setFirebaseDebugToastsEnabled: (enabled: boolean) => Promise<void>;
  loadFirebaseDebugToastsEnabled: () => Promise<void>;
  setForceShowSyncStrip: (enabled: boolean) => Promise<void>;
  loadForceShowSyncStrip: () => Promise<void>;
}

const useUiStore = create<UiStore>((set, get) => {
  const effects = createUiStoreEffects({ set, get });

  return {
    isDark: true,
    theme: DarkTheme,
    colors: darkColors,
    coins: [],
    analyticsConsentEnabled: false,
    firebaseDebugToastsEnabled: false,
    forceShowSyncStrip: false,
    toggleTheme: effects.toggleTheme,
    loadTheme: effects.loadTheme,
    load: effects.load,
    add: effects.add,
    remove: effects.remove,
    clearAll: effects.clearAll,
    setAnalyticsConsent: effects.setAnalyticsConsent,
    loadAnalyticsConsent: effects.loadAnalyticsConsent,
    setFirebaseDebugToastsEnabled: effects.setFirebaseDebugToastsEnabled,
    loadFirebaseDebugToastsEnabled: effects.loadFirebaseDebugToastsEnabled,
    setForceShowSyncStrip: effects.setForceShowSyncStrip,
    loadForceShowSyncStrip: effects.loadForceShowSyncStrip,
  };
});

export default useUiStore;
