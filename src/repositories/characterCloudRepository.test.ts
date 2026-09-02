import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';

const mocks = vi.hoisted(() => {
  const tx = {
    get: vi.fn(async () => ({ id: 'char-1', exists: true, data: () => ({ ownerUid: 'user-1', owners: ['user-1'], editors: [] }) })),
    set: vi.fn(async (_ref: unknown, _payload: Record<string, unknown>, _options?: unknown) => {}),
    update: vi.fn(async (_ref: unknown, _patch: Record<string, unknown>) => {}),
  };

  const targetRef = {
    get: vi.fn(async () => ({ id: 'char-1', exists: false, data: () => null })),
    set: vi.fn(async (_payload: Record<string, unknown>, _options?: unknown) => {}),
    update: vi.fn(async (_patch: Record<string, unknown>) => {}),
  };
  const generatedRef = {
    id: 'generated-copy',
    set: vi.fn(async () => {}),
  };
  const doc = vi.fn((id?: string) => (id ? targetRef : generatedRef));

  return {
    tx,
    targetRef,
    generatedRef,
    collection: vi.fn(() => ({ doc })),
    doc,
    runTransaction: vi.fn(async (fn: (transaction: typeof tx) => Promise<void>) => fn(tx)),
    arrayUnion: vi.fn((...items: unknown[]) => ({ __op: 'arrayUnion', items })),
    arrayRemove: vi.fn((...items: unknown[]) => ({ __op: 'arrayRemove', items })),
    increment: vi.fn((n: number) => ({ __op: 'increment', n })),
    deleteField: vi.fn(() => ({ __op: 'deleteField' })),
    ensureConnection: vi.fn(async () => {}),
    findUserByEmail: vi.fn(async (): Promise<string | null> => null),
    fbAuth: { currentUser: { uid: 'user-1' } as { uid: string } | null },
  };
});

vi.mock('@/services/firebase', () => ({
  db: {
    collection: mocks.collection,
    runTransaction: mocks.runTransaction,
  },
  fbAuth: mocks.fbAuth,
  now: () => 'server-now',
  hasDoc: (snap: { exists?: boolean } | null | undefined) => Boolean(snap?.exists),
  arrayUnion: mocks.arrayUnion,
  arrayRemove: mocks.arrayRemove,
  increment: mocks.increment,
  deleteField: mocks.deleteField,
}));

vi.mock('@/services/connections', () => ({
  ensureConnection: mocks.ensureConnection,
}));

vi.mock('@/services/users', () => ({
  findUserByEmail: mocks.findUserByEmail,
}));

import {
  addEditorByEmail,
  bulkUpsertFromLocal,
  mergeCounterArrayById,
  removeEditor,
  transferOwnership,
  upsertCharacterSheetFromLocal,
} from '@/repositories/characterCloudRepository';

const ACCESS_KEYS = ['ownerUid', 'owners', 'editors'] as const;

describe('characterCloudRepository', () => {
  beforeEach(() => {
    mocks.fbAuth.currentUser = { uid: 'user-1' };
    mocks.targetRef.get.mockReset();
    mocks.targetRef.set.mockReset().mockResolvedValue(undefined);
    mocks.targetRef.update.mockReset().mockResolvedValue(undefined);
    mocks.runTransaction.mockClear();
    mocks.tx.get
      .mockReset()
      .mockResolvedValue({ id: 'char-1', exists: true, data: () => ({ ownerUid: 'user-1', owners: ['user-1'], editors: [] }) });
    mocks.tx.set.mockClear();
    mocks.tx.update.mockReset().mockResolvedValue(undefined);
    mocks.arrayUnion.mockClear();
    mocks.arrayRemove.mockClear();
    mocks.increment.mockClear();
    mocks.ensureConnection.mockReset().mockResolvedValue(undefined);
    mocks.findUserByEmail.mockReset().mockResolvedValue(null);
  });

  it('rejects failed upserts without creating a duplicate cloud document', async () => {
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: false, data: () => null });
    mocks.targetRef.set.mockRejectedValueOnce(new Error('permission denied'));

    await expect(upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test' }))).rejects.toThrow('permission denied');

    expect(mocks.doc).toHaveBeenCalledWith('char-1');
    expect(mocks.doc).not.toHaveBeenCalledWith();
    expect(mocks.generatedRef.set).not.toHaveBeenCalled();
  });

  it('sets owners/editors/ownerUid only when creating a brand-new document', async () => {
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: false, data: () => null });

    await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test' }));

    expect(mocks.targetRef.set).toHaveBeenCalledTimes(1);
    const [payload] = mocks.targetRef.set.mock.calls[0] as [Record<string, unknown>];
    expect(payload.ownerUid).toBe('user-1');
    expect(payload.owners).toEqual(['user-1']);
    expect(payload.editors).toEqual([]);
  });

  it('writes a narrow update() with only the mapped fields for a known sync-path', async () => {
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });

    await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test' }), {
      historyPaths: ['combat.hp'],
    });

    expect(mocks.targetRef.update).toHaveBeenCalledTimes(1);
    expect(mocks.runTransaction).not.toHaveBeenCalled();

    const [patch] = mocks.targetRef.update.mock.calls[0] as [Record<string, unknown>];
    expect(patch).toHaveProperty('hp');
    expect(patch).toHaveProperty('updatedAt');
    for (const key of ACCESS_KEYS) {
      expect(patch).not.toHaveProperty(key);
    }
  });

  describe('COL-4 counter deltas (Виняток 3)', () => {
    it('combat.hp with a counterBaseline writes FieldValue.increment() for hp.current, not an absolute value, and omits hp.temp (unchanged)', async () => {
      mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });

      await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test', hp: { max: 20, current: 13, temp: 0 } }), {
        historyPaths: ['combat.hp'],
        counterBaseline: { 'hp.current': 20, 'hp.temp': 0 },
      });

      expect(mocks.targetRef.update).toHaveBeenCalledTimes(1);
      const [patch] = mocks.targetRef.update.mock.calls[0] as [Record<string, unknown>];
      expect(patch).not.toHaveProperty('hp');
      expect(patch['hp.max']).toBe(20);
      expect(patch['hp.current']).toEqual({ __op: 'increment', n: -7 });
      expect(patch).not.toHaveProperty('hp.temp');
      expect(mocks.increment).toHaveBeenCalledWith(-7);
    });

    it('regression: combat.hp with an EMPTY counterBaseline ({}) still writes hp.current/hp.temp as absolute values instead of silently omitting them', async () => {
      // Every CharacterSyncState normalizes counterBaseline to {} (never undefined) on load —
      // this is the REAL first-ever narrow write for a character under the new delta system,
      // not an edge case. Treating "key absent from baseline" the same as "unchanged" here
      // would silently drop hp.current/hp.temp from the update() call forever.
      mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });

      await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test', hp: { max: 13, current: 3, temp: 0 } }), {
        historyPaths: ['combat.hp'],
        counterBaseline: {},
      });

      const [patch] = mocks.targetRef.update.mock.calls[0] as [Record<string, unknown>];
      expect(patch['hp.max']).toBe(13);
      expect(patch['hp.current']).toBe(3);
      expect(patch['hp.temp']).toBe(0);
      expect(mocks.increment).not.toHaveBeenCalled();
    });

    it('COL-4 flagship scenario: DM -7 HP and player +2 HP each compute their own correct, independent delta against the same shared baseline (Firestore sums both atomically server-side)', async () => {
      // Both devices last synced hp.current at 20 — this is the CharacterSyncState.counterBaseline
      // each holds locally at the moment they each apply their own change.
      const sharedBaseline = { 'hp.current': 20, 'hp.temp': 0 };

      mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });
      await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test', hp: { max: 20, current: 13, temp: 0 } }), {
        historyPaths: ['combat.hp'],
        counterBaseline: sharedBaseline,
      });
      const [dmPatch] = mocks.targetRef.update.mock.calls[0] as [Record<string, unknown>];
      expect(dmPatch['hp.current']).toEqual({ __op: 'increment', n: -7 });

      mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });
      await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test', hp: { max: 20, current: 22, temp: 0 } }), {
        historyPaths: ['combat.hp'],
        counterBaseline: sharedBaseline,
      });
      const [playerPatch] = mocks.targetRef.update.mock.calls[1] as [Record<string, unknown>];
      expect(playerPatch['hp.current']).toEqual({ __op: 'increment', n: 2 });

      // Neither write ever read the other's value — each delta is computed purely from its own
      // local value minus the SAME shared baseline. FieldValue.increment() guarantees Firestore
      // applies -7 and +2 atomically regardless of arrival order: 20 + (-7) + 2 = 15, the
      // correct final value on both clients once each has observed the other's write — this
      // last step is a Firestore server guarantee, not something a mocked unit test can
      // observe; the two-client manual verification steps are in the task report.
    });

    it('combat.death-saves with a counterBaseline writes increment() for successes/failures', async () => {
      mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });

      await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test', deathSaves: { successes: 2, failures: 1 } }), {
        historyPaths: ['combat.death-saves'],
        counterBaseline: { 'deathSaves.successes': 0, 'deathSaves.failures': 0 },
      });

      const [patch] = mocks.targetRef.update.mock.calls[0] as [Record<string, unknown>];
      expect(patch).not.toHaveProperty('deathSaves');
      expect(patch['deathSaves.successes']).toEqual({ __op: 'increment', n: 2 });
      expect(patch['deathSaves.failures']).toEqual({ __op: 'increment', n: 1 });
    });

    it('magic.slots with a counterBaseline writes per-level increment() for used, and an absolute max', async () => {
      mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });

      await upsertCharacterSheetFromLocal(
        createEmptyCharacter({
          id: 'char-1',
          name: 'Test',
          spells: {
            spellcastingAbility: 'int',
            spellSaveDC: 13,
            spellAttackBonus: 5,
            spellSlots: { 1: { max: 4, used: 2 } },
            knownSpells: [],
            preparedSpells: [],
            cantrips: [],
          },
        }),
        { historyPaths: ['magic.slots'], counterBaseline: { 'spells.spellSlots.1.used': 1 } },
      );

      const [patch] = mocks.targetRef.update.mock.calls[0] as [Record<string, unknown>];
      expect(patch).not.toHaveProperty('spells.spellSlots');
      expect(patch['spells.spellSlots.1.max']).toBe(4);
      expect(patch['spells.spellSlots.1.used']).toEqual({ __op: 'increment', n: 1 });
    });

    it('combat.conditions with a conditionsBaseline uses arrayUnion for additions and arrayRemove for removals, never an absolute array overwrite', async () => {
      mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });

      await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test', conditions: ['poisoned'] }), {
        historyPaths: ['combat.conditions'],
        conditionsBaseline: ['prone'],
      });

      expect(mocks.targetRef.update).toHaveBeenCalledTimes(3); // main patch + arrayUnion(add) + arrayRemove(remove)
      const [mainPatch] = mocks.targetRef.update.mock.calls[0] as [Record<string, unknown>];
      expect(mainPatch).not.toHaveProperty('conditions');
      const [addPatch] = mocks.targetRef.update.mock.calls[1] as [Record<string, unknown>];
      expect(addPatch.conditions).toEqual({ __op: 'arrayUnion', items: ['poisoned'] });
      const [removePatch] = mocks.targetRef.update.mock.calls[2] as [Record<string, unknown>];
      expect(removePatch.conditions).toEqual({ __op: 'arrayRemove', items: ['prone'] });
    });

    it('a customResources counter delta forces the transactional path and merges by id instead of blindly overwriting the array', async () => {
      mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });
      mocks.tx.get.mockResolvedValueOnce({
        id: 'char-1',
        exists: true,
        data: () => ({
          ownerUid: 'user-1',
          owners: ['user-1'],
          editors: [],
          customResources: [
            { id: 'mana', label: 'Mana (server)', current: 9, max: 10, resetRule: 'long-rest' },
            { id: 'ki', label: 'Ki (added by another device)', current: 2, max: 5, resetRule: 'short-rest' },
            { id: 'rage', label: 'Rage', current: 3, max: 3, resetRule: 'long-rest' },
          ],
        }),
      });

      await upsertCharacterSheetFromLocal(
        createEmptyCharacter({
          id: 'char-1',
          name: 'Test',
          // locally: ticked mana down by 1 (5 -> 4 against this device's own baseline), never
          // knew about 'ki', and deliberately removed 'rage' (which this device did know about).
          customResources: [{ id: 'mana', label: 'Mana', current: 4, max: 10, resetRule: 'long-rest' }],
        }),
        {
          historyPaths: ['homebrew.resources'],
          counterBaseline: { 'customResources.mana.current': 5, 'customResources.rage.current': 3 },
        },
      );

      expect(mocks.runTransaction).toHaveBeenCalledTimes(1);
      expect(mocks.targetRef.update).not.toHaveBeenCalled();
      const [, payload] = mocks.tx.set.mock.calls[0] as [unknown, Record<string, unknown>];
      const resources = payload.customResources as Array<{ id: string; current: number }>;
      // mana: this device's own delta (4 - 5 = -1) applied on top of the server's current
      // value (9), not on top of the stale local value -> 8, not 4 and not 9.
      expect(resources.find((r) => r.id === 'mana')?.current).toBe(8);
      // ki: absent locally, but no baseline entry -> another device added it after our last
      // sync, so it must survive, not be silently deleted.
      expect(resources.find((r) => r.id === 'ki')).toBeTruthy();
      // rage: absent locally AND this device's baseline knew about it -> deliberate deletion.
      expect(resources.find((r) => r.id === 'rage')).toBeUndefined();
    });
  });

  it('clears campaignId server-side with deleteField() when detaching, instead of skipping it', async () => {
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({ campaignId: 'campaign-1' }) });

    await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test', campaignId: undefined, campaign: '' }), {
      historyPaths: ['overview.campaign'],
    });

    expect(mocks.targetRef.update).toHaveBeenCalledTimes(1);
    const [patch] = mocks.targetRef.update.mock.calls[0] as [Record<string, unknown>];
    expect(patch.campaignId).toEqual({ __op: 'deleteField' });
    expect(mocks.deleteField).toHaveBeenCalled();
  });

  it('falls back to a transaction for an unknown/tab-default sync-path, never touching owners/editors/ownerUid', async () => {
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });

    await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test' }), {
      historyPaths: ['overview.identity'],
    });

    expect(mocks.runTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.targetRef.update).not.toHaveBeenCalled();

    expect(mocks.tx.set).toHaveBeenCalledTimes(1);
    const [, payload] = mocks.tx.set.mock.calls[0] as [unknown, Record<string, unknown>];
    for (const key of ACCESS_KEYS) {
      expect(payload).not.toHaveProperty(key);
    }
  });

  it('falls back to a transaction when no historyPaths are given at all', async () => {
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });

    await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test' }));

    expect(mocks.runTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.targetRef.update).not.toHaveBeenCalled();
  });

  it('sends the full ownership payload in the transactional fallback when the doc does not exist yet, even if the plain get() said it did', async () => {
    // Simulates the race behind the reported permission-denied bug: the outer ref.get() reads
    // stale/optimistic local cache and reports the brand-new doc as already existing, but the
    // transaction's own strongly-consistent get() shows it still doesn't exist server-side.
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });
    mocks.tx.get.mockResolvedValueOnce({ id: 'char-1', exists: false, data: () => null });

    await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test' }));

    expect(mocks.tx.set).toHaveBeenCalledTimes(1);
    const [, payload] = mocks.tx.set.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(payload.ownerUid).toBe('user-1');
    expect(payload.owners).toEqual(['user-1']);
    expect(payload.editors).toEqual([]);
  });

  it('appends changeHistory via arrayUnion, not by assigning a plain array, on the narrow path', async () => {
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });

    await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test' }), {
      historyPaths: ['combat.hp'],
    });

    expect(mocks.arrayUnion).toHaveBeenCalledTimes(1);
    const [patch] = mocks.targetRef.update.mock.calls[0] as [Record<string, unknown>];
    expect(patch.changeHistory).toEqual({ __op: 'arrayUnion', items: mocks.arrayUnion.mock.results[0].value.items });
    expect(Array.isArray(patch.changeHistory)).toBe(false);
  });

  it('appends changeHistory via arrayUnion on the transactional fallback path too', async () => {
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });

    await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test' }), {
      historyPaths: ['overview.identity'],
    });

    expect(mocks.arrayUnion).toHaveBeenCalledTimes(1);
    const [, payload] = mocks.tx.set.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(Array.isArray(payload.changeHistory)).toBe(false);
  });

  it('two sequential writes from different uids each union only their own history entries, never overwriting the other', async () => {
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });
    await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test' }), {
      historyPaths: ['combat.hp'],
      actorRole: 'DM',
    });
    const [firstPatch] = mocks.targetRef.update.mock.calls[0] as [Record<string, unknown>];
    const firstEntries = mocks.arrayUnion.mock.results[0].value.items as Array<{ uid: string }>;
    expect(firstEntries.every((entry) => entry.uid === 'user-1')).toBe(true);
    expect(firstPatch.changeHistory).toEqual({ __op: 'arrayUnion', items: firstEntries });

    mocks.fbAuth.currentUser = { uid: 'user-2' };
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: true, data: () => ({}) });
    await upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test' }), {
      historyPaths: ['overview.conditions'],
      actorRole: 'Player',
    });
    const [secondPatch] = mocks.targetRef.update.mock.calls[1] as [Record<string, unknown>];
    const secondEntries = mocks.arrayUnion.mock.results[1].value.items as Array<{ uid: string }>;
    expect(secondEntries.every((entry) => entry.uid === 'user-2')).toBe(true);
    expect(secondPatch.changeHistory).toEqual({ __op: 'arrayUnion', items: secondEntries });

    // Neither write ever read or recombined the other client's changeHistory —
    // each call only ever unions its own freshly-built entries.
    expect(firstEntries).not.toEqual(secondEntries);
  });

  describe('access-write operations', () => {
    const ACCESS_AND_META_KEYS = ['ownerUid', 'owners', 'editors', 'updatedAt'];

    it('addEditorByEmail: an editor (not owner) is rejected before any write, and ensureConnection never fires', async () => {
      mocks.tx.get.mockResolvedValueOnce({
        id: 'char-1',
        exists: true,
        data: () => ({ ownerUid: 'owner-1', owners: ['owner-1'], editors: ['user-1'] }),
      });
      mocks.findUserByEmail.mockResolvedValueOnce('new-editor');

      await expect(addEditorByEmail('char-1', 'new@example.com')).rejects.toThrow('Only an owner can add an editor');

      expect(mocks.tx.update).not.toHaveBeenCalled();
      expect(mocks.ensureConnection).not.toHaveBeenCalled();
    });

    it('addEditorByEmail: an owner can add an editor, and ensureConnection fires only after the write succeeds', async () => {
      mocks.tx.get.mockResolvedValueOnce({
        id: 'char-1',
        exists: true,
        data: () => ({ ownerUid: 'user-1', owners: ['user-1'], editors: [] }),
      });
      mocks.findUserByEmail.mockResolvedValueOnce('new-editor');

      const result = await addEditorByEmail('char-1', 'new@example.com');

      expect(result).toBe('new-editor');
      expect(mocks.tx.update).toHaveBeenCalledTimes(1);
      const [, patch] = mocks.tx.update.mock.calls[0] as [unknown, Record<string, unknown>];
      expect(patch.editors).toEqual(['new-editor']);
      expect(Object.keys(patch).every((key) => ACCESS_AND_META_KEYS.includes(key))).toBe(true);
      expect(mocks.ensureConnection).toHaveBeenCalledTimes(1);
      expect(mocks.ensureConnection).toHaveBeenCalledWith('new-editor');
    });

    it('addEditorByEmail: does not call ensureConnection when the sheet does not exist', async () => {
      mocks.tx.get.mockResolvedValueOnce({ id: 'char-1', exists: false, data: () => null });
      mocks.findUserByEmail.mockResolvedValueOnce('new-editor');

      await expect(addEditorByEmail('char-1', 'new@example.com')).rejects.toThrow('Sheet not found');

      expect(mocks.tx.update).not.toHaveBeenCalled();
      expect(mocks.ensureConnection).not.toHaveBeenCalled();
    });

    it('removeEditor: an editor (not owner) is rejected before any write', async () => {
      mocks.tx.get.mockResolvedValueOnce({
        id: 'char-1',
        exists: true,
        data: () => ({ ownerUid: 'owner-1', owners: ['owner-1'], editors: ['user-1', 'other-editor'] }),
      });

      await expect(removeEditor('char-1', 'other-editor')).rejects.toThrow('Only an owner can remove an editor');
      expect(mocks.tx.update).not.toHaveBeenCalled();
    });

    it('removeEditor: an owner can remove an editor', async () => {
      mocks.tx.get.mockResolvedValueOnce({
        id: 'char-1',
        exists: true,
        data: () => ({ ownerUid: 'user-1', owners: ['user-1'], editors: ['editor-a', 'editor-b'] }),
      });

      await removeEditor('char-1', 'editor-a');

      const [, patch] = mocks.tx.update.mock.calls[0] as [unknown, Record<string, unknown>];
      expect(patch.editors).toEqual(['editor-b']);
      expect(Object.keys(patch).every((key) => ACCESS_AND_META_KEYS.includes(key))).toBe(true);
    });

    it('removeEditor: throws instead of silently no-op-ing when the sheet does not exist', async () => {
      mocks.tx.get.mockResolvedValueOnce({ id: 'char-1', exists: false, data: () => null });

      await expect(removeEditor('char-1', 'editor-a')).rejects.toThrow('Sheet not found');
      expect(mocks.tx.update).not.toHaveBeenCalled();
    });

    it('transferOwnership: an editor (not owner) is rejected before any write', async () => {
      mocks.tx.get.mockResolvedValueOnce({
        id: 'char-1',
        exists: true,
        data: () => ({ ownerUid: 'owner-1', owners: ['owner-1'], editors: ['user-1'] }),
      });

      await expect(transferOwnership('char-1', 'user-1')).rejects.toThrow('Only an owner can transfer ownership');
      expect(mocks.tx.update).not.toHaveBeenCalled();
    });

    it('transferOwnership: rejects a target who is neither an existing editor nor co-owner', async () => {
      mocks.tx.get.mockResolvedValueOnce({
        id: 'char-1',
        exists: true,
        data: () => ({ ownerUid: 'user-1', owners: ['user-1'], editors: ['editor-a'] }),
      });

      await expect(transferOwnership('char-1', 'stranger')).rejects.toThrow(
        'New owner must already be an editor or co-owner of this sheet',
      );
      expect(mocks.tx.update).not.toHaveBeenCalled();
    });

    it('transferOwnership: promotes an existing editor, demotes the outgoing owner to editor, and leaves other participants untouched', async () => {
      mocks.tx.get.mockResolvedValueOnce({
        id: 'char-1',
        exists: true,
        data: () => ({ ownerUid: 'user-1', owners: ['user-1', 'co-owner-z'], editors: ['editor-a', 'editor-b'] }),
      });

      await transferOwnership('char-1', 'editor-a');

      const [, patch] = mocks.tx.update.mock.calls[0] as [unknown, Record<string, unknown>];
      expect(patch.ownerUid).toBe('editor-a');
      expect((patch.owners as string[]).sort()).toEqual(['co-owner-z', 'editor-a']);
      expect((patch.editors as string[]).sort()).toEqual(['editor-b', 'user-1']);
      expect(Object.keys(patch).every((key) => ACCESS_AND_META_KEYS.includes(key))).toBe(true);
    });

    it('transferOwnership: is a no-op when transferring to yourself', async () => {
      mocks.tx.get.mockResolvedValueOnce({
        id: 'char-1',
        exists: true,
        data: () => ({ ownerUid: 'user-1', owners: ['user-1'], editors: [] }),
      });

      await transferOwnership('char-1', 'user-1');

      expect(mocks.tx.update).not.toHaveBeenCalled();
    });
  });

  // COL-7: bulkUpsertFromLocal used to have an empty catch per character, so a failed
  // write on character N was indistinguishable from success. It must now report failures.
  describe('bulkUpsertFromLocal (COL-7 visibility)', () => {
    it('returns an empty list when every character upserts successfully', async () => {
      mocks.targetRef.get.mockResolvedValue({ id: 'char-1', exists: false, data: () => null });
      mocks.targetRef.set.mockResolvedValue(undefined);

      const failures = await bulkUpsertFromLocal([createEmptyCharacter({ id: 'char-1', name: 'Ok' })]);

      expect(failures).toEqual([]);
    });

    it('collects a failure with its id and classified code instead of swallowing it, and keeps processing the rest of the list', async () => {
      mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-a', exists: false, data: () => null });
      const deniedError = new Error('Missing or insufficient permissions');
      (deniedError as unknown as { code: string }).code = 'firestore/permission-denied';
      mocks.targetRef.set.mockRejectedValueOnce(deniedError);
      mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-b', exists: false, data: () => null });
      mocks.targetRef.set.mockResolvedValueOnce(undefined);

      const failures = await bulkUpsertFromLocal([
        createEmptyCharacter({ id: 'char-a', name: 'Fails' }),
        createEmptyCharacter({ id: 'char-b', name: 'Succeeds' }),
      ]);

      expect(failures).toEqual([{ id: 'char-a', code: 'firestore/permission-denied', message: 'Missing or insufficient permissions' }]);
    });
  });
});

describe('mergeCounterArrayById', () => {
  it("applies this device's own known delta on top of the server's current value, not on top of the stale local value", () => {
    const result = mergeCounterArrayById([{ id: 'mana', current: 9 }], [{ id: 'mana', current: 4 }], { 'x.mana.current': 5 }, 'x.');
    expect(result).toEqual([{ id: 'mana', current: 8 }]);
  });

  it('keeps a server-only id the device never knew about (added by another device since our last sync)', () => {
    const result = mergeCounterArrayById(
      [
        { id: 'mana', current: 9 },
        { id: 'ki', current: 2 },
      ],
      [{ id: 'mana', current: 9 }],
      { 'x.mana.current': 9 },
      'x.',
    );
    expect(result.map((r) => r.id).sort()).toEqual(['ki', 'mana']);
  });

  it('drops a server id the device knew about but has since removed locally (deliberate deletion)', () => {
    const result = mergeCounterArrayById(
      [
        { id: 'mana', current: 9 },
        { id: 'rage', current: 3 },
      ],
      [{ id: 'mana', current: 9 }],
      { 'x.mana.current': 9, 'x.rage.current': 3 },
      'x.',
    );
    expect(result.map((r) => r.id)).toEqual(['mana']);
  });

  it('appends a locally-added id absent from the server (structural add)', () => {
    const result = mergeCounterArrayById(
      [{ id: 'mana', current: 9 }],
      [
        { id: 'mana', current: 9 },
        { id: 'new-res', current: 1 },
      ],
      { 'x.mana.current': 9 },
      'x.',
    );
    expect(result.map((r) => r.id).sort()).toEqual(['mana', 'new-res']);
  });
});
