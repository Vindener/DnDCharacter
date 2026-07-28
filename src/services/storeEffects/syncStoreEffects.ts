import AsyncStorage from '@react-native-async-storage/async-storage';
import { applySyncTransition, normalizeSyncMap, type SyncTransition } from '@/services/characterSyncCoordinator';
import type { SyncStore } from '@/stores/syncStore';

type SetSyncStore = (partial: Partial<SyncStore> | ((state: SyncStore) => Partial<SyncStore>)) => void;

type SyncStoreContext = {
  set: SetSyncStore;
  get: () => SyncStore;
};

type SyncStoreEffects = Pick<
  SyncStore,
  | 'loadSyncMeta'
  | 'ensureCharacterSync'
  | 'setCloudAvailability'
  | 'markLocalDraft'
  | 'markLocalDraftPaths'
  | 'markCloudUploaded'
  | 'markCloudDownloaded'
  | 'markConflict'
  | 'clearConflicts'
  | 'setSyncTransport'
  | 'markSyncError'
  | 'removeCharacterSync'
  | 'recordRemoteSyncState'
>;

const STORAGE_KEY = 'CHARACTER_SYNC_META_V1';

async function persistSyncMap(map: SyncStore['syncByCharacter']): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (_error) {
    /* intentionally ignored */
  }
}

export function createSyncStoreEffects({ set, get }: SyncStoreContext): SyncStoreEffects {
  const applyAndPersist = async (transition: SyncTransition): Promise<void> => {
    const prevMap = get().syncByCharacter;
    const result = applySyncTransition(prevMap, transition);
    if (result.map === prevMap) return;

    set({ syncByCharacter: result.map });
    await persistSyncMap(result.map);
  };

  return {
    loadSyncMeta: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = JSON.parse(raw || '{}');
        set({ syncByCharacter: normalizeSyncMap(parsed) });
      } catch (_error) {
        /* intentionally ignored */
      }
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

    recordRemoteSyncState: async (characterId, payload) => {
      await applyAndPersist({ type: 'record-remote-sync-state', characterId, ...payload });
    },
  };
}
