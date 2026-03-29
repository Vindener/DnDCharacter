export type SyncStatus = 'local-only' | 'pending-upload' | 'pending-download' | 'in-sync' | 'conflict';
export type SyncTransportState = 'idle' | 'syncing' | 'uploading' | 'downloading' | 'synced' | 'error';

export interface CharacterSyncState {
  characterId: string;
  hasCloud: boolean;
  localRevision: number;
  cloudRevision: number;
  lastLocalChangeAt: number | null;
  lastSyncAt: number | null;
  pendingPaths: string[];
  conflictPaths: string[];
  status: SyncStatus;
  transportState: SyncTransportState;
  transportMessage: string | null;
  lastSyncError: string | null;
  lastSyncAttemptAt: number | null;
}

export type CharacterSyncMap = Record<string, CharacterSyncState>;
