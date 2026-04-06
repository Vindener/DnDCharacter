import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppRole } from '@/types/Product';
import { createStorageEnvelope, normalizeStorageEnvelope } from '@/domain/migrations';

const ROLE_STORAGE_KEY = 'APP_ROLE_MODE_V1';

function parseStoredValue(raw: string | null): unknown {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function normalizeRole(raw: unknown): AppRole {
  if (raw === 'Player' || raw === 'DM' || raw === 'Hybrid') return raw;
  return 'Hybrid';
}

export async function loadAppRole(): Promise<AppRole> {
  const raw = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
  const parsed = parseStoredValue(raw);
  const migrated = normalizeStorageEnvelope<string>('appRole', parsed, 'Hybrid');
  return normalizeRole(migrated.data);
}

export async function persistAppRole(role: AppRole): Promise<void> {
  await AsyncStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(createStorageEnvelope('appRole', role)));
}
