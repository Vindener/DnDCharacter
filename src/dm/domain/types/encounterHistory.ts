import type { EncounterDifficultyResult, EncounterPrepMonster, EncounterPrepPlayer } from './encounter';
import type { DMNoteSyncDisplayStatus } from './notes';

export type DMCampaignEncounterStatus = 'planned' | 'run' | 'archived';

export interface DMCampaignEncounterConflictRemote {
  label: string;
  players: EncounterPrepPlayer[];
  monsters: EncounterPrepMonster[];
  updatedAtMs: number;
}

export interface DMCampaignEncounter {
  schemaVersion?: number;
  id: string;
  campaignId: string;
  label: string;
  players: EncounterPrepPlayer[];
  monsters: EncounterPrepMonster[];
  difficulty: EncounterDifficultyResult | null;
  status: DMCampaignEncounterStatus;
  ownerUid: string;
  owners: string[];
  editors: string[];
  createdAtMs: number;
  updatedAtMs: number;
  baseUpdatedAtMs: number;
  syncStatus: DMNoteSyncDisplayStatus;
  conflictRemote?: DMCampaignEncounterConflictRemote;
}

export interface DMCampaignEncounterQueueItem {
  id: string;
  type: 'upsert' | 'delete';
  encounterId: string;
  campaignId: string;
  atMs: number;
}
