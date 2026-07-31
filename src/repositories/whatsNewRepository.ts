import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mythgate.whatsNew.lastSeenVersion';

export async function getLastSeenWhatsNewVersion(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function setLastSeenWhatsNewVersion(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, version);
  } catch (_error) {
    /* intentionally ignored */
  }
}
