import { create } from 'zustand';
import type { CharacterSyncMap, SyncTransportState } from '@/types/Sync';
import { createSyncStoreEffects } from '@/services/storeEffects/syncStoreEffects';

export interface SyncStore {
  syncByCharacter: CharacterSyncMap;
  loadSyncMeta: () => Promise<void>;
  ensureCharacterSync: (characterId: string, hasCloud?: boolean) => Promise<void>;
  setCloudAvailability: (characterId: string, hasCloud: boolean) => Promise<void>;
  markLocalDraft: (characterId: string, changedPath: string) => Promise<void>;
  markLocalDraftPaths: (characterId: string, changedPaths: string[]) => Promise<void>;
  markCloudUploaded: (characterId: string) => Promise<void>;
  markCloudDownloaded: (characterId: string) => Promise<void>;
  markConflict: (characterId: string, conflictPaths: string[]) => Promise<void>;
  clearConflicts: (characterId: string) => Promise<void>;
  setSyncTransport: (characterId: string, state: SyncTransportState, message?: string | null) => Promise<void>;
  markSyncError: (characterId: string, message: string) => Promise<void>;
  removeCharacterSync: (characterId: string) => Promise<void>;
}

const useSyncStore = create<SyncStore>((set, get) => {
  const effects = createSyncStoreEffects({ set, get });

  return {
    syncByCharacter: {},
    loadSyncMeta: effects.loadSyncMeta,
    ensureCharacterSync: effects.ensureCharacterSync,
    setCloudAvailability: effects.setCloudAvailability,
    markLocalDraft: effects.markLocalDraft,
    markLocalDraftPaths: effects.markLocalDraftPaths,
    markCloudUploaded: effects.markCloudUploaded,
    markCloudDownloaded: effects.markCloudDownloaded,
    markConflict: effects.markConflict,
    clearConflicts: effects.clearConflicts,
    setSyncTransport: effects.setSyncTransport,
    markSyncError: effects.markSyncError,
    removeCharacterSync: effects.removeCharacterSync,
  };
});

export default useSyncStore;
