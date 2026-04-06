import { z } from 'zod';
import type {
  DMCampaignNote,
  DMCampaignNoteConflictRemote,
  DMCampaignNoteQueueItem,
  DMNoteSyncDisplayStatus,
} from '@/domain/types';
import { asRecord, safeParseWithIssues, toNumber, toString, toStringArray, toTrimmedString } from './utils';

export const NOTE_SYNC_STATUS: DMNoteSyncDisplayStatus[] = [
  'Local only',
  'Synced',
  'Pending sync',
  'Offline changes pending',
  'Conflict detected',
];

function selectSyncStatus(value: unknown): DMNoteSyncDisplayStatus {
  const raw = toTrimmedString(value);
  if (NOTE_SYNC_STATUS.includes(raw as DMNoteSyncDisplayStatus)) return raw as DMNoteSyncDisplayStatus;
  return 'Local only';
}

function parseConflictRemote(raw: unknown): DMCampaignNoteConflictRemote | undefined {
  const cast = asRecord(raw);
  const title = toString(cast.title, '');
  const content = toString(cast.content, '');
  const updatedAtMs = toNumber(cast.updatedAtMs, Date.now());
  if (!title && !content) return undefined;
  return {
    title,
    content,
    updatedAtMs,
  };
}

function normalizeCampaignNotePayload(raw: unknown): DMCampaignNote {
  const cast = asRecord(raw);
  const now = Date.now();
  const owners = toStringArray(cast.owners, { dedupe: true });
  const me = toTrimmedString(cast.ownerUid) || owners[0] || 'local';

  return {
    id: toTrimmedString(cast.id) || `note-${now}`,
    campaignId: toTrimmedString(cast.campaignId),
    title: toString(cast.title, '').trim(),
    content: toString(cast.content, ''),
    ownerUid: me,
    owners: owners.length ? owners : [me],
    editors: toStringArray(cast.editors, { dedupe: true }),
    createdAtMs: toNumber(cast.createdAtMs, now),
    updatedAtMs: toNumber(cast.updatedAtMs, now),
    baseUpdatedAtMs: toNumber(cast.baseUpdatedAtMs, toNumber(cast.updatedAtMs, now)),
    syncStatus: selectSyncStatus(cast.syncStatus),
    conflictRemote: parseConflictRemote(cast.conflictRemote),
  };
}

function parseQueueItem(raw: unknown): DMCampaignNoteQueueItem | null {
  const cast = asRecord(raw);
  const type = toTrimmedString(cast.type);
  if (type !== 'upsert' && type !== 'delete') return null;

  const noteId = toTrimmedString(cast.noteId);
  const campaignId = toTrimmedString(cast.campaignId);
  if (!noteId || !campaignId) return null;

  return {
    id: toTrimmedString(cast.id) || `${type}-${noteId}-${Date.now()}`,
    type,
    noteId,
    campaignId,
    atMs: toNumber(cast.atMs, Date.now()),
  };
}

export const campaignNoteConflictRemoteSchema: z.ZodType<DMCampaignNoteConflictRemote | undefined> = z
  .any()
  .transform((value) => parseConflictRemote(value));

export const campaignNoteSchema: z.ZodType<DMCampaignNote> = z.any().transform((value) => normalizeCampaignNotePayload(value));

export const campaignNoteQueueItemSchema: z.ZodType<DMCampaignNoteQueueItem | null> = z
  .any()
  .transform((value) => parseQueueItem(value));

export const campaignNoteFormSchema = z
  .any()
  .transform((value) => {
    const cast = asRecord(value);
    const title = toString(cast.title, '').trim();
    const content = toString(cast.content, '').trim();
    return {
      title,
      content,
    };
  })
  .superRefine((value, ctx) => {
    if (!value.title && !value.content) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'Заповніть заголовок або вміст нотатки.',
      });
    }
  });

export function parseCampaignNoteConflictRemote(value: unknown): DMCampaignNoteConflictRemote | undefined {
  return campaignNoteConflictRemoteSchema.parse(value);
}

export function parseCampaignNote(value: unknown): DMCampaignNote {
  return campaignNoteSchema.parse(value);
}

export function parseCampaignNoteQueueItem(value: unknown): DMCampaignNoteQueueItem | null {
  return campaignNoteQueueItemSchema.parse(value);
}

export function parseCampaignNoteFormInput(value: unknown): { title: string; content: string } {
  return campaignNoteFormSchema.parse(value);
}

export function safeParseCampaignNote(value: unknown) {
  return safeParseWithIssues(campaignNoteSchema, value);
}

export function safeParseCampaignNoteFormInput(value: unknown) {
  return safeParseWithIssues(campaignNoteFormSchema, value);
}

export function normalizeCampaignNote(value: unknown): DMCampaignNote {
  return parseCampaignNote(value);
}

