export type SyncStatus = 'local-only' | 'pending-upload' | 'pending-download' | 'in-sync' | 'conflict';

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
}

export type CharacterSyncMap = Record<string, CharacterSyncState>;
