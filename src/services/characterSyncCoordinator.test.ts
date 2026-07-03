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
import {
  applySyncTransition,
  normalizeSyncState,
  reconcileRemoteSnapshot,
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
