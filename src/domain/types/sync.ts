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
  // COL-9: ids of changes-subcollection entries already accounted for in
  // remotePathsSinceLastSync — clock-independent. Was changeHistory[].id before the
  // subcollection migration; the deprecated array field is no longer the source.
  seenHistoryEntryIds?: string[];
  // COL-4: last-known-synced value for each delta/counter field this device has observed
  // (hp.current, hp.temp, deathSaves.successes/failures, spells.spellSlots.<level>.used,
  // customResources.<id>.current, customTrackers.<id>.current). Used to compute the delta
  // sent as FieldValue.increment() instead of overwriting with an absolute value, so two
  // clients' concurrent counter edits both land instead of one clobbering the other. See
  // docs/collaborative-editing.md and CLAUDE.md "Виняток 3".
  counterBaseline: Record<string, number>;
  // Same idea as counterBaseline, but for the `conditions` set (arrayUnion/arrayRemove
  // instead of increment).
  conditionsBaseline: string[];
}

export type CharacterSyncMap = Record<string, CharacterSyncState>;
