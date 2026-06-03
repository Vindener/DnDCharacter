export type DMNoteSyncDisplayStatus =
  | 'Local only'
  | 'Synced'
  | 'Pending sync'
  | 'Offline changes pending'
  | 'Conflict detected';

export interface DMCampaignNoteConflictRemote {
  title: string;
  content: string;
  updatedAtMs: number;
}

export interface DMCampaignNote {
  schemaVersion?: number;
  id: string;
  campaignId: string;
  title: string;
  content: string;
  ownerUid: string;
  owners: string[];
  editors: string[];
  createdAtMs: number;
  updatedAtMs: number;
  baseUpdatedAtMs: number;
  syncStatus: DMNoteSyncDisplayStatus;
  conflictRemote?: DMCampaignNoteConflictRemote;
}

export interface DMCampaignNoteQueueItem {
  id: string;
  type: 'upsert' | 'delete';
  noteId: string;
  campaignId: string;
  atMs: number;
}

export interface DMCampaignNoteSyncState {
  byNoteId: Record<
    string,
    {
      syncStatus: DMNoteSyncDisplayStatus;
      lastSyncAtMs: number | null;
      lastError: string | null;
    }
  >;
  queue: DMCampaignNoteQueueItem[];
}
