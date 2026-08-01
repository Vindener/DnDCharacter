import { beforeEach, describe, expect, it, vi } from 'vitest';

const { asyncStorageMock } = vi.hoisted(() => ({
  asyncStorageMock: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const { txMock } = vi.hoisted(() => ({
  txMock: {
    get: vi.fn(async () => ({ exists: true, data: () => ({ owners: ['dm-1'], editors: [] }) })),
    update: vi.fn(async (_ref: unknown, _patch: Record<string, unknown>) => {}),
  },
}));

const { firebaseMock, findUserByEmailMock, ensureConnectionMock } = vi.hoisted(() => ({
  firebaseMock: {
    fbAuth: { currentUser: null as null | { uid: string } },
    db: {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({ set: vi.fn(), get: vi.fn(), update: vi.fn(), delete: vi.fn() })),
        where: vi.fn(() => ({ onSnapshot: vi.fn() })),
      })),
      runTransaction: vi.fn(async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock)),
    },
    now: vi.fn(() => ({ seconds: 0 })),
    hasDoc: (snap: { exists?: boolean } | null | undefined) => Boolean(snap?.exists),
  },
  findUserByEmailMock: vi.fn(async (): Promise<string | null> => null),
  ensureConnectionMock: vi.fn(async () => {}),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorageMock,
}));

vi.mock('@/services/firebase', () => firebaseMock);

vi.mock('@/services/users', () => ({
  findUserByEmail: findUserByEmailMock,
}));

vi.mock('@/services/connections', () => ({
  ensureConnection: ensureConnectionMock,
}));

import {
  addCampaignEditorByEmail,
  deleteCampaign,
  loadLocalCampaigns,
  renameCampaign,
  subscribeAccessibleCampaigns,
  togglePinnedMonsterForCampaign,
  togglePinnedSpellForCampaign,
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

  it('togglePinnedMonsterForCampaign adds then removes a monster id without touching pinnedSpellIds', async () => {
    mockStoredCampaigns([
      {
        id: 'campaign-eta',
        name: 'Eta',
        nameNormalized: 'eta',
        ownerUid: 'u-7',
        owners: ['u-7'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 2,
        pinnedSpellIds: ['spell-1'],
      },
    ]);

    const added = await togglePinnedMonsterForCampaign('campaign-eta', 'goblin');
    expect(added?.pinnedMonsterIds).toEqual(['goblin']);
    expect(added?.pinnedSpellIds).toEqual(['spell-1']);

    mockStoredCampaigns([
      {
        id: 'campaign-eta',
        name: 'Eta',
        nameNormalized: 'eta',
        ownerUid: 'u-7',
        owners: ['u-7'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 2,
        pinnedMonsterIds: ['goblin'],
        pinnedSpellIds: ['spell-1'],
      },
    ]);

    const removed = await togglePinnedMonsterForCampaign('campaign-eta', 'goblin');
    expect(removed?.pinnedMonsterIds).toEqual([]);
  });

  it('togglePinnedSpellForCampaign caps the pinned list at 20 unique ids', async () => {
    const existingIds = Array.from({ length: 20 }, (_, index) => `spell-${index}`);
    mockStoredCampaigns([
      {
        id: 'campaign-theta',
        name: 'Theta',
        nameNormalized: 'theta',
        ownerUid: 'u-8',
        owners: ['u-8'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 2,
        pinnedSpellIds: existingIds,
      },
    ]);

    const result = await togglePinnedSpellForCampaign('campaign-theta', 'spell-new');

    expect(result?.pinnedSpellIds).toHaveLength(20);
    expect(result?.pinnedSpellIds).toContain('spell-new');
    expect(result?.pinnedSpellIds).not.toContain('spell-0');
  });

  it('togglePinnedMonsterForCampaign returns null for an unknown campaign id', async () => {
    mockStoredCampaigns([]);

    const result = await togglePinnedMonsterForCampaign('missing-campaign', 'goblin');

    expect(result).toBeNull();
  });

  it("a Cyrillic campaign name survives a persist/load round-trip (regression: normalizeCampaignName stripped it to '' and sanitizeCampaign dropped the whole record)", async () => {
    asyncStorageMock.getItem.mockResolvedValueOnce(null);

    await upsertCampaign({
      id: 'campaign-cyrillic',
      name: 'Ллала',
      nameNormalized: 'ллала',
      ownerUid: 'u-10',
      owners: ['u-10'],
      editors: [],
      createdAtMs: 1,
      updatedAtMs: 2,
    });

    const setItemCalls = asyncStorageMock.setItem.mock.calls;
    const rawEnvelope = setItemCalls[setItemCalls.length - 1][1];
    asyncStorageMock.getItem.mockResolvedValueOnce(rawEnvelope);

    const reloaded = await loadLocalCampaigns();
    expect(reloaded.map((campaign) => campaign.id)).toContain('campaign-cyrillic');
    expect(reloaded.find((campaign) => campaign.id === 'campaign-cyrillic')?.name).toBe('Ллала');
  });

  it('subscribeAccessibleCampaigns (not signed in) re-emits after a local mutation (regression: list stayed empty after creating a campaign)', async () => {
    let stored: string | null = null;
    asyncStorageMock.getItem.mockImplementation(async () => stored);
    asyncStorageMock.setItem.mockImplementation(async (_key: string, value: string) => {
      stored = value;
    });

    const emissions: Array<{ id: string }[]> = [];
    const unsubscribe = await subscribeAccessibleCampaigns((campaigns) => {
      emissions.push(campaigns);
    });

    expect(emissions).toHaveLength(1);
    expect(emissions[0]).toEqual([]);

    await upsertCampaign({
      id: 'campaign-iota',
      name: 'Iota',
      nameNormalized: 'iota',
      ownerUid: 'u-9',
      owners: ['u-9'],
      editors: [],
      createdAtMs: 1,
      updatedAtMs: 2,
    });

    expect(emissions.length).toBeGreaterThanOrEqual(2);
    expect(emissions[emissions.length - 1].map((c) => c.id)).toContain('campaign-iota');

    unsubscribe();
  });

  describe('addCampaignEditorByEmail', () => {
    it('the campaign owner adds an editor by email directly (no Cloud Function needed)', async () => {
      firebaseMock.fbAuth.currentUser = { uid: 'dm-1' };
      findUserByEmailMock.mockResolvedValueOnce('editor-uid');
      txMock.get.mockResolvedValueOnce({ exists: true, data: () => ({ owners: ['dm-1'], editors: [] }) });

      const result = await addCampaignEditorByEmail('campaign-1', 'friend@example.com');

      expect(result).toBe('editor-uid');
      expect(txMock.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ editors: ['editor-uid'] }));
      expect(ensureConnectionMock).toHaveBeenCalledWith('editor-uid');
    });

    it('rejects when there is no account for that email', async () => {
      firebaseMock.fbAuth.currentUser = { uid: 'dm-1' };
      findUserByEmailMock.mockResolvedValueOnce(null);

      await expect(addCampaignEditorByEmail('campaign-1', 'nobody@example.com')).rejects.toThrow('User not found by email');
      expect(txMock.update).not.toHaveBeenCalled();
    });

    it('rejects when the caller is not the campaign owner', async () => {
      firebaseMock.fbAuth.currentUser = { uid: 'intruder' };
      findUserByEmailMock.mockResolvedValueOnce('editor-uid');
      txMock.get.mockResolvedValueOnce({ exists: true, data: () => ({ owners: ['dm-1'], editors: [] }) });

      await expect(addCampaignEditorByEmail('campaign-1', 'friend@example.com')).rejects.toThrow(
        'Only the campaign owner can add an editor',
      );
      expect(txMock.update).not.toHaveBeenCalled();
    });

    it('rejects when not signed in', async () => {
      firebaseMock.fbAuth.currentUser = null;

      await expect(addCampaignEditorByEmail('campaign-1', 'friend@example.com')).rejects.toThrow('Not signed in');
      expect(findUserByEmailMock).not.toHaveBeenCalled();
    });
  });
});
