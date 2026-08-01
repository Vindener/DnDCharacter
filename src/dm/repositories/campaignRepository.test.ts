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
        doc: vi.fn(() => ({ set: vi.fn(), get: vi.fn(), update: vi.fn(), delete: vi.fn() })),
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

import {
  deleteCampaign,
  loadLocalCampaigns,
  renameCampaign,
  updateCampaignSummary,
  upsertCampaign,
} from '@/dm/repositories/campaignRepository';
import { LATEST_SCHEMA_VERSION } from '@/domain/migrations';

function mockStoredCampaigns(campaigns: unknown[]): void {
  asyncStorageMock.getItem.mockResolvedValueOnce(JSON.stringify(campaigns));
}

function lastPersistedCampaigns(): Array<Record<string, unknown>> {
  const calls = asyncStorageMock.setItem.mock.calls;
  const payload = JSON.parse(calls[calls.length - 1][1]);
  return payload.data;
}

describe('dm/repositories/campaignRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebaseMock.fbAuth.currentUser = null;
  });

  it('loads legacy campaigns payload and migrates to schema v3 at runtime', async () => {
    asyncStorageMock.getItem.mockResolvedValueOnce(
      JSON.stringify([
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
      ]),
    );

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

  it('renameCampaign updates name/nameNormalized and keeps id unchanged', async () => {
    mockStoredCampaigns([
      {
        id: 'campaign-gamma',
        name: 'Gamma',
        nameNormalized: 'gamma',
        ownerUid: 'u-3',
        owners: ['u-3'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 2,
      },
    ]);

    const result = await renameCampaign('campaign-gamma', 'Gamma Rising');

    expect(result?.id).toBe('campaign-gamma');
    expect(result?.name).toBe('Gamma Rising');
    expect(result?.nameNormalized).toBe('gamma rising');

    const persisted = lastPersistedCampaigns();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].id).toBe('campaign-gamma');
    expect(persisted[0].name).toBe('Gamma Rising');
  });

  it('renameCampaign returns null for an unknown campaign id', async () => {
    mockStoredCampaigns([]);

    const result = await renameCampaign('missing-campaign', 'New Name');

    expect(result).toBeNull();
  });

  it('deleteCampaign removes the campaign from the local list', async () => {
    mockStoredCampaigns([
      {
        id: 'campaign-delta',
        name: 'Delta',
        nameNormalized: 'delta',
        ownerUid: 'u-4',
        owners: ['u-4'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 2,
      },
    ]);

    await deleteCampaign('campaign-delta');

    const persisted = lastPersistedCampaigns();
    expect(persisted.find((campaign) => campaign.id === 'campaign-delta')).toBeUndefined();
  });

  it('updateCampaignSummary truncates an over-long summary instead of throwing', async () => {
    mockStoredCampaigns([
      {
        id: 'campaign-epsilon',
        name: 'Epsilon',
        nameNormalized: 'epsilon',
        ownerUid: 'u-5',
        owners: ['u-5'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 2,
      },
    ]);

    const longSummary = 'x'.repeat(600);
    const result = await updateCampaignSummary('campaign-epsilon', { summary: longSummary });

    expect(result?.summary).toHaveLength(500);
  });

  it('updateCampaignSummary clamps partyLevelEstimate into the 1-20 range without throwing', async () => {
    mockStoredCampaigns([
      {
        id: 'campaign-zeta',
        name: 'Zeta',
        nameNormalized: 'zeta',
        ownerUid: 'u-6',
        owners: ['u-6'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 2,
      },
    ]);
    const tooHigh = await updateCampaignSummary('campaign-zeta', { partyLevelEstimate: 99 });
    expect(tooHigh?.partyLevelEstimate).toBe(20);

    mockStoredCampaigns([
      {
        id: 'campaign-zeta',
        name: 'Zeta',
        nameNormalized: 'zeta',
        ownerUid: 'u-6',
        owners: ['u-6'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 2,
      },
    ]);
    const tooLow = await updateCampaignSummary('campaign-zeta', { partyLevelEstimate: -5 });
    expect(tooLow?.partyLevelEstimate).toBe(1);

    mockStoredCampaigns([
      {
        id: 'campaign-zeta',
        name: 'Zeta',
        nameNormalized: 'zeta',
        ownerUid: 'u-6',
        owners: ['u-6'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 2,
      },
    ]);
    const rejected = await updateCampaignSummary('campaign-zeta', { partyLevelEstimate: Number.NaN });
    expect(rejected?.partyLevelEstimate).toBeUndefined();
  });
});
