import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStorageEnvelope, normalizeStorageEnvelope } from '@/domain/migrations';

const DEFAULT_CAMPAIGN_STORAGE_KEY = 'DM_DEFAULT_CAMPAIGN_ID_V1';

function parseStoredValue(raw: string | null): unknown {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function loadDefaultCampaignId(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(DEFAULT_CAMPAIGN_STORAGE_KEY);
  const parsed = parseStoredValue(raw);
  const migrated = normalizeStorageEnvelope<string | null>('dmDefaultCampaign', parsed, null);
  return typeof migrated.data === 'string' && migrated.data ? migrated.data : null;
}

export async function persistDefaultCampaignId(campaignId: string | null): Promise<void> {
  await AsyncStorage.setItem(DEFAULT_CAMPAIGN_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmDefaultCampaign', campaignId)));
}
