import { describe, expect, it } from 'vitest';
import { parseCampaignNote, parseCampaignNoteQueueItem, safeParseCampaignNoteFormInput } from '@/domain/schemas';
import { LATEST_SCHEMA_VERSION } from '@/domain/migrations';

describe('campaignNote.schema', () => {
  it('normalizes note payload and sync status', () => {
    const parsed = parseCampaignNote({
      id: 'note-1',
      campaignId: 'campaign-1',
      title: ' Session ',
      content: 'Body',
      ownerUid: 'u-1',
      owners: ['u-1'],
      editors: ['u-2'],
      syncStatus: 'invalid-status',
    });

    expect(parsed.id).toBe('note-1');
    expect(parsed.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(parsed.campaignId).toBe('campaign-1');
    expect(parsed.title).toBe('Session');
    expect(parsed.syncStatus).toBe('Local only');
  });

  it('defaults kind to note for old documents that predate the field', () => {
    const parsed = parseCampaignNote({
      id: 'note-legacy',
      campaignId: 'campaign-1',
      title: 'Old note',
      content: 'Written before kind existed',
      ownerUid: 'u-1',
      owners: ['u-1'],
      editors: [],
    });

    expect(parsed.kind).toBe('note');
  });

  it('falls back to note for an unrecognized kind instead of throwing', () => {
    const parsed = parseCampaignNote({
      id: 'note-2',
      campaignId: 'campaign-1',
      title: 'Weird kind',
      content: 'Body',
      ownerUid: 'u-1',
      owners: ['u-1'],
      editors: [],
      kind: 'not-a-real-kind',
    });

    expect(parsed.kind).toBe('note');
  });

  it('preserves a valid session/loot kind', () => {
    const session = parseCampaignNote({
      id: 'note-3',
      campaignId: 'campaign-1',
      title: 'Session',
      content: '',
      ownerUid: 'u-1',
      owners: ['u-1'],
      editors: [],
      kind: 'session',
    });
    const loot = parseCampaignNote({
      id: 'note-4',
      campaignId: 'campaign-1',
      title: 'Loot',
      content: '',
      ownerUid: 'u-1',
      owners: ['u-1'],
      editors: [],
      kind: 'loot',
    });

    expect(session.kind).toBe('session');
    expect(loot.kind).toBe('loot');
  });

  it('parses queue item and rejects invalid type', () => {
    const valid = parseCampaignNoteQueueItem({
      id: 'q-1',
      type: 'upsert',
      noteId: 'note-1',
      campaignId: 'campaign-1',
      atMs: 1,
    });
    const invalid = parseCampaignNoteQueueItem({
      id: 'q-2',
      type: 'unknown',
      noteId: 'note-2',
      campaignId: 'campaign-1',
      atMs: 1,
    });

    expect(valid?.type).toBe('upsert');
    expect(invalid).toBeNull();
  });

  it('validates note form input', () => {
    const result = safeParseCampaignNoteFormInput({ title: '   ', content: '   ' });
    expect(result.ok).toBe(false);
  });
});
