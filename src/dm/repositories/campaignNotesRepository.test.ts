import { beforeEach, describe, expect, it, vi } from 'vitest';

const { storage, asyncStorageMock } = vi.hoisted(() => {
  const storage = new Map<string, string>();
  return {
    storage,
    asyncStorageMock: {
      getItem: vi.fn(async (key: string) => (storage.has(key) ? storage.get(key)! : null)),
      setItem: vi.fn(async (key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn(async (key: string) => {
        storage.delete(key);
      }),
    },
  };
});

const { ensureCampaignForNameMock } = vi.hoisted(() => ({
  ensureCampaignForNameMock: vi.fn(async () => ({
    id: 'campaign-base',
    name: 'Base',
    nameNormalized: 'base',
    ownerUid: 'local',
    owners: [],
    editors: [],
    createdAtMs: 1,
    updatedAtMs: 1,
  })),
}));

const { firebaseMock } = vi.hoisted(() => ({
  firebaseMock: {
    fbAuth: { currentUser: null as null | { uid: string } },
    db: {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(),
          set: vi.fn(),
          delete: vi.fn(),
        })),
        where: vi.fn(() => ({
          onSnapshot: vi.fn(),
        })),
      })),
    },
    hasDoc: vi.fn(() => false),
    now: vi.fn(() => ({ seconds: 0 })),
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorageMock }));
vi.mock('@/services/firebase', () => firebaseMock);
vi.mock('@/dm/repositories/campaignRepository', async () => {
  const actual = await vi.importActual<typeof import('@/dm/repositories/campaignRepository')>('@/dm/repositories/campaignRepository');
  return {
    ...actual,
    ensureCampaignForName: ensureCampaignForNameMock,
  };
});

import { loadLocalCampaignNotes } from '@/dm/repositories/campaignNotesRepository';
import { LATEST_SCHEMA_VERSION } from '@/domain/migrations';

describe('dm/repositories/campaignNotesRepository', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it('migrates legacy DM_NOTES_V2 into versioned notes storage', async () => {
    storage.set(
      'DM_NOTES_V2',
      JSON.stringify([{ id: 'old-1', title: 'Legacy title', content: 'Legacy body', campaign: 'Base', lastEdited: 100 }]),
    );

    const notes = await loadLocalCampaignNotes();

    expect(notes).toHaveLength(1);
    expect(notes[0].id).toBe('legacy-old-1');
    expect(notes[0].campaignId).toBe('campaign-base');
    expect(notes[0].schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(storage.has('DM_NOTES_V2')).toBe(false);
    expect(storage.get('DM_NOTES_V2_MIGRATED_TO_CAMPAIGN_V1')).toBe('1');

    const stored = JSON.parse(storage.get('DM_CAMPAIGN_NOTES_V1') || '{}');
    expect(stored.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(Array.isArray(stored.data)).toBe(true);
    expect(stored.data[0].schemaVersion).toBe(LATEST_SCHEMA_VERSION);
  });
});
