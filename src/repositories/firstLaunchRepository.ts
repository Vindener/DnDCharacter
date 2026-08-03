import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mythgate.firstLaunch.introSeen';

export async function getHasSeenFirstLaunchIntro(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setHasSeenFirstLaunchIntro(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  } catch (_error) {
    /* intentionally ignored */
  }
}
