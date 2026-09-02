import { describe, expect, it } from 'vitest';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import type { CharacterSyncState } from '@/types/Sync';
import {
  buildDmPreview,
  buildHomeCharacterPreviews,
  buildSyncStrip,
  countConflicts,
  countPendingSync,
  formatInitiative,
  selectContinueState,
} from './homeViewModel';

function syncState(partial: Partial<CharacterSyncState>): CharacterSyncState {
  return {
    characterId: 'char-1',
    hasCloud: false,
    localRevision: 0,
    cloudRevision: 0,
    lastLocalChangeAt: null,
    lastSyncAt: null,
    pendingPaths: [],
    conflictPaths: [],
    status: 'local-only',
    transportState: 'idle',
    transportMessage: null,
    lastSyncError: null,
    lastSyncAttemptAt: null,
    counterBaseline: {},
    conditionsBaseline: [],
    ...partial,
  };
}

describe('home view model', () => {
  it('returns empty continue state when there are no characters', () => {
    const state = selectContinueState({
      previews: [],
      lastSessionCharacterId: null,
      currentCharacterId: null,
    });

    expect(state.isEmpty).toBe(true);
    expect(state.character).toBeNull();
  });

  it('builds local character cards with core combat stats', () => {
    const arthas = createEmptyCharacter({
      id: 'arthas',
      name: 'Arthas',
      race: 'Human',
      class: 'Paladin',
      level: 5,
      hp: { current: 32, max: 42, temp: 0 },
      ac: 18,
      initiative: 1,
    });

    const previews = buildHomeCharacterPreviews({
      characters: [{ payload: arthas, source: 'local' }],
      syncByCharacter: {},
      isConnected: true,
      role: 'Player',
    });

    expect(previews).toHaveLength(1);
    expect(previews[0]).toMatchObject({
      name: 'Arthas',
      race: 'Human',
      className: 'Paladin',
      level: 5,
      hpCurrent: 32,
      hpMax: 42,
      ac: 18,
      initiative: 1,
    });
    expect(previews[0].badges.map((badge) => badge.label)).toContain('Локально');
    expect(formatInitiative(previews[0].initiative)).toBe('+1');
  });

  it('merges cloud and shared badges without duplicating character ids', () => {
    const cloud = createEmptyCharacter({ id: 'char-cloud', name: 'Cloud Hero' });
    const shared = createEmptyCharacter({ id: 'char-cloud', name: 'Cloud Hero' });

    const previews = buildHomeCharacterPreviews({
      characters: [
        { payload: cloud, source: 'mine', isSharedSheet: true },
        { payload: shared, source: 'shared', isSharedSheet: true },
      ],
      syncByCharacter: {
        'char-cloud': syncState({
          characterId: 'char-cloud',
          hasCloud: true,
          status: 'in-sync',
          lastSyncAt: 1000,
        }),
      },
      isConnected: true,
      role: 'DM',
    });

    expect(previews).toHaveLength(1);
    expect(previews[0].badges.map((badge) => badge.label)).toEqual(expect.arrayContaining(['Хмара', 'Спільний доступ', 'Синхронізовано']));
  });

  it('shows offline pending and conflict states in sync helpers', () => {
    const syncByCharacter = {
      pending: syncState({
        characterId: 'pending',
        status: 'pending-upload',
        pendingPaths: ['combat.hp'],
      }),
      conflict: syncState({
        characterId: 'conflict',
        status: 'conflict',
        conflictPaths: ['overview.name'],
      }),
    };

    const previews = buildHomeCharacterPreviews({
      characters: [
        { payload: createEmptyCharacter({ id: 'pending', name: 'Pending' }), source: 'local' },
        { payload: createEmptyCharacter({ id: 'conflict', name: 'Conflict' }), source: 'local' },
      ],
      syncByCharacter,
      isConnected: false,
      role: 'Hybrid',
    });

    expect(previews.find((item) => item.id === 'pending')?.badges.map((badge) => badge.label)).toContain('Офлайн-зміни');
    expect(previews.find((item) => item.id === 'conflict')?.badges.map((badge) => badge.label)).toContain('Конфлікт');
    expect(countPendingSync(syncByCharacter, false)).toBe(1);
    expect(countConflicts(syncByCharacter, false)).toBe(1);
  });

  it('selects continue target by last session, current character, then session mode', () => {
    const previews = buildHomeCharacterPreviews({
      characters: [
        { payload: createEmptyCharacter({ id: 'first', name: 'First' }), source: 'local' },
        { payload: createEmptyCharacter({ id: 'current', name: 'Current' }), source: 'local' },
        { payload: createEmptyCharacter({ id: 'last', name: 'Last', sessionMode: true }), source: 'local' },
      ],
      syncByCharacter: {},
      isConnected: true,
      role: 'Player',
    });

    expect(selectContinueState({ previews, lastSessionCharacterId: 'last', currentCharacterId: 'current' }).character?.id).toBe('last');
    expect(selectContinueState({ previews, lastSessionCharacterId: null, currentCharacterId: 'current' }).character?.id).toBe('current');
    expect(selectContinueState({ previews, lastSessionCharacterId: null, currentCharacterId: null }).character?.id).toBe('last');
  });

  it('shows DM preview only when a DM-capable role has an active campaign', () => {
    expect(buildDmPreview({ role: 'DM', campaigns: [], partyCount: 4, pendingChanges: 2, conflictCount: 0 }).shouldShow).toBe(false);
    expect(
      buildDmPreview({
        role: 'Player',
        campaigns: [
          {
            id: 'c1',
            name: 'Curse of Strahd',
            nameNormalized: 'curse-of-strahd',
            ownerUid: 'me',
            owners: [],
            editors: [],
            createdAtMs: 1,
            updatedAtMs: 1,
          },
        ],
        partyCount: 4,
        pendingChanges: 2,
        conflictCount: 0,
      }).shouldShow,
    ).toBe(false);
    expect(
      buildDmPreview({
        role: 'Hybrid',
        campaigns: [
          {
            id: 'c1',
            name: 'Curse of Strahd',
            nameNormalized: 'curse-of-strahd',
            ownerUid: 'me',
            owners: [],
            editors: [],
            createdAtMs: 1,
            updatedAtMs: 1,
          },
        ],
        partyCount: 4,
        pendingChanges: 2,
        conflictCount: 0,
      }),
    ).toMatchObject({
      shouldShow: true,
      campaignName: 'Curse of Strahd',
      partyCount: 4,
      pendingChanges: 2,
    });
  });

  it('builds sync strip labels for pending, conflict, and signed-out cloud states', () => {
    const strip = buildSyncStrip({
      isOnline: false,
      isSignedIn: false,
      pendingCount: 2,
      conflictCount: 1,
      lastSyncAt: 1000,
    });

    expect(strip.networkLabel).toBe('Офлайн');
    expect(strip.cloudLabel).toBe('Хмара: потрібен вхід');
    expect(strip.pendingLabel).toBe('Очікують офлайн-зміни: 2');
    expect(strip.conflictLabel).toBe('Виявлено конфліктів: 1');
    expect(strip.hasPending).toBe(true);
    expect(strip.hasConflict).toBe(true);
  });
});
