import { describe, expect, it } from 'vitest';
import { buildConflictRemote, hasConflict, NOTE_SYNC_STATUS } from '@/dm/domain/notes';
import type { DMCampaignNote } from '@/dm/domain/types';

const baseNote: DMCampaignNote = {
  id: 'note-1',
  campaignId: 'campaign-1',
  title: 'Note',
  content: 'Text',
  ownerUid: 'u-1',
  owners: ['u-1'],
  editors: [],
  createdAtMs: 1,
  updatedAtMs: 1,
  baseUpdatedAtMs: 1,
  syncStatus: 'Synced',
};

describe('dm/domain/notes/conflict', () => {
  it('exports all note sync statuses', () => {
    expect(NOTE_SYNC_STATUS).toEqual([
      'Local only',
      'Synced',
      'Pending sync',
      'Offline changes pending',
      'Conflict detected',
    ]);
  });

  it('detects only true conflict payloads', () => {
    expect(hasConflict(baseNote)).toBe(false);
    expect(hasConflict({ ...baseNote, syncStatus: 'Conflict detected' })).toBe(false);
    expect(hasConflict({
      ...baseNote,
      syncStatus: 'Conflict detected',
      conflictRemote: { title: 'Remote', content: 'Body', updatedAtMs: 50 },
    })).toBe(true);
  });

  it('normalizes conflict remote payload', () => {
    const remote = buildConflictRemote('  Remote  ', ' body ', Number.NaN);
    expect(remote.title).toBe('Remote');
    expect(remote.content).toBe(' body ');
    expect(remote.updatedAtMs).toBeTypeOf('number');
    expect(remote.updatedAtMs).toBeGreaterThan(0);
  });
});
