import type { DMCampaignNote, DMCampaignNoteConflictRemote, DMNoteSyncDisplayStatus } from '@/dm/domain/types';

export const NOTE_SYNC_STATUS: DMNoteSyncDisplayStatus[] = [
  'Local only',
  'Synced',
  'Pending sync',
  'Offline changes pending',
  'Conflict detected',
];

export function hasConflict(note: DMCampaignNote): boolean {
  return note.syncStatus === 'Conflict detected' && Boolean(note.conflictRemote);
}

export function buildConflictRemote(title: string, content: string, updatedAtMs: number): DMCampaignNoteConflictRemote {
  return {
    title: String(title || '').trim(),
    content: String(content || ''),
    updatedAtMs: Number.isFinite(Number(updatedAtMs)) ? Number(updatedAtMs) : Date.now(),
  };
}

