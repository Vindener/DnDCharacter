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

import {
  deleteCampaignEncounter,
  loadLocalCampaignEncounters,
  resolveCampaignEncounterConflict,
  upsertCampaignEncounter,
} from '@/dm/repositories/campaignEncountersRepository';
import { LATEST_SCHEMA_VERSION } from '@/domain/migrations';
import type { DMCampaignEncounter } from '@/dm/domain/types';

function buildEncounter(overrides: Partial<DMCampaignEncounter> = {}): DMCampaignEncounter {
  return {
    id: 'encounter-1',
    campaignId: 'campaign-1',
    label: 'Ambush at the bridge',
    players: [],
    monsters: [],
    difficulty: null,
    status: 'planned',
    ownerUid: 'local',
    owners: ['local'],
    editors: [],
    createdAtMs: 1,
    updatedAtMs: 1,
    baseUpdatedAtMs: 1,
    syncStatus: 'Local only',
    ...overrides,
  };
}

describe('dm/repositories/campaignEncountersRepository', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
    firebaseMock.fbAuth.currentUser = null;
  });

  it('upserts an encounter locally when offline and marks it Local only', async () => {
    const saved = await upsertCampaignEncounter(buildEncounter());

    expect(saved.syncStatus).toBe('Local only');

    const stored = JSON.parse(storage.get('DM_CAMPAIGN_ENCOUNTERS_V1') || '{}');
    expect(stored.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(Array.isArray(stored.data)).toBe(true);
    expect(stored.data[0].id).toBe('encounter-1');
    expect(stored.data[0].schemaVersion).toBe(LATEST_SCHEMA_VERSION);
  });

  it('persists an upserted encounter across reload', async () => {
    await upsertCampaignEncounter(buildEncounter({ label: 'Goblin ambush' }));

    const loaded = await loadLocalCampaignEncounters();

    expect(loaded).toHaveLength(1);
    expect(loaded[0].label).toBe('Goblin ambush');
    expect(loaded[0].campaignId).toBe('campaign-1');
  });

  it('drops stored records missing id or campaignId', async () => {
    storage.set(
      'DM_CAMPAIGN_ENCOUNTERS_V1',
      JSON.stringify({
        schemaVersion: LATEST_SCHEMA_VERSION,
        data: [{ label: 'No id or campaign' }],
      }),
    );

    const loaded = await loadLocalCampaignEncounters();

    expect(loaded).toHaveLength(0);
  });

  it('clamps label to 200 chars and players/monsters to 30 items', async () => {
    const longLabel = 'x'.repeat(300);
    const manyPlayers = Array.from({ length: 40 }, (_, index) => ({
      id: `player-${index}`,
      characterId: `character-${index}`,
      name: `Player ${index}`,
      level: 1,
      initiativeMod: 0,
      selected: true,
    }));
    const manyMonsters = Array.from({ length: 40 }, (_, index) => ({
      id: `monster-${index}`,
      name: `Monster ${index}`,
      challenge: '1',
      count: 1,
      selected: true,
    }));

    storage.set(
      'DM_CAMPAIGN_ENCOUNTERS_V1',
      JSON.stringify({
        schemaVersion: LATEST_SCHEMA_VERSION,
        data: [
          buildEncounter({
            label: longLabel,
            players: manyPlayers as unknown as DMCampaignEncounter['players'],
            monsters: manyMonsters as unknown as DMCampaignEncounter['monsters'],
          }),
        ],
      }),
    );

    const loaded = await loadLocalCampaignEncounters();

    expect(loaded).toHaveLength(1);
    expect(loaded[0].label).toHaveLength(200);
    expect(loaded[0].players).toHaveLength(30);
    expect(loaded[0].monsters).toHaveLength(30);
  });

  it('deletes an encounter from the local cache', async () => {
    await upsertCampaignEncounter(buildEncounter());
    await deleteCampaignEncounter('encounter-1', 'campaign-1');

    const loaded = await loadLocalCampaignEncounters();
    expect(loaded).toHaveLength(0);
  });

  describe('conflict resolution', () => {
    function seedConflictedEncounter(): void {
      storage.set(
        'DM_CAMPAIGN_ENCOUNTERS_V1',
        JSON.stringify({
          schemaVersion: LATEST_SCHEMA_VERSION,
          data: [
            buildEncounter({
              label: 'Local version',
              syncStatus: 'Conflict detected',
              baseUpdatedAtMs: 10,
              updatedAtMs: 20,
              conflictRemote: {
                label: 'Remote version',
                players: [],
                monsters: [],
                updatedAtMs: 30,
              },
            }),
          ],
        }),
      );
    }

    it('keep-cloud replaces local content with the remote version', async () => {
      seedConflictedEncounter();

      const resolved = await resolveCampaignEncounterConflict('encounter-1', 'keep-cloud');

      expect(resolved?.label).toBe('Remote version');
      expect(resolved?.syncStatus).toBe('Local only');
      expect(resolved?.conflictRemote).toBeUndefined();
    });

    it('keep-local keeps local content and clears the conflict flag', async () => {
      seedConflictedEncounter();

      const resolved = await resolveCampaignEncounterConflict('encounter-1', 'keep-local');

      expect(resolved?.label).toBe('Local version');
      expect(resolved?.syncStatus).toBe('Local only');
      expect(resolved?.conflictRemote).toBeUndefined();
    });

    it('keep-both forks the local copy and keeps the remote version under the original id', async () => {
      seedConflictedEncounter();

      const forked = await resolveCampaignEncounterConflict('encounter-1', 'keep-both');
      expect(forked?.label).toBe('Local version');
      expect(forked?.id).not.toBe('encounter-1');

      const loaded = await loadLocalCampaignEncounters();
      expect(loaded).toHaveLength(2);

      const original = loaded.find((item) => item.id === 'encounter-1');
      const fork = loaded.find((item) => item.id !== 'encounter-1');

      expect(original?.label).toBe('Remote version');
      expect(original?.syncStatus).toBe('Synced');
      expect(fork?.label).toBe('Local version');
      expect(fork?.conflictRemote).toBeUndefined();
    });
  });
});
