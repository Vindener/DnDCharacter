import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CharacterSyncMap, SyncTransportState } from '@/types/Sync';
import { applySyncTransition, normalizeSyncMap, type SyncTransition } from '@/services/characterSyncCoordinator';

interface SyncStore {
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

const STORAGE_KEY = 'CHARACTER_SYNC_META_V1';

async function persistSyncMap(map: CharacterSyncMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

const useSyncStore = create<SyncStore>((set, get) => {
  const applyAndPersist = async (transition: SyncTransition): Promise<void> => {
    const prevMap = get().syncByCharacter;
    const result = applySyncTransition(prevMap, transition);
    if (result.map === prevMap) return;

    set({ syncByCharacter: result.map });
    await persistSyncMap(result.map);
  };

  return {
    syncByCharacter: {},

    loadSyncMeta: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = JSON.parse(raw || '{}');
        set({ syncByCharacter: normalizeSyncMap(parsed) });
      } catch {}
    },

    ensureCharacterSync: async (characterId, hasCloud = false) => {
      await applyAndPersist({ type: 'ensure', characterId, hasCloud });
    },

    setCloudAvailability: async (characterId, hasCloud) => {
      await applyAndPersist({ type: 'set-cloud-availability', characterId, hasCloud });
    },

    markLocalDraft: async (characterId, changedPath) => {
      await applyAndPersist({ type: 'mark-local-draft-paths', characterId, changedPaths: [changedPath] });
    },

    markLocalDraftPaths: async (characterId, changedPaths) => {
      await applyAndPersist({ type: 'mark-local-draft-paths', characterId, changedPaths });
    },

    markCloudUploaded: async (characterId) => {
      await applyAndPersist({ type: 'mark-cloud-uploaded', characterId });
    },

    markCloudDownloaded: async (characterId) => {
      await applyAndPersist({ type: 'mark-cloud-downloaded', characterId });
    },

    markConflict: async (characterId, conflictPaths) => {
      await applyAndPersist({ type: 'mark-conflict', characterId, conflictPaths });
    },

    clearConflicts: async (characterId) => {
      await applyAndPersist({ type: 'clear-conflicts', characterId });
    },

    setSyncTransport: async (characterId, state, message = null) => {
      await applyAndPersist({ type: 'set-transport', characterId, state, message });
    },

    markSyncError: async (characterId, message) => {
      await applyAndPersist({ type: 'mark-sync-error', characterId, message });
    },

    removeCharacterSync: async (characterId) => {
      await applyAndPersist({ type: 'remove-character', characterId });
    },
  };
});

export default useSyncStore;
