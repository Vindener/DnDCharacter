import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MonsterDto } from '@/types/Monster';
import { createStorageEnvelope, normalizeStorageEnvelope } from '@/domain/migrations';
import { getSrdMonsters } from '@/domain/srd/srdRepository';
import { srdMonsterToMonsterDto } from '@/domain/srd/adapters';

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

function isSrdMonster(monster: Pick<MonsterDto, 'source'>): boolean {
  return monster.source === 'srd-5.1';
}

function normalizeCustomMonster(monster: MonsterDto): MonsterDto {
  if (isSrdMonster(monster)) return monster;
  return {
    ...monster,
    source: monster.source || 'user-custom',
    license: monster.license || 'custom',
    isCustom: monster.isCustom ?? true,
  };
}

function getSrdMonsterSeed(): MonsterDto[] {
  return getSrdMonsters().map(srdMonsterToMonsterDto);
}

function mergeMonstersWithSrd(stored: MonsterDto[]): MonsterDto[] {
  const srdMonsters = getSrdMonsterSeed();
  const srdNames = new Set(srdMonsters.map((monster) => monster.name.trim().toLowerCase()));
  const custom = stored
    .filter((monster) => !isSrdMonster(monster))
    .map(normalizeCustomMonster)
    .filter((monster) => monster.id && monster.name);
  const customIds = new Set(custom.map((monster) => monster.id));
  const mergedSrd = srdMonsters.filter((monster) => !customIds.has(monster.id));
  const extras = custom.filter((monster) => !srdNames.has(monster.name.trim().toLowerCase()) || monster.isCustom);
  return [...extras, ...mergedSrd];
}

function persistableMonsters(monsters: MonsterDto[]): MonsterDto[] {
  return monsters.filter((monster) => !isSrdMonster(monster));
}

export async function loadMonstersState(): Promise<{ monsters: MonsterDto[]; pinnedMonsterIds: string[]; favoriteMonsterIds: string[] }> {
  const jsonValue = await AsyncStorage.getItem(MONSTERS_STORAGE_KEY);
  const monstersParsed = parseStoredValue(jsonValue);
  const monstersMigrated = normalizeStorageEnvelope<unknown[]>('dmMonsters', monstersParsed, []);
  const storedMonsters = Array.isArray(monstersMigrated.data) ? (monstersMigrated.data.filter(Boolean) as MonsterDto[]) : [];
  const monsters = mergeMonstersWithSrd(storedMonsters);

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

export async function persistMonstersState(
  monsters: MonsterDto[],
  pinnedMonsterIds: string[],
  favoriteMonsterIds: string[] = [],
): Promise<{ monsters: MonsterDto[]; pinnedMonsterIds: string[]; favoriteMonsterIds: string[] }> {
  const merged = mergeMonstersWithSrd(monsters);
  const validPins = pinnedMonsterIds.filter((id) => merged.some((monster) => monster.id === id));
  const validFavorites = favoriteMonsterIds.filter((id) => merged.some((monster) => monster.id === id));
  await AsyncStorage.setItem(MONSTERS_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmMonsters', persistableMonsters(merged))));
  await AsyncStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmPins', validPins)));
  await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmMonsterFavorites', validFavorites)));
  return { monsters: merged, pinnedMonsterIds: validPins, favoriteMonsterIds: validFavorites };
}

export async function persistPinnedMonsterIds(pinnedMonsterIds: string[]): Promise<void> {
  await AsyncStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmPins', pinnedMonsterIds)));
}

export async function persistFavoriteMonsterIds(favoriteMonsterIds: string[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmMonsterFavorites', favoriteMonsterIds)));
}
