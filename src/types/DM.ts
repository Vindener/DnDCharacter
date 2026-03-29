export type DMNoteSyncDisplayStatus =
  | 'Local only'
  | 'Synced'
  | 'Pending sync'
  | 'Offline changes pending'
  | 'Conflict detected';

export interface DMCampaign {
  id: string;
  name: string;
  nameNormalized: string;
  ownerUid: string;
  owners: string[];
  editors: string[];
  createdAtMs: number;
  updatedAtMs: number;
}

export interface DMCampaignNoteConflictRemote {
  title: string;
  content: string;
  updatedAtMs: number;
}

export interface DMCampaignNote {
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

export interface EncounterPrepPlayer {
  id: string;
  characterId: string;
  name: string;
  level: number;
  initiativeMod: number;
  selected: boolean;
}

export interface EncounterPrepMonster {
  id: string;
  monsterId?: string;
  name: string;
  challenge: string;
  count: number;
  selected: boolean;
}

export interface EncounterPrepDraft {
  campaignId: string;
  players: EncounterPrepPlayer[];
  monsters: EncounterPrepMonster[];
}

export interface InitiativeSeedItem {
  id: string;
  name: string;
  roll: string;
  hits?: string;
}

export interface InitiativeSeed {
  source: 'dm-encounter-prep';
  campaignId: string;
  entries: InitiativeSeedItem[];
}
