import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/repositories/characterCloudRepository', () => ({
  characterCloudRepository: {
    upsertFromLocal: vi.fn(),
    fetchById: vi.fn(),
    fetchRecentChangeEntries: vi.fn(),
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

const syncTelemetryMocks = vi.hoisted(() => ({
  toastError: vi.fn(),
  trackProductEvent: vi.fn(),
}));

vi.mock('@/shared/services/toast', () => ({
  toast: { error: syncTelemetryMocks.toastError, success: vi.fn(), info: vi.fn() },
}));

vi.mock('@/shared/services/telemetry/productTelemetry', () => ({
  trackProductEvent: syncTelemetryMocks.trackProductEvent,
}));

vi.mock('@/i18n', () => ({
  default: { t: (key: string) => key },
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
  computeSeenEntryIdsFromChangeEntries,
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

function firestoreError(code: string, message = 'boom'): Error {
  const error = new Error(message);
  (error as unknown as { code: string }).code = code;
  return error;
}

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

  describe('COL-4 counter baseline advancement', () => {
    it('a narrow combat.hp upload advances the baseline only for hp.current/hp.temp, leaving an unrelated still-pending counter untouched', async () => {
      vi.mocked(characterCloudRepository.upsertFromLocal).mockResolvedValueOnce({ id: 'char-baseline', updated: true });
      const character = createEmptyCharacter({
        id: 'char-baseline',
        name: 'Test',
        hp: { max: 20, current: 13, temp: 0 },
        customResources: [{ id: 'mana', label: 'Mana', current: 9, max: 10, resetRule: 'long-rest' }],
      });
      const syncPort = {
        ensureCharacterSync: vi.fn(async () => {}),
        setCloudAvailability: vi.fn(async () => {}),
        markCloudUploaded: vi.fn(async () => {}),
        setSyncTransport: vi.fn(async () => {}),
        markSyncError: vi.fn(async () => {}),
      };

      await syncToCloud({
        character,
        // this device also has a separate, still-pending, not-yet-uploaded resource edit —
        // its baseline must not be silently advanced by this unrelated combat.hp upload.
        syncState: {
          ...normalizeSyncState('char-baseline', null),
          counterBaseline: { 'hp.current': 20, 'customResources.mana.current': 5 },
        },
        actorRole: 'Player',
        syncPort,
        isOnline: true,
        historyPaths: ['combat.hp'],
      });

      expect(syncPort.markCloudUploaded).toHaveBeenCalledWith('char-baseline', {
        counterBaseline: { 'hp.current': 13, 'hp.temp': 0, 'customResources.mana.current': 5 },
        conditionsBaseline: undefined,
      });
    });

    it('an untagged/fallback upload (or a brand-new document) advances the WHOLE counter baseline, since that write genuinely touches every field', async () => {
      vi.mocked(characterCloudRepository.upsertFromLocal).mockResolvedValueOnce({ id: 'char-fallback', created: true });
      const character = createEmptyCharacter({
        id: 'char-fallback',
        name: 'Test',
        hp: { max: 20, current: 13, temp: 0 },
        deathSaves: { successes: 1, failures: 0 },
      });
      const syncPort = {
        ensureCharacterSync: vi.fn(async () => {}),
        setCloudAvailability: vi.fn(async () => {}),
        markCloudUploaded: vi.fn(async () => {}),
        setSyncTransport: vi.fn(async () => {}),
        markSyncError: vi.fn(async () => {}),
      };

      await syncToCloud({
        character,
        syncState: normalizeSyncState('char-fallback', null),
        actorRole: 'Player',
        syncPort,
        isOnline: true,
        // 'overview.identity' is not in COUNTER_SCOPE_BY_TAG — a scoped-only baseline update
        // would wrongly leave hp/deathSaves unadvanced even though this write (a brand-new
        // doc) wrote every field absolutely, causing the next real combat.hp upload to resend
        // an already-applied delta a second time.
        historyPaths: ['overview.identity'],
      });

      expect(syncPort.markCloudUploaded).toHaveBeenCalledWith('char-fallback', {
        counterBaseline: { 'hp.current': 13, 'hp.temp': 0, 'deathSaves.successes': 1, 'deathSaves.failures': 0 },
        conditionsBaseline: [],
      });
    });
  });

  // COL-7 acceptance test: permission-denied must surface a visible toast + telemetry;
  // an offline/expected failure must stay silent, same as before this change.
  describe('COL-7 error visibility', () => {
    function buildSyncPort() {
      return {
        ensureCharacterSync: vi.fn(async () => {}),
        setCloudAvailability: vi.fn(async () => {}),
        markCloudUploaded: vi.fn(async () => {}),
        setSyncTransport: vi.fn(async () => {}),
        markSyncError: vi.fn(async () => {}),
        markConflict: vi.fn(async () => {}),
      };
    }

    it('shows a toast and tracks sync_failed + permission_denied_on_upload for a permission-denied write', async () => {
      vi.mocked(characterCloudRepository.upsertFromLocal).mockRejectedValueOnce(
        firestoreError('firestore/permission-denied', 'Missing or insufficient permissions'),
      );
      const character = createEmptyCharacter({ id: 'char-permission', name: 'Denied' });
      const syncPort = buildSyncPort();

      const result = await syncToCloud({ character, actorRole: 'Player', syncPort, isOnline: true, fallbackPath: 'overview.identity' });

      expect(result.status).toBe('error');
      expect(syncTelemetryMocks.toastError).toHaveBeenCalledTimes(1);
      expect(syncTelemetryMocks.trackProductEvent).toHaveBeenCalledWith('sync_failed', {
        code: 'firestore/permission-denied',
      });
      expect(syncTelemetryMocks.trackProductEvent).toHaveBeenCalledWith('permission_denied_on_upload');
      expect(syncPort.markConflict).not.toHaveBeenCalled();
    });

    it('stays silent (no toast, no telemetry) for an offline-like firestore/unavailable failure, same as today', async () => {
      vi.mocked(characterCloudRepository.upsertFromLocal).mockRejectedValueOnce(firestoreError('firestore/unavailable'));
      const character = createEmptyCharacter({ id: 'char-unavailable', name: 'Offline-ish' });
      const syncPort = buildSyncPort();

      const result = await syncToCloud({ character, actorRole: 'Player', syncPort, isOnline: true, fallbackPath: 'overview.identity' });

      expect(result.status).toBe('error');
      expect(syncTelemetryMocks.toastError).not.toHaveBeenCalled();
      expect(syncTelemetryMocks.trackProductEvent).not.toHaveBeenCalled();
      expect(syncPort.markConflict).not.toHaveBeenCalled();
    });

    it('does not toast at all when the device itself is offline (isOnline: false)', async () => {
      const character = createEmptyCharacter({ id: 'char-truly-offline', name: 'No network' });
      const syncPort = buildSyncPort();

      const result = await syncToCloud({ character, actorRole: 'Player', syncPort, isOnline: false, fallbackPath: 'overview.identity' });

      expect(result.status).toBe('offline');
      expect(characterCloudRepository.upsertFromLocal).not.toHaveBeenCalled();
      expect(syncTelemetryMocks.toastError).not.toHaveBeenCalled();
      expect(syncTelemetryMocks.trackProductEvent).not.toHaveBeenCalled();
    });

    it('routes firestore/aborted through markConflict by CODE, not by matching "conflict" in the message text', async () => {
      vi.mocked(characterCloudRepository.upsertFromLocal).mockRejectedValueOnce(
        firestoreError('firestore/aborted', 'Transaction lock timeout'),
      );
      const character = createEmptyCharacter({ id: 'char-aborted', name: 'Contended' });
      const syncPort = buildSyncPort();

      const result = await syncToCloud({
        character,
        actorRole: 'Player',
        syncPort,
        isOnline: true,
        historyPaths: ['combat.hp'],
        fallbackPath: 'overview.identity',
      });

      expect(result.status).toBe('error');
      expect(syncPort.markConflict).toHaveBeenCalledWith('char-aborted', ['combat.hp']);
      expect(syncTelemetryMocks.toastError).not.toHaveBeenCalled();
      expect(syncTelemetryMocks.trackProductEvent).not.toHaveBeenCalled();
    });

    it('a message containing the word "conflict" no longer triggers markConflict when the code says otherwise', async () => {
      vi.mocked(characterCloudRepository.upsertFromLocal).mockRejectedValueOnce(
        firestoreError('firestore/permission-denied', 'Write blocked: conflict with security rules'),
      );
      const character = createEmptyCharacter({ id: 'char-fake-conflict', name: 'Not really a conflict' });
      const syncPort = buildSyncPort();

      await syncToCloud({ character, actorRole: 'Player', syncPort, isOnline: true, fallbackPath: 'overview.identity' });

      expect(syncPort.markConflict).not.toHaveBeenCalled();
      expect(syncTelemetryMocks.toastError).toHaveBeenCalledTimes(1);
    });
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

  it('Виняток 3 (supersedes COL-4): overview.conditions (player) vs combat.conditions (DM) merge instead of conflicting — both write via arrayUnion/arrayRemove and commute', () => {
    const local = createEmptyCharacter({ id: 'char-conditions', name: 'Local', conditions: ['poisoned'] });
    const remote = createEmptyCharacter({ id: 'char-conditions', name: 'Local', conditions: ['prone'] });

    const result = reconcileRemoteSnapshot({
      localCharacter: local,
      remoteCharacter: remote,
      remotePathsSinceLastSync: ['combat.conditions.prone'],
      syncState: { ...normalizeSyncState('char-conditions', null), pendingPaths: ['overview.conditions'] },
    }) as ReconcileRemoteSnapshotResult;

    expect(result.action).toBe('merge');
    if (result.action === 'merge') {
      // Local's own still-pending 'poisoned' add is kept in the view until its own upload
      // lands; 'prone' (the DM's remote add) will show up once this device's own upload
      // completes and a later snapshot reflects the server-merged array — both survive,
      // neither is dropped, because both sides write via arrayUnion.
      expect(result.character.conditions).toEqual(['poisoned']);
      // The conditions baseline stays frozen while our own condition edit is still pending —
      // advancing it to remote's ['prone'] now would corrupt the add/remove delta our own
      // still-pending upload computes later.
      expect(result.conditionsBaseline).toEqual([]);
    }
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

describe('computeSeenEntryIdsFromChangeEntries', () => {
  it('returns an empty array for an empty list', () => {
    expect(computeSeenEntryIdsFromChangeEntries([])).toEqual([]);
  });

  it('filters out entries with a blank id and preserves order', () => {
    const entries = [
      { id: 'a', uid: 'u1', tab: 'Combat', paths: [], atMs: 1 },
      { id: '', uid: 'u2', tab: 'Combat', paths: [], atMs: 2 },
      { id: 'b', uid: 'u3', tab: 'Overview', paths: [], atMs: 3 },
    ] as unknown as CharacterChangeHistoryEntry[];

    expect(computeSeenEntryIdsFromChangeEntries(entries)).toEqual(['a', 'b']);
  });
});

describe('resolveConflict keep-cloud (COL-5 cursor bump)', () => {
  it('records seenHistoryEntryIds and serverSyncAtMs from the freshly fetched doc', async () => {
    const serverMs = 1_700_000_000_000;
    vi.mocked(characterCloudRepository.fetchById).mockResolvedValueOnce({
      id: 'char-conflict',
      lastChangeAt: { toMillis: () => serverMs },
    } as unknown as CharacterSheet);
    // COL-9: seen entry ids now come from the changes subcollection, not doc.changeHistory.
    vi.mocked(characterCloudRepository.fetchRecentChangeEntries).mockResolvedValueOnce([
      { id: 'remote-1', uid: 'uid-other', tab: 'Combat', paths: ['combat.hp.current'], atMs: 1 },
    ]);

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
      // keep-cloud fully replaces local with the fetched doc, so the whole counter/conditions
      // baseline advances too (COL-4) — empty here because the mocked doc carries no hp/
      // deathSaves/conditions fields.
      counterBaseline: {},
      conditionsBaseline: [],
    });
  });
});
