import type { CharacterSyncMap, SyncTransportState } from '@/types/Sync';

export type SyncStoreActionsSlice = {
  loadSyncMeta: () => Promise<void>;
  ensureCharacterSync: (characterId: string, hasCloud?: boolean) => Promise<void>;
  setCloudAvailability: (characterId: string, hasCloud: boolean) => Promise<void>;
  markLocalDraftPaths: (characterId: string, changedPaths: string[]) => Promise<void>;
  markCloudUploaded: (characterId: string) => Promise<void>;
  markCloudDownloaded: (characterId: string) => Promise<void>;
  markConflict: (characterId: string, conflictPaths: string[]) => Promise<void>;
  clearConflicts: (characterId: string) => Promise<void>;
  setSyncTransport: (characterId: string, state: SyncTransportState, message?: string | null) => Promise<void>;
  markSyncError: (characterId: string, message: string) => Promise<void>;
  recordRemoteSyncState: (characterId: string, payload: { seenHistoryEntryIds: string[]; serverSyncAtMs?: number }) => Promise<void>;
};

export type SyncStoreSelectorState = {
  syncByCharacter: CharacterSyncMap;
} & SyncStoreActionsSlice;

export const selectSyncByCharacterId =
  (characterId: string | null | undefined) => (state: Pick<SyncStoreSelectorState, 'syncByCharacter'>) =>
    characterId ? state.syncByCharacter[characterId] : undefined;

export const selectSyncStoreActions = (state: SyncStoreActionsSlice) => ({
  loadSyncMeta: state.loadSyncMeta,
  ensureCharacterSync: state.ensureCharacterSync,
  setCloudAvailability: state.setCloudAvailability,
  markLocalDraftPaths: state.markLocalDraftPaths,
  markCloudUploaded: state.markCloudUploaded,
  markCloudDownloaded: state.markCloudDownloaded,
  markConflict: state.markConflict,
  clearConflicts: state.clearConflicts,
  setSyncTransport: state.setSyncTransport,
  markSyncError: state.markSyncError,
  recordRemoteSyncState: state.recordRemoteSyncState,
});
