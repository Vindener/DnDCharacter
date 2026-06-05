import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MonsterDto } from '@/types/Monster';
import { createStorageEnvelope, normalizeStorageEnvelope } from '@/domain/migrations';

const MONSTERS_STORAGE_KEY = 'monsters';
const PINS_STORAGE_KEY = 'monster-pins';
const FAVORITES_STORAGE_KEY = 'monster-favorites';

function parseStoredValue(raw: string | null): unknown {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function loadMonstersState(): Promise<{ monsters: MonsterDto[]; pinnedMonsterIds: string[]; favoriteMonsterIds: string[] }> {
  const jsonValue = await AsyncStorage.getItem(MONSTERS_STORAGE_KEY);
  const monstersParsed = parseStoredValue(jsonValue);
  const monstersMigrated = normalizeStorageEnvelope<unknown[]>('dmMonsters', monstersParsed, []);
  const monsters = Array.isArray(monstersMigrated.data) ? (monstersMigrated.data.filter(Boolean) as MonsterDto[]) : [];

  const rawPins = await AsyncStorage.getItem(PINS_STORAGE_KEY);
  const pinsParsed = parseStoredValue(rawPins);
  const pinsMigrated = normalizeStorageEnvelope<string[]>('dmPins', pinsParsed, []);
  const validPins = Array.isArray(pinsMigrated.data) ? pinsMigrated.data.filter(Boolean) : [];
  const pinnedMonsterIds = validPins.filter((id) => monsters.some((monster) => monster.id === id));

  const rawFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
  const favoritesParsed = parseStoredValue(rawFavorites);
  const favoritesMigrated = normalizeStorageEnvelope<string[]>('dmMonsterFavorites', favoritesParsed, []);
  const validFavorites = Array.isArray(favoritesMigrated.data) ? favoritesMigrated.data.filter(Boolean) : [];
  const favoriteMonsterIds = validFavorites.filter((id) => monsters.some((monster) => monster.id === id));

  return {
    monsters,
    pinnedMonsterIds,
    favoriteMonsterIds,
  };
}

export async function persistMonstersState(monsters: MonsterDto[], pinnedMonsterIds: string[], favoriteMonsterIds: string[] = []): Promise<void> {
  const validPins = pinnedMonsterIds.filter((id) => monsters.some((monster) => monster.id === id));
  const validFavorites = favoriteMonsterIds.filter((id) => monsters.some((monster) => monster.id === id));
  await AsyncStorage.setItem(MONSTERS_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmMonsters', monsters)));
  await AsyncStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmPins', validPins)));
  await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmMonsterFavorites', validFavorites)));
}

export async function persistPinnedMonsterIds(pinnedMonsterIds: string[]): Promise<void> {
  await AsyncStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmPins', pinnedMonsterIds)));
}

export async function persistFavoriteMonsterIds(favoriteMonsterIds: string[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmMonsterFavorites', favoriteMonsterIds)));
}
