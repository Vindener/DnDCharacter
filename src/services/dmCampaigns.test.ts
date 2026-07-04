import { beforeEach, describe, expect, it, vi } from 'vitest';

const { asyncStorageMock } = vi.hoisted(() => ({
  asyncStorageMock: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const { firebaseMock } = vi.hoisted(() => ({
  firebaseMock: {
    fbAuth: { currentUser: null as null | { uid: string } },
    db: {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() })),
        where: vi.fn(() => ({ onSnapshot: vi.fn() })),
      })),
    },
    now: vi.fn(() => ({ seconds: 0 })),
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorageMock,
}));

vi.mock('@/services/firebase', () => firebaseMock);

import { loadLocalCampaigns, upsertCampaign } from '@/services/dmCampaigns';
import { LATEST_SCHEMA_VERSION } from '@/domain/migrations';

beforeEach(() => {
  vi.clearAllMocks();
  firebaseMock.fbAuth.currentUser = null;
});

describe('dmCampaigns migration pipeline', () => {
  it('loads legacy campaigns payload and migrates to schema v3 at runtime', async () => {
    asyncStorageMock.getItem.mockResolvedValueOnce(JSON.stringify([
      {
        id: 'campaign-1',
        name: 'Alpha',
        nameNormalized: 'alpha',
        ownerUid: 'u-1',
        owners: ['u-1'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 2,
      },
    ]));

    const campaigns = await loadLocalCampaigns();

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].id).toBe('campaign-1');
    expect(campaigns[0].schemaVersion).toBe(LATEST_SCHEMA_VERSION);
  });

  it('writes campaigns in schema-versioned envelope on upsert', async () => {
    asyncStorageMock.getItem.mockResolvedValueOnce(null);

    await upsertCampaign({
      id: 'campaign-2',
      name: 'Beta',
      nameNormalized: 'beta',
      ownerUid: 'u-2',
      owners: ['u-2'],
      editors: [],
      createdAtMs: 10,
      updatedAtMs: 20,
    });

    expect(asyncStorageMock.setItem).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(asyncStorageMock.setItem.mock.calls[0][1]);
    expect(payload.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(Array.isArray(payload.data)).toBe(true);
    expect(payload.data[0].schemaVersion).toBe(LATEST_SCHEMA_VERSION);
  });
});
