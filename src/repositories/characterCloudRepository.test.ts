import { describe, expect, it, vi } from 'vitest';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';

const mocks = vi.hoisted(() => {
  const targetRef = {
    get: vi.fn(async () => ({ id: 'char-1', exists: false, data: () => null })),
    set: vi.fn(async () => {}),
  };
  const generatedRef = {
    id: 'generated-copy',
    set: vi.fn(async () => {}),
  };
  const doc = vi.fn((id?: string) => (id ? targetRef : generatedRef));

  return {
    targetRef,
    generatedRef,
    collection: vi.fn(() => ({ doc })),
    doc,
    fbAuth: { currentUser: { uid: 'user-1' } },
  };
});

vi.mock('@/services/firebase', () => ({
  db: {
    collection: mocks.collection,
  },
  fbAuth: mocks.fbAuth,
  now: () => 'server-now',
  hasDoc: (snap: { exists?: boolean } | null | undefined) => Boolean(snap?.exists),
}));

vi.mock('@/services/connections', () => ({
  ensureConnection: vi.fn(async () => {}),
}));

vi.mock('@/services/users', () => ({
  findUserByEmail: vi.fn(async () => null),
}));

import { upsertCharacterSheetFromLocal } from '@/repositories/characterCloudRepository';

describe('characterCloudRepository', () => {
  it('rejects failed upserts without creating a duplicate cloud document', async () => {
    mocks.targetRef.get.mockResolvedValueOnce({ id: 'char-1', exists: false, data: () => null });
    mocks.targetRef.set.mockRejectedValueOnce(new Error('permission denied'));

    await expect(upsertCharacterSheetFromLocal(createEmptyCharacter({ id: 'char-1', name: 'Test' }))).rejects.toThrow('permission denied');

    expect(mocks.doc).toHaveBeenCalledWith('char-1');
    expect(mocks.doc).not.toHaveBeenCalledWith();
    expect(mocks.generatedRef.set).not.toHaveBeenCalled();
  });
});
