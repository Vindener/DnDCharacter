import { beforeEach, describe, expect, it, vi } from 'vitest';

type FakeDoc = { id: string; data: Record<string, unknown> };

const { fixtures, firebaseMock } = vi.hoisted(() => {
  const fixturesMap = new Map<string, FakeDoc[]>();
  const key = (collection: string, field: string) => `${collection}:${field}`;

  const httpsCallableMock = vi.fn();

  const collectionMock = vi.fn((collection: string) => ({
    where: vi.fn((field: string, _op: string) => ({
      get: vi.fn(() =>
        Promise.resolve({
          docs: (fixturesMap.get(key(collection, field)) || []).map((doc) => ({
            id: doc.id,
            data: () => doc.data,
          })),
        }),
      ),
    })),
  }));

  return {
    fixtures: { map: fixturesMap, key },
    firebaseMock: {
      fbAuth: { currentUser: null as null | { uid: string } },
      db: { collection: collectionMock },
      fns: { httpsCallable: vi.fn(() => httpsCallableMock) },
      now: vi.fn(() => ({ seconds: 0 })),
      httpsCallableMock,
    },
  };
});

const { reauthenticateWithGoogleMock, getEditorsForSheetMock } = vi.hoisted(() => ({
  reauthenticateWithGoogleMock: vi.fn(),
  getEditorsForSheetMock: vi.fn(),
}));

vi.mock('@/services/firebase', () => firebaseMock);
vi.mock('@/shared/services/auth', () => ({ reauthenticateWithGoogle: reauthenticateWithGoogleMock }));
vi.mock('@/repositories/characterCloudRepository', () => ({ getEditorsForSheet: getEditorsForSheetMock }));

import { AccountDeletionError, buildTransferKey, previewAccountDeletion, requestAccountDeletion } from '@/services/accountDeletion';

function setFixture(collection: string, field: 'owners' | 'editors', docs: FakeDoc[]) {
  fixtures.map.set(fixtures.key(collection, field), docs);
}

describe('accountDeletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixtures.map.clear();
    firebaseMock.fbAuth.currentUser = { uid: 'me' };
  });

  describe('previewAccountDeletion', () => {
    it('throws when signed out', async () => {
      firebaseMock.fbAuth.currentUser = null;
      await expect(previewAccountDeletion()).rejects.toBeInstanceOf(AccountDeletionError);
    });

    it('marks a sole-owned sheet with no editors for deletion', async () => {
      setFixture('characterSheets', 'owners', [{ id: 'sheet-1', data: { name: 'Thorin', ownerUid: 'me', owners: ['me'], editors: [] } }]);
      setFixture('characterSheets', 'editors', []);
      setFixture('dmCampaigns', 'owners', []);
      setFixture('dmCampaigns', 'editors', []);
      setFixture('dmCampaignNotes', 'owners', []);
      setFixture('dmCampaignNotes', 'editors', []);

      const preview = await previewAccountDeletion();

      expect(preview.items).toHaveLength(1);
      expect(preview.items[0]).toMatchObject({ collection: 'characterSheets', id: 'sheet-1', label: 'Thorin' });
      expect(preview.items[0].action).toEqual({ type: 'delete' });
      expect(preview.needsOwnerChoice).toHaveLength(0);
    });

    it('resolves editor candidates and flags needsOwnerChoice when more than one editor exists', async () => {
      setFixture('characterSheets', 'owners', [
        {
          id: 'sheet-2',
          data: { name: 'Elora', ownerUid: 'me', owners: ['me'], editors: ['editorA', 'editorB'] },
        },
      ]);
      setFixture('characterSheets', 'editors', []);
      setFixture('dmCampaigns', 'owners', []);
      setFixture('dmCampaigns', 'editors', []);
      setFixture('dmCampaignNotes', 'owners', []);
      setFixture('dmCampaignNotes', 'editors', []);
      getEditorsForSheetMock.mockResolvedValueOnce([
        { uid: 'editorA', email: 'a@example.com' },
        { uid: 'editorB', email: 'b@example.com' },
      ]);

      const preview = await previewAccountDeletion();

      expect(preview.items[0].action).toEqual({ type: 'transferOwnership', newOwnerUid: 'editorA' });
      expect(preview.items[0].editorCandidates).toHaveLength(2);
      expect(preview.needsOwnerChoice).toHaveLength(1);
      expect(preview.needsOwnerChoice[0].id).toBe('sheet-2');
    });

    it('does not fetch editor candidates for a single-editor transfer', async () => {
      setFixture('characterSheets', 'owners', [
        { id: 'sheet-3', data: { name: 'Boros', ownerUid: 'me', owners: ['me'], editors: ['editorA'] } },
      ]);
      setFixture('characterSheets', 'editors', []);
      setFixture('dmCampaigns', 'owners', []);
      setFixture('dmCampaigns', 'editors', []);
      setFixture('dmCampaignNotes', 'owners', []);
      setFixture('dmCampaignNotes', 'editors', []);

      const preview = await previewAccountDeletion();

      expect(getEditorsForSheetMock).not.toHaveBeenCalled();
      expect(preview.items[0].editorCandidates).toBeUndefined();
      expect(preview.needsOwnerChoice).toHaveLength(0);
    });

    it('deduplicates a document appearing in both the owners and editors query results', async () => {
      const doc = { id: 'sheet-4', data: { name: 'Dup', ownerUid: 'me', owners: ['me'], editors: [] } };
      setFixture('characterSheets', 'owners', [doc]);
      setFixture('characterSheets', 'editors', [doc]);
      setFixture('dmCampaigns', 'owners', []);
      setFixture('dmCampaigns', 'editors', []);
      setFixture('dmCampaignNotes', 'owners', []);
      setFixture('dmCampaignNotes', 'editors', []);

      const preview = await previewAccountDeletion();

      expect(preview.items).toHaveLength(1);
    });
  });

  describe('requestAccountDeletion', () => {
    it('throws when signed out without attempting reauth', async () => {
      firebaseMock.fbAuth.currentUser = null;
      await expect(requestAccountDeletion()).rejects.toBeInstanceOf(AccountDeletionError);
      expect(reauthenticateWithGoogleMock).not.toHaveBeenCalled();
    });

    it('wraps a failed reauth in AccountDeletionError with code reauth-failed', async () => {
      reauthenticateWithGoogleMock.mockRejectedValueOnce(new Error('cancelled'));

      await expect(requestAccountDeletion()).rejects.toMatchObject({
        code: 'reauth-failed',
      });
      expect(firebaseMock.httpsCallableMock).not.toHaveBeenCalled();
    });

    it('calls the callable with transfer selections after a successful reauth', async () => {
      reauthenticateWithGoogleMock.mockResolvedValueOnce(undefined);
      firebaseMock.httpsCallableMock.mockResolvedValueOnce({ data: { status: 'success' } });

      const selections = { [buildTransferKey('characterSheets', 'sheet-2')]: 'editorB' };
      const result = await requestAccountDeletion(selections);

      expect(result).toEqual({ status: 'success' });
      expect(firebaseMock.httpsCallableMock).toHaveBeenCalledWith({ transferSelections: selections });
    });

    it('wraps a callable failure in AccountDeletionError using its code', async () => {
      reauthenticateWithGoogleMock.mockResolvedValueOnce(undefined);
      firebaseMock.httpsCallableMock.mockRejectedValueOnce({ code: 'internal', message: 'boom' });

      await expect(requestAccountDeletion()).rejects.toMatchObject({ code: 'internal', message: 'boom' });
    });
  });
});
