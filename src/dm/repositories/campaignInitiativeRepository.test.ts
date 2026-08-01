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

const { targetRef, firebaseMock } = vi.hoisted(() => {
  const targetRef = {
    set: vi.fn(async (_payload: Record<string, unknown>) => {}),
    delete: vi.fn(async () => {}),
    onSnapshot: vi.fn(),
  };
  return {
    targetRef,
    firebaseMock: {
      fbAuth: { currentUser: null as null | { uid: string } },
      db: {
        collection: vi.fn(() => ({
          doc: vi.fn(() => targetRef),
        })),
      },
      hasDoc: vi.fn(() => false),
      now: vi.fn(() => ({ seconds: 0 })),
    },
  };
});

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorageMock }));
vi.mock('@/services/firebase', () => firebaseMock);

import {
  endCampaignInitiative,
  loadLocalCampaignInitiative,
  startCampaignInitiative,
  updateCampaignInitiative,
} from '@/dm/repositories/campaignInitiativeRepository';
import { LATEST_SCHEMA_VERSION } from '@/domain/migrations';
import type { InitiativeCombatant } from '@/dm/domain/types';

function buildCombatants(): InitiativeCombatant[] {
  return [
    {
      id: 'player-1',
      name: 'Aragorn',
      source: 'player',
      roll: 18,
      initiativeMod: 3,
      hpCurrent: 30,
      conditions: [],
      defeated: false,
      order: 0,
    },
    {
      id: 'monster-1',
      name: 'Goblin',
      source: 'monster',
      roll: 12,
      initiativeMod: 2,
      hpCurrent: 7,
      conditions: [],
      defeated: false,
      order: 1,
    },
  ];
}

describe('dm/repositories/campaignInitiativeRepository', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
    firebaseMock.fbAuth.currentUser = null;
  });

  it('starts a tracker locally when offline and marks it Local only', async () => {
    const tracker = await startCampaignInitiative('campaign-1', buildCombatants());

    expect(tracker.syncStatus).toBe('Local only');
    expect(tracker.activeCombatantId).toBe('player-1');
    expect(tracker.round).toBe(1);

    const stored = JSON.parse(storage.get('DM_CAMPAIGN_INITIATIVE_V1') || '{}');
    expect(stored.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(stored.data[0].campaignId).toBe('campaign-1');
  });

  it('syncs to Firestore when signed in, via a full document overwrite', async () => {
    firebaseMock.fbAuth.currentUser = { uid: 'gm-1' };

    const tracker = await startCampaignInitiative('campaign-1', buildCombatants());

    expect(tracker.syncStatus).toBe('Synced');
    expect(targetRef.set).toHaveBeenCalledTimes(1);
    const [payload] = targetRef.set.mock.calls[0] as [Record<string, unknown>];
    expect(payload.campaignId).toBe('campaign-1');
    expect(payload.ownerUid).toBe('gm-1');
  });

  // Regression for a real bug: firestore.rules' isValidDmCampaignInitiativeWrite() requires
  // request.resource.data.keys().hasAll([...]) to include 'updatedAtMs' as an int — the cloud
  // payload was missing it entirely, so every create/update was silently rejected server-side
  // (caught as "Pending sync" with no error shown), which is why "next turn" appeared to do
  // nothing. This test asserts the exact key set the rules require is actually on the wire.
  it('cloud payload includes every field required by firestore.rules (id, campaignId, ownerUid, round, combatants, updatedAtMs)', async () => {
    firebaseMock.fbAuth.currentUser = { uid: 'gm-1' };

    await startCampaignInitiative('campaign-1', buildCombatants());

    const [payload] = targetRef.set.mock.calls[0] as [Record<string, unknown>];
    for (const key of ['id', 'campaignId', 'ownerUid', 'round', 'combatants', 'updatedAtMs']) {
      expect(payload).toHaveProperty(key);
    }
    expect(typeof payload.updatedAtMs).toBe('number');
  });

  // Regression for a real bug: a manually-typed monster (no monsterId) or one with no listed
  // hit points produces a combatant object with a literal `undefined` value for `monsterId`/
  // `hpMax` — Firestore's SDK rejects a `.set()` whose payload contains `undefined` ANYWHERE,
  // including nested inside an array, which silently broke every "start initiative" that
  // included such a combatant (caught as "Pending sync", tracker never actually created).
  it('strips undefined combatant fields (hpMax, monsterId) so the cloud payload is Firestore-safe', async () => {
    firebaseMock.fbAuth.currentUser = { uid: 'gm-1' };

    const combatants: InitiativeCombatant[] = [
      {
        id: 'monster-1',
        name: 'Homebrew Ooze',
        source: 'monster',
        monsterId: undefined,
        roll: 9,
        initiativeMod: 0,
        hpCurrent: 0,
        hpMax: undefined,
        conditions: [],
        defeated: false,
        order: 0,
      },
    ];

    await startCampaignInitiative('campaign-1', combatants);

    const [payload] = targetRef.set.mock.calls[0] as [Record<string, unknown>];
    const [combatant] = payload.combatants as Record<string, unknown>[];
    expect(combatant).not.toHaveProperty('monsterId');
    expect(combatant).not.toHaveProperty('hpMax');
  });

  it('starting a second tracker for the same campaign fully replaces the first', async () => {
    await startCampaignInitiative('campaign-1', buildCombatants());
    const secondRoster: InitiativeCombatant[] = [
      {
        id: 'player-2',
        name: 'Legolas',
        source: 'player',
        roll: 20,
        initiativeMod: 4,
        hpCurrent: 25,
        conditions: [],
        defeated: false,
        order: 0,
      },
    ];
    await startCampaignInitiative('campaign-1', secondRoster);

    const loaded = await loadLocalCampaignInitiative('campaign-1');
    expect(loaded?.combatants).toHaveLength(1);
    expect(loaded?.combatants[0].id).toBe('player-2');
  });

  it('updateCampaignInitiative patches round/combatants without re-rolling', async () => {
    await startCampaignInitiative('campaign-1', buildCombatants());

    const updated = await updateCampaignInitiative('campaign-1', { round: 2, activeCombatantId: 'monster-1' });

    expect(updated?.round).toBe(2);
    expect(updated?.activeCombatantId).toBe('monster-1');
    expect(updated?.combatants).toHaveLength(2);
  });

  it('updateCampaignInitiative returns null when no tracker exists for the campaign', async () => {
    const updated = await updateCampaignInitiative('no-such-campaign', { round: 2 });
    expect(updated).toBeNull();
  });

  it('drops stored records missing campaignId', async () => {
    storage.set('DM_CAMPAIGN_INITIATIVE_V1', JSON.stringify({ schemaVersion: LATEST_SCHEMA_VERSION, data: [{ id: 'no-campaign' }] }));

    const loaded = await loadLocalCampaignInitiative('campaign-1');
    expect(loaded).toBeNull();
  });

  it('endCampaignInitiative removes the local tracker and deletes the cloud doc when signed in', async () => {
    firebaseMock.fbAuth.currentUser = { uid: 'gm-1' };
    await startCampaignInitiative('campaign-1', buildCombatants());

    await endCampaignInitiative('campaign-1');

    expect(targetRef.delete).toHaveBeenCalledTimes(1);
    const loaded = await loadLocalCampaignInitiative('campaign-1');
    expect(loaded).toBeNull();
  });
});
