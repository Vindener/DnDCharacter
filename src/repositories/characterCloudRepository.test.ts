import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';

const mocks = vi.hoisted(() => {
  const tx = {
    get: vi.fn(async () => ({ id: 'char-1', exists: true, data: () => ({ ownerUid: 'user-1', owners: ['user-1'], editors: [] }) })),
    set: vi.fn(async (_ref: unknown, _payload: Record<string, unknown>, _options?: unknown) => {}),
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
}));

vi.mock('@/services/connections', () => ({
  ensureConnection: vi.fn(async () => {}),
}));

vi.mock('@/services/users', () => ({
  findUserByEmail: vi.fn(async () => null),
}));

import { upsertCharacterSheetFromLocal } from '@/repositories/characterCloudRepository';

const ACCESS_KEYS = ['ownerUid', 'owners', 'editors'] as const;

describe('characterCloudRepository', () => {
  beforeEach(() => {
    mocks.fbAuth.currentUser = { uid: 'user-1' };
    mocks.targetRef.get.mockReset();
    mocks.targetRef.set.mockReset().mockResolvedValue(undefined);
    mocks.targetRef.update.mockReset().mockResolvedValue(undefined);
    mocks.runTransaction.mockClear();
    mocks.tx.set.mockClear();
    mocks.arrayUnion.mockClear();
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
});
