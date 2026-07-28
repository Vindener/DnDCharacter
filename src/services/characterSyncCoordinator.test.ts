import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/repositories/characterCloudRepository', () => ({
  characterCloudRepository: {
    upsertFromLocal: vi.fn(),
    fetchById: vi.fn(),
  },
}));

vi.mock('@/shared/helpers/mapCloudCharacter', () => ({
  mapCloudCharacterToLocalDto: vi.fn((doc: Record<string, unknown>) => doc),
}));

vi.mock('@/services/firebase', () => ({
  timestampToMillis: (value: unknown) => {
    const candidate = value as { toMillis?: () => number } | null | undefined;
    return typeof candidate?.toMillis === 'function' ? candidate.toMillis() : undefined;
  },
}));

vi.mock('@/domain/mappers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/mappers')>();
  return {
    ...actual,
    characterMapper: {
      ...actual.characterMapper,
      entityToDto: vi.fn((character: unknown) => character),
    },
  };
});

import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import { characterCloudRepository } from '@/repositories/characterCloudRepository';
import type { CharacterChangeHistoryEntry, CharacterSheet } from '@/repositories/characterCloudRepository';
import {
  applySyncTransition,
  computeRemoteHistorySync,
  computeSeenEntryIdsFromRawHistory,
  normalizeSyncState,
  reconcileRemoteSnapshot,
  resolveConflict,
  syncToCloud,
  type ReconcileRemoteSnapshotResult,
} from '@/services/characterSyncCoordinator';
import type { CharacterSyncMap } from '@/types/Sync';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('characterSyncCoordinator helpers', () => {
  it('normalizes sync state and deduplicates path lists', () => {
    const state = normalizeSyncState('char-1', {
      hasCloud: true,
      localRevision: 2,
      cloudRevision: 1,
      pendingPaths: ['overview.identity', '', 'overview.identity'],
      conflictPaths: ['combat.hp.current', 'combat.hp.current'],
    });

    expect(state.characterId).toBe('char-1');
    expect(state.pendingPaths).toEqual(['overview.identity']);
    expect(state.conflictPaths).toEqual(['combat.hp.current']);
    expect(state.status).toBe('conflict');
  });

  it('applies ensure/pending/uploaded/downloaded/conflict/clear/remove transitions', () => {
    let map: CharacterSyncMap = {};

    map = applySyncTransition(map, { type: 'ensure', characterId: 'char-2', hasCloud: false }).map;
    expect(map['char-2'].status).toBe('local-only');

    map = applySyncTransition(map, {
      type: 'mark-local-draft-paths',
      characterId: 'char-2',
      changedPaths: ['overview.identity'],
      atMs: 1,
    }).map;
    expect(map['char-2'].pendingPaths).toEqual(['overview.identity']);
    expect(map['char-2'].status).toBe('local-only');

    map = applySyncTransition(map, { type: 'mark-cloud-uploaded', characterId: 'char-2', atMs: 2 }).map;
    expect(map['char-2'].pendingPaths).toEqual([]);
    expect(map['char-2'].status).toBe('in-sync');

    map = applySyncTransition(map, { type: 'mark-cloud-downloaded', characterId: 'char-2', atMs: 3 }).map;
    expect(map['char-2'].transportState).toBe('downloading');
    expect(map['char-2'].status).toBe('in-sync');

    map = applySyncTransition(map, {
      type: 'mark-conflict',
      characterId: 'char-2',
      conflictPaths: ['magic.spell-slots.1'],
      atMs: 4,
    }).map;
    expect(map['char-2'].status).toBe('conflict');

    map = applySyncTransition(map, { type: 'clear-conflicts', characterId: 'char-2' }).map;
    expect(map['char-2'].conflictPaths).toEqual([]);

    map = applySyncTransition(map, { type: 'remove-character', characterId: 'char-2' }).map;
    expect(map['char-2']).toBeUndefined();
  });

  it('reconciles remote snapshots for replace, merge, conflict and noop', () => {
    const local = createEmptyCharacter({
      id: 'char-3',
      name: 'Local',
      inventory: ['rope'],
      hp: { max: 10, current: 5, temp: 0 },
    });
    const remote = createEmptyCharacter({
      id: 'char-3',
      name: 'Remote',
      inventory: ['potion'],
      hp: { max: 12, current: 9, temp: 0 },
    });

    const replaceResult = reconcileRemoteSnapshot({
      localCharacter: local,
      remoteCharacter: remote,
      remotePathsSinceLastSync: ['overview.identity'],
      syncState: { ...normalizeSyncState('char-3', null), pendingPaths: [] },
    });
    expect(replaceResult.action).toBe('replace');

    const mergeResult = reconcileRemoteSnapshot({
      localCharacter: local,
      remoteCharacter: remote,
      remotePathsSinceLastSync: ['combat.hp.current'],
      syncState: { ...normalizeSyncState('char-3', null), pendingPaths: ['inventory.items'] },
    }) as ReconcileRemoteSnapshotResult;
    expect(mergeResult.action).toBe('merge');
    if (mergeResult.action === 'merge') {
      expect(mergeResult.character.inventory).toEqual(['rope']);
      expect(mergeResult.character.hp.current).toBe(9);
    }

    const conflictResult = reconcileRemoteSnapshot({
      localCharacter: local,
      remoteCharacter: remote,
      remotePathsSinceLastSync: ['inventory.items'],
      syncState: { ...normalizeSyncState('char-3', null), pendingPaths: ['inventory.items'] },
    });
    expect(conflictResult.action).toBe('conflict');
    if (conflictResult.action === 'conflict') {
      expect(conflictResult.conflictPaths).toContain('inventory.items');
    }

    const noopResult = reconcileRemoteSnapshot({
      localCharacter: local,
      remoteCharacter: remote,
      remotePathsSinceLastSync: [],
      syncState: { ...normalizeSyncState('char-3', null), pendingPaths: ['notes.journal'] },
    });
    expect(noopResult.action).toBe('noop');
  });

  it('keeps the original local character when cloud upsert fails', async () => {
    vi.mocked(characterCloudRepository.upsertFromLocal).mockRejectedValueOnce(new Error('permission denied'));
    const character = createEmptyCharacter({ id: 'char-sync-error', name: 'Local Only' });
    const syncPort = {
      ensureCharacterSync: vi.fn(async () => {}),
      setCloudAvailability: vi.fn(async () => {}),
      markCloudUploaded: vi.fn(async () => {}),
      setSyncTransport: vi.fn(async () => {}),
      markSyncError: vi.fn(async () => {}),
    };

    const result = await syncToCloud({
      character,
      actorRole: 'Player',
      syncPort,
      isOnline: true,
      fallbackPath: 'overview.identity',
    });

    expect(result.status).toBe('error');
    expect(result.targetCharacter.id).toBe('char-sync-error');
    expect(syncPort.markSyncError).toHaveBeenCalledWith('char-sync-error', 'permission denied');
    expect(syncPort.markCloudUploaded).not.toHaveBeenCalled();
    expect(syncPort.setCloudAvailability).not.toHaveBeenCalled();
  });
});

// COL-4: combat/homebrew sections were split into finer-grained sub-sections so unrelated
// concurrent edits (e.g. DM adjusting HP while a player sets a condition) stop colliding.
describe('mergeCharacterBySections (COL-4 granularity)', () => {
  it('fixes the sessionMode cross-tag bug: a pending overview.session-mode change survives an unrelated combat merge', () => {
    const local = createEmptyCharacter({ id: 'char-session', name: 'Local', sessionMode: true });
    const remote = createEmptyCharacter({ id: 'char-session', name: 'Local', sessionMode: false, hp: { max: 10, current: 3, temp: 0 } });

    const result = reconcileRemoteSnapshot({
      localCharacter: local,
      remoteCharacter: remote,
      remotePathsSinceLastSync: ['combat.hp.current'],
      syncState: { ...normalizeSyncState('char-session', null), pendingPaths: ['overview.session-mode'] },
    }) as ReconcileRemoteSnapshotResult;

    expect(result.action).toBe('merge');
    if (result.action === 'merge') {
      expect(result.character.sessionMode).toBe(true);
      expect(result.character.hp.current).toBe(3);
    }
  });

  it('fixes the conditions cross-surface bug: overview.conditions (player) vs combat.conditions (DM) now conflicts instead of silently overwriting', () => {
    const local = createEmptyCharacter({ id: 'char-conditions', name: 'Local', conditions: ['poisoned'] });
    const remote = createEmptyCharacter({ id: 'char-conditions', name: 'Local', conditions: ['prone'] });

    const result = reconcileRemoteSnapshot({
      localCharacter: local,
      remoteCharacter: remote,
      remotePathsSinceLastSync: ['combat.conditions.prone'],
      syncState: { ...normalizeSyncState('char-conditions', null), pendingPaths: ['overview.conditions'] },
    });

    expect(result.action).toBe('conflict');
  });

  it('merges independent combat sub-sections: local weapons pending survives, remote defense and homebrew sections are pulled in', () => {
    // combat.hp / homebrew.resources are deliberately avoided here — both are in
    // CRITICAL_PATH_PREFIXES, which independently forces a conflict across any two
    // sections whenever either side touches them (pre-existing, untouched behavior).
    // This test is about proving ordinary, non-critical sub-sections merge independently.
    const local = createEmptyCharacter({
      id: 'char-subsections',
      name: 'Local',
      ac: 12,
      weapons: [{ name: 'Local Dagger', attackBonus: 2, damage: '1d4' }],
    });
    const remote = createEmptyCharacter({
      id: 'char-subsections',
      name: 'Local',
      ac: 16,
      weapons: [{ name: 'Remote Sword', attackBonus: 3, damage: '1d8' }],
      customSections: [{ id: 'section-1', title: 'Remote Section', content: 'x' }],
    });

    const result = reconcileRemoteSnapshot({
      localCharacter: local,
      remoteCharacter: remote,
      remotePathsSinceLastSync: ['combat.core.ac', 'homebrew.sections.0'],
      syncState: { ...normalizeSyncState('char-subsections', null), pendingPaths: ['combat.weapons.0'] },
    }) as ReconcileRemoteSnapshotResult;

    expect(result.action).toBe('merge');
    if (result.action === 'merge') {
      expect(result.character.weapons).toEqual([{ name: 'Local Dagger', attackBonus: 2, damage: '1d4' }]); // local pending kept
      expect(result.character.ac).toBe(16); // pulled from remote
      expect(result.character.customSections).toEqual([{ id: 'section-1', title: 'Remote Section', content: 'x' }]); // pulled from remote
    }
  });

  it('merges independent homebrew sub-sections in both directions (fields pending locally, sections pulled from remote)', () => {
    const local = createEmptyCharacter({
      id: 'char-homebrew',
      name: 'Local',
      customFields: [{ id: 'field-1', label: 'Local Field', type: 'text', value: '' }],
      customSections: [{ id: 'section-1', title: 'Local Section', content: 'x' }],
    });
    const remote = createEmptyCharacter({
      id: 'char-homebrew',
      name: 'Local',
      customFields: [{ id: 'field-1', label: 'Remote Field', type: 'text', value: '' }],
      customSections: [{ id: 'section-1', title: 'Remote Section', content: 'y' }],
    });

    const result = reconcileRemoteSnapshot({
      localCharacter: local,
      remoteCharacter: remote,
      remotePathsSinceLastSync: ['homebrew.sections.0'],
      syncState: { ...normalizeSyncState('char-homebrew', null), pendingPaths: ['homebrew.fields.0'] },
    }) as ReconcileRemoteSnapshotResult;

    expect(result.action).toBe('merge');
    if (result.action === 'merge') {
      expect(result.character.customFields).toEqual([{ id: 'field-1', label: 'Local Field', type: 'text', value: '' }]); // local pending kept
      expect(result.character.customSections).toEqual([{ id: 'section-1', title: 'Remote Section', content: 'y' }]); // pulled from remote
    }
  });

  it('preserves the legacy combat.rest fallback: a pending rest action still holds back an unrelated concurrent weapons change', () => {
    const local = createEmptyCharacter({
      id: 'char-rest',
      name: 'Local',
      hp: { max: 10, current: 10, temp: 0 },
      hitDice: '3d8',
      weapons: [{ name: 'Local Sword', attackBonus: 2, damage: '1d8' }],
    });
    const remote = createEmptyCharacter({
      id: 'char-rest',
      name: 'Local',
      hp: { max: 10, current: 2, temp: 0 },
      hitDice: '1d8',
      weapons: [{ name: 'Remote Sword', attackBonus: 3, damage: '1d10' }],
    });

    const result = reconcileRemoteSnapshot({
      localCharacter: local,
      remoteCharacter: remote,
      remotePathsSinceLastSync: ['combat.weapons.0'],
      syncState: { ...normalizeSyncState('char-rest', null), pendingPaths: ['combat.rest', 'combat.hp'] },
    }) as ReconcileRemoteSnapshotResult;

    expect(result.action).toBe('merge');
    if (result.action === 'merge') {
      // combat.rest has no dedicated sub-section, so it falls back to the legacy 'combat'
      // bucket, which (by design) also holds back combat.weapons — matching pre-refactor
      // behavior where the whole combat section was one unit.
      expect(result.character.hp.current).toBe(10);
      expect(result.character.weapons).toEqual([{ name: 'Local Sword', attackBonus: 2, damage: '1d8' }]);
    }
  });
});

// COL-5: entry.atMs is the writer device's own clock. These tests use a fixed baseline instead
// of Date.now() to prove the id-diff mechanism is correct regardless of clock skew direction.
describe('computeRemoteHistorySync', () => {
  const T = 1_000_000;

  function entry(overrides: Partial<CharacterChangeHistoryEntry>): CharacterChangeHistoryEntry {
    return {
      id: 'default-id',
      uid: 'uid-A',
      tab: 'Combat',
      paths: ['combat.hp.current'],
      atMs: T,
      ...overrides,
    };
  }

  it('includes a remote entry whose writer clock is 10 minutes AHEAD, on first contact', () => {
    const history = [entry({ id: 'a-1', uid: 'uid-A', atMs: T + 10 * 60_000, paths: ['combat.hp.current'] })];

    const result = computeRemoteHistorySync({ history, selfUid: 'me', seenHistoryEntryIds: [] });

    expect(result.remotePathsSinceLastSync).toEqual(['combat.hp.current']);
    expect(result.seenHistoryEntryIds).toEqual(['a-1']);
  });

  it('includes a remote entry whose writer clock is 10 minutes BEHIND, on first contact', () => {
    const history = [entry({ id: 'b-1', uid: 'uid-B', atMs: T - 10 * 60_000, paths: ['inventory.items'] })];

    const result = computeRemoteHistorySync({ history, selfUid: 'me', seenHistoryEntryIds: [] });

    expect(result.remotePathsSinceLastSync).toEqual(['inventory.items']);
  });

  it('does not re-include the same entry once it has been seen (no infinite reprocessing)', () => {
    const history = [entry({ id: 'a-1', uid: 'uid-A', atMs: T + 10 * 60_000, paths: ['combat.hp.current'] })];

    const first = computeRemoteHistorySync({ history, selfUid: 'me', seenHistoryEntryIds: [] });
    const second = computeRemoteHistorySync({
      history,
      selfUid: 'me',
      seenHistoryEntryIds: first.seenHistoryEntryIds,
    });

    expect(second.remotePathsSinceLastSync).toEqual([]);
  });

  it('excludes entries authored by selfUid regardless of atMs', () => {
    const history = [entry({ id: 'self-1', uid: 'me', atMs: T + 10 * 60_000, paths: ['notes.journal'] })];

    const result = computeRemoteHistorySync({ history, selfUid: 'me', seenHistoryEntryIds: [] });

    expect(result.remotePathsSinceLastSync).toEqual([]);
    expect(result.seenHistoryEntryIds).toEqual(['self-1']);
  });

  it('handles multiple writers independently in the same snapshot', () => {
    const history = [
      entry({ id: 'a-1', uid: 'uid-A', atMs: T - 10 * 60_000, paths: ['combat.hp.current'] }),
      entry({ id: 'b-1', uid: 'uid-B', atMs: T + 10 * 60_000, paths: ['inventory.items'] }),
    ];

    const firstPass = computeRemoteHistorySync({ history, selfUid: 'me', seenHistoryEntryIds: [] });
    expect(firstPass.remotePathsSinceLastSync.sort()).toEqual(['combat.hp.current', 'inventory.items']);

    const historyWithNewA = [...history, entry({ id: 'a-2', uid: 'uid-A', atMs: T - 5 * 60_000, paths: ['combat.ac'] })];
    const secondPass = computeRemoteHistorySync({
      history: historyWithNewA,
      selfUid: 'me',
      seenHistoryEntryIds: firstPass.seenHistoryEntryIds,
    });
    expect(secondPass.remotePathsSinceLastSync).toEqual(['combat.ac']);
  });
});

describe('computeSeenEntryIdsFromRawHistory', () => {
  it('returns an empty array for non-array input', () => {
    expect(computeSeenEntryIdsFromRawHistory(null)).toEqual([]);
    expect(computeSeenEntryIdsFromRawHistory(undefined)).toEqual([]);
    expect(computeSeenEntryIdsFromRawHistory('not-an-array')).toEqual([]);
  });

  it('ignores malformed entries and extracts valid string ids', () => {
    const raw = [null, {}, { id: 42 }, { id: 'valid-1' }, { id: 'valid-2', uid: 'uid-A' }];
    expect(computeSeenEntryIdsFromRawHistory(raw)).toEqual(['valid-1', 'valid-2']);
  });
});

describe('resolveConflict keep-cloud (COL-5 cursor bump)', () => {
  it('records seenHistoryEntryIds and serverSyncAtMs from the freshly fetched doc', async () => {
    const serverMs = 1_700_000_000_000;
    vi.mocked(characterCloudRepository.fetchById).mockResolvedValueOnce({
      id: 'char-conflict',
      changeHistory: [{ id: 'remote-1', uid: 'uid-other', tab: 'Combat', paths: ['combat.hp.current'], atMs: 1 }],
      lastChangeAt: { toMillis: () => serverMs },
    } as unknown as CharacterSheet);

    const character = createEmptyCharacter({ id: 'char-conflict', name: 'Conflicted' });
    const recordRemoteSyncState = vi.fn(async () => {});
    const syncPort = {
      ensureCharacterSync: vi.fn(async () => {}),
      setCloudAvailability: vi.fn(async () => {}),
      markCloudUploaded: vi.fn(async () => {}),
      markCloudDownloaded: vi.fn(async () => {}),
      clearConflicts: vi.fn(async () => {}),
      setSyncTransport: vi.fn(async () => {}),
      markSyncError: vi.fn(async () => {}),
      recordRemoteSyncState,
    };

    const result = await resolveConflict({
      strategy: 'keep-cloud',
      character,
      actorRole: 'Player',
      syncPort,
      isOnline: true,
    });

    expect(result.status).toBe('resolved-cloud');
    expect(recordRemoteSyncState).toHaveBeenCalledWith('char-conflict', {
      seenHistoryEntryIds: ['remote-1'],
      serverSyncAtMs: serverMs,
    });
  });
});
