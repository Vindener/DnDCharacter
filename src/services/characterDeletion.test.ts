import { describe, expect, it, vi } from 'vitest';
import { deleteCharacterCopies } from '@/services/characterDeletion';

describe('deleteCharacterCopies', () => {
  it('deletes only the local copy when cloud deletion is not requested', async () => {
    const deleteCloudCopy = vi.fn(async () => {});
    const deleteLocalCopy = vi.fn(async () => {});

    await deleteCharacterCopies({
      characterId: 'character-1',
      deleteCloud: false,
      deleteCloudCopy,
      deleteLocalCopy,
    });

    expect(deleteCloudCopy).not.toHaveBeenCalled();
    expect(deleteLocalCopy).toHaveBeenCalledWith('character-1');
  });

  it('deletes the cloud copy before the local copy', async () => {
    const calls: string[] = [];
    const deleteCloudCopy = vi.fn(async () => {
      calls.push('cloud');
    });
    const deleteLocalCopy = vi.fn(async () => {
      calls.push('local');
    });

    await deleteCharacterCopies({
      characterId: 'character-1',
      deleteCloud: true,
      deleteCloudCopy,
      deleteLocalCopy,
    });

    expect(calls).toEqual(['cloud', 'local']);
  });

  it('keeps the local copy when cloud deletion fails', async () => {
    const deleteCloudCopy = vi.fn(async () => {
      throw new Error('permission-denied');
    });
    const deleteLocalCopy = vi.fn(async () => {});

    await expect(
      deleteCharacterCopies({
        characterId: 'character-1',
        deleteCloud: true,
        deleteCloudCopy,
        deleteLocalCopy,
      }),
    ).rejects.toThrow('permission-denied');

    expect(deleteLocalCopy).not.toHaveBeenCalled();
  });
});
