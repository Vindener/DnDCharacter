export type SyncStatus = 'local-only' | 'pending-upload' | 'pending-download' | 'in-sync' | 'conflict';
export type SyncTransportState = 'idle' | 'syncing' | 'uploading' | 'downloading' | 'synced' | 'error';

export interface CharacterSyncState {
  characterId: string;
  hasCloud: boolean;
  localRevision: number;
  cloudRevision: number;
  lastLocalChangeAt: number | null;
  // Server time (characterSheets.lastChangeAt) of the last remote snapshot this device has
  // processed — not the local device clock (COL-5: cross-device clock comparison bug).
  lastSyncAt: number | null;
  pendingPaths: string[];
  conflictPaths: string[];
  status: SyncStatus;
  transportState: SyncTransportState;
  transportMessage: string | null;
  lastSyncError: string | null;
  lastSyncAttemptAt: number | null;
  // changeHistory[].id values already accounted for in remotePathsSinceLastSync — clock-independent.
  seenHistoryEntryIds?: string[];
}

export type CharacterSyncMap = Record<string, CharacterSyncState>;
