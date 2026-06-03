import { describe, expect, it, vi } from 'vitest';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import {
  selectActiveCharacter,
  selectCharacterStoreActions,
  selectCharacterStoreBasics,
  type CharacterStoreSelectorState,
} from '@/stores/selectors/characterStoreSelectors';
import {
  selectSyncByCharacterId,
  selectSyncStoreActions,
  type SyncStoreSelectorState,
} from '@/stores/selectors/syncStoreSelectors';

const asyncNoop = vi.fn(async () => {});

function createCharacterState(partial: Partial<CharacterStoreSelectorState>): CharacterStoreSelectorState {
  return {
    characters: [],
    currentCharacterId: null,
    lastSessionCharacterId: null,
    setLastSessionCharacterId: asyncNoop,
    updateCharacter: asyncNoop,
    ...partial,
  };
}

function createSyncState(partial: Partial<SyncStoreSelectorState>): SyncStoreSelectorState {
  return {
    syncByCharacter: {},
    loadSyncMeta: asyncNoop,
    ensureCharacterSync: asyncNoop,
    setCloudAvailability: asyncNoop,
    markLocalDraftPaths: asyncNoop,
    markCloudUploaded: asyncNoop,
    markCloudDownloaded: asyncNoop,
    markConflict: asyncNoop,
    clearConflicts: asyncNoop,
    setSyncTransport: asyncNoop,
    markSyncError: asyncNoop,
    ...partial,
  };
}

describe('store selectors', () => {
  it('selectActiveCharacter returns the active character and is stable when other entries change', () => {
    const active = createEmptyCharacter({ id: 'char-active', name: 'Active' });
    const other = createEmptyCharacter({ id: 'char-other', name: 'Other' });

    const initial = createCharacterState({
      characters: [active, other],
      currentCharacterId: 'char-active',
    });

    const selectedInitial = selectActiveCharacter(initial);
    expect(selectedInitial).toBe(active);

    const updated = createCharacterState({
      ...initial,
      characters: [active, { ...other, level: 2 }],
    });

    const selectedUpdated = selectActiveCharacter(updated);
    expect(selectedUpdated).toBe(active);
  });

  it('character action/basics selectors expose only required slices', () => {
    const setLastSessionCharacterId = vi.fn(async (_id: string | null) => {});
    const updateCharacter = vi.fn(async (_id: string, _character: ReturnType<typeof createEmptyCharacter>) => {});

    const state = createCharacterState({
      currentCharacterId: 'char-1',
      lastSessionCharacterId: 'char-1',
      setLastSessionCharacterId,
      updateCharacter,
    });

    expect(selectCharacterStoreBasics(state)).toEqual({ currentCharacterId: 'char-1', lastSessionCharacterId: 'char-1' });
    expect(selectCharacterStoreActions(state).setLastSessionCharacterId).toBe(setLastSessionCharacterId);
    expect(selectCharacterStoreActions(state).updateCharacter).toBe(updateCharacter);
  });

  it('selectSyncByCharacterId isolates current character sync state', () => {
    const syncA = {
      characterId: 'char-a',
      hasCloud: true,
      localRevision: 2,
      cloudRevision: 2,
      lastLocalChangeAt: 100,
      lastSyncAt: 100,
      pendingPaths: [],
      conflictPaths: [],
      status: 'in-sync' as const,
      transportState: 'idle' as const,
      transportMessage: null,
      lastSyncError: null,
      lastSyncAttemptAt: 100,
    };
    const syncB = {
      ...syncA,
      characterId: 'char-b',
      status: 'pending-upload' as const,
      pendingPaths: ['combat.hp'],
    };

    const initial = createSyncState({
      syncByCharacter: {
        'char-a': syncA,
        'char-b': syncB,
      },
    });

    const selector = selectSyncByCharacterId('char-a');
    expect(selector(initial)).toBe(syncA);

    const updated = createSyncState({
      ...initial,
      syncByCharacter: {
        'char-a': syncA,
        'char-b': { ...syncB, localRevision: 3 },
      },
    });

    expect(selector(updated)).toBe(syncA);
    expect(selectSyncStoreActions(initial).markConflict).toBe(initial.markConflict);
  });
});
