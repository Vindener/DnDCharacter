import AsyncStorage from '@react-native-async-storage/async-storage';

export const LANGUAGE_STORAGE_KEY = 'mythgate.language';

export type AppLanguage = 'uk' | 'en';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['uk', 'en'];

export function isSupportedLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'uk' || value === 'en';
}

export async function getSavedLanguage(): Promise<AppLanguage | null> {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (isSupportedLanguage(savedLanguage)) {
    return savedLanguage;
  }

  return null;
}

export async function saveLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}
