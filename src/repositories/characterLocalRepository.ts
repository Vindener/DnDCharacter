import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CharacterEntity } from '@/domain/types';
import { characterMapper } from '@/domain/mappers';
import {
  LATEST_SCHEMA_VERSION,
  createStorageEnvelope,
  normalizeStorageEnvelope,
} from '@/domain/migrations';

const CHARACTERS_STORAGE_KEY = 'characters';
const LAST_SESSION_CHARACTER_ID_KEY = 'lastSessionCharacterId';
const SHARED_UPDATES_REVIEWED_STORAGE_KEY = 'DM_SHARED_REVIEWED_V1';

export interface CharacterLocalRepository {
  loadCharacters: () => Promise<CharacterEntity[]>;
  saveCharacters: (characters: CharacterEntity[]) => Promise<void>;
  loadLastSessionCharacterId: () => Promise<string | null>;
  saveLastSessionCharacterId: (id: string) => Promise<void>;
  clearLastSessionCharacterId: () => Promise<void>;
  loadSharedUpdatesReviewedMap: () => Promise<Record<string, number>>;
  saveSharedUpdatesReviewedMap: (map: Record<string, number>) => Promise<void>;
}

async function loadCharacters(): Promise<CharacterEntity[]> {
  try {
    const raw = await AsyncStorage.getItem(CHARACTERS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const migrated = normalizeStorageEnvelope<CharacterEntity[]>('character', parsed, []);
    const list = Array.isArray(migrated.data) ? migrated.data : [];
    return list.filter(Boolean).map((entry) => characterMapper.draftToEntity(entry));
  } catch {
    return [];
  }
}

async function saveCharacters(characters: CharacterEntity[]): Promise<void> {
  try {
    const canonical = (Array.isArray(characters) ? characters : [])
      .filter(Boolean)
      .map((entry) => ({
        ...characterMapper.entityToDto(entry),
        schemaVersion: LATEST_SCHEMA_VERSION,
      }));
    const envelope = createStorageEnvelope('character', canonical);
    await AsyncStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(envelope));
  } catch (_error) { /* intentionally ignored */ }
}

async function loadLastSessionCharacterId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SESSION_CHARACTER_ID_KEY);
  } catch {
    return null;
  }
}

async function saveLastSessionCharacterId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SESSION_CHARACTER_ID_KEY, id);
  } catch (_error) { /* intentionally ignored */ }
}

async function clearLastSessionCharacterId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_SESSION_CHARACTER_ID_KEY);
  } catch (_error) { /* intentionally ignored */ }
}

async function loadSharedUpdatesReviewedMap(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(SHARED_UPDATES_REVIEWED_STORAGE_KEY);
    const parsed = JSON.parse(raw || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const out: Record<string, number> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([id, value]) => {
      const numeric = Number(value);
      if (!id || !Number.isFinite(numeric)) return;
      out[id] = numeric;
    });

    return out;
  } catch {
    return {};
  }
}

async function saveSharedUpdatesReviewedMap(map: Record<string, number>): Promise<void> {
  try {
    await AsyncStorage.setItem(SHARED_UPDATES_REVIEWED_STORAGE_KEY, JSON.stringify(map || {}));
  } catch (_error) { /* intentionally ignored */ }
}

export const characterLocalRepository: CharacterLocalRepository = {
  loadCharacters,
  saveCharacters,
  loadLastSessionCharacterId,
  saveLastSessionCharacterId,
  clearLastSessionCharacterId,
  loadSharedUpdatesReviewedMap,
  saveSharedUpdatesReviewedMap,
};
