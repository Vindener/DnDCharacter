import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DMCampaignNote, DMCampaignNoteQueueItem, DMNoteSyncDisplayStatus } from '@/dm/domain/types';
import { parseCampaignNote, parseCampaignNoteQueueItem } from '@/domain/schemas';
import { db, fbAuth, hasDoc, now } from '@/services/firebase';
import { ensureCampaignForName } from '@/dm/repositories/campaignRepository';
import { LATEST_SCHEMA_VERSION, createStorageEnvelope, migratePayloadToLatest, normalizeStorageEnvelope } from '@/domain/migrations';

const LOCAL_NOTES_KEY = 'DM_CAMPAIGN_NOTES_V1';
const LOCAL_QUEUE_KEY = 'DM_CAMPAIGN_NOTES_QUEUE_V1';
const LEGACY_NOTES_KEY = 'DM_NOTES_V2';
const LEGACY_NOTES_MIGRATION_FLAG = 'DM_NOTES_V2_MIGRATED_TO_CAMPAIGN_V1';

type LegacyDMNote = {
  id: string;
  title?: string;
  content?: string;
  campaign?: string;
  lastEdited?: number;
};

let legacyNotesMigrationPromise: Promise<void> | null = null;

function toMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const cast = value as { toMillis?: () => number; seconds?: number };
  if (typeof cast.toMillis === 'function') return cast.toMillis();
  if (typeof cast.seconds === 'number') return cast.seconds * 1000;
  return 0;
}

function sanitizeNote(raw: unknown): DMCampaignNote | null {
  const migrated = migratePayloadToLatest<Record<string, unknown>>('dmCampaignNotes', raw).data;
  if (!migrated || typeof migrated !== 'object' || Array.isArray(migrated)) return null;
  const cast = migrated as Record<string, unknown>;
  const id = String(cast.id || '');
  const campaignId = String(cast.campaignId || '');
  if (!id || !campaignId) return null;
  const parsed = parseCampaignNote(cast);
  return {
    ...parsed,
    schemaVersion: LATEST_SCHEMA_VERSION,
  };
}

function mapCloudNote(doc: Record<string, unknown>): DMCampaignNote | null {
  const migrated = migratePayloadToLatest<Record<string, unknown>>('dmCampaignNotes', doc).data;
  const id = String(migrated.id || '');
  const campaignId = String(migrated.campaignId || '');
  if (!id || !campaignId) return null;

  const owners = Array.isArray(migrated.owners) ? migrated.owners.map((item) => String(item)).filter(Boolean) : [];
  const editors = Array.isArray(migrated.editors) ? migrated.editors.map((item) => String(item)).filter(Boolean) : [];
  const updatedAtMs = toMillis(migrated.updatedAt) || Date.now();
  const createdAtMs = toMillis(migrated.createdAt) || updatedAtMs;

  return parseCampaignNote({
    schemaVersion: LATEST_SCHEMA_VERSION,
    id,
    campaignId,
    title: String(migrated.title || ''),
    content: String(migrated.content || ''),
    ownerUid: String(migrated.ownerUid || owners[0] || 'local'),
    owners,
    editors,
    createdAtMs,
    updatedAtMs,
    baseUpdatedAtMs: updatedAtMs,
    syncStatus: 'Synced',
  });
}

async function loadQueue(): Promise<DMCampaignNoteQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const migrated = normalizeStorageEnvelope<DMCampaignNoteQueueItem[]>('dmNotesQueue', parsed, []);
    if (!Array.isArray(migrated.data)) return [];
    return migrated.data.map((item) => parseCampaignNoteQueueItem(item)).filter((item): item is DMCampaignNoteQueueItem => Boolean(item));
  } catch {
    return [];
  }
}

async function persistQueue(queue: DMCampaignNoteQueueItem[]): Promise<void> {
  try {
    const envelope = createStorageEnvelope('dmNotesQueue', queue || []);
    await AsyncStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(envelope));
  } catch (_error) {
    /* intentionally ignored */
  }
}

async function enqueue(type: 'upsert' | 'delete', noteId: string, campaignId: string): Promise<void> {
  const queue = await loadQueue();
  const next = queue.filter((item) => item.noteId !== noteId);
  next.push({
    id: `${type}-${noteId}-${Date.now()}`,
    type,
    noteId,
    campaignId,
    atMs: Date.now(),
  });
  await persistQueue(next);
}

async function readLocalCampaignNotesFromStorage(): Promise<DMCampaignNote[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_NOTES_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const migrated = normalizeStorageEnvelope<DMCampaignNote[]>('dmCampaignNotes', parsed, []);
    if (!Array.isArray(migrated.data)) return [];
    return migrated.data
      .map((item) => sanitizeNote(item))
      .filter((item): item is DMCampaignNote => Boolean(item))
      .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  } catch {
    return [];
  }
}

async function ensureLegacyNotesMigrated(): Promise<void> {
  if (legacyNotesMigrationPromise) {
    await legacyNotesMigrationPromise;
    return;
  }

  legacyNotesMigrationPromise = (async () => {
    try {
      const migrationDone = await AsyncStorage.getItem(LEGACY_NOTES_MIGRATION_FLAG);
      if (migrationDone === '1') return;

      const rawLegacy = await AsyncStorage.getItem(LEGACY_NOTES_KEY);
      const parsedLegacy = JSON.parse(rawLegacy || '[]');
      if (!Array.isArray(parsedLegacy) || !parsedLegacy.length) {
        await AsyncStorage.setItem(LEGACY_NOTES_MIGRATION_FLAG, '1');
        return;
      }

      const existing = await readLocalCampaignNotesFromStorage();
      const byId = new Map(existing.map((note) => [note.id, note]));
      const me = fbAuth.currentUser?.uid || 'local';

      for (const entry of parsedLegacy as LegacyDMNote[]) {
        if (!entry || typeof entry !== 'object') continue;
        const rawId = String(entry.id || '').trim();
        if (!rawId) continue;

        const campaignName = String(entry.campaign || '').trim() || 'Базова кампанія';
        const campaign = await ensureCampaignForName(campaignName);
        if (!campaign) continue;

        const timestamp = Number(entry.lastEdited || 0) || Date.now();
        const migratedNote = parseCampaignNote({
          schemaVersion: LATEST_SCHEMA_VERSION,
          id: `legacy-${rawId}`,
          campaignId: campaign.id,
          title: String(entry.title || '').trim(),
          content: String(entry.content || ''),
          ownerUid: me,
          owners: me ? [me] : [],
          editors: [],
          createdAtMs: timestamp,
          updatedAtMs: timestamp,
          baseUpdatedAtMs: timestamp,
          syncStatus: fbAuth.currentUser ? 'Pending sync' : 'Local only',
        });
        byId.set(migratedNote.id, migratedNote);
      }

      await persistLocalCampaignNotes(Array.from(byId.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs));
      await AsyncStorage.removeItem(LEGACY_NOTES_KEY);
      await AsyncStorage.setItem(LEGACY_NOTES_MIGRATION_FLAG, '1');
    } catch {
      await AsyncStorage.setItem(LEGACY_NOTES_MIGRATION_FLAG, '1');
    }
  })();

  await legacyNotesMigrationPromise;
}

export async function loadLocalCampaignNotes(): Promise<DMCampaignNote[]> {
  await ensureLegacyNotesMigrated();
  return readLocalCampaignNotesFromStorage();
}

async function persistLocalCampaignNotes(notes: DMCampaignNote[]): Promise<void> {
  try {
    const canonical = (notes || []).map((note) => ({
      ...note,
      schemaVersion: LATEST_SCHEMA_VERSION,
    }));
    const envelope = createStorageEnvelope('dmCampaignNotes', canonical);
    await AsyncStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(envelope));
  } catch (_error) {
    /* intentionally ignored */
  }
}

function canSyncCloud(): boolean {
  return Boolean(fbAuth.currentUser?.uid);
}

async function replaceLocalNote(note: DMCampaignNote): Promise<DMCampaignNote[]> {
  const local = await loadLocalCampaignNotes();
  const next = [...local.filter((item) => item.id !== note.id), { ...note, schemaVersion: LATEST_SCHEMA_VERSION }].sort(
    (a, b) => b.updatedAtMs - a.updatedAtMs,
  );
  await persistLocalCampaignNotes(next);
  return next;
}

async function removeLocalNote(noteId: string): Promise<DMCampaignNote[]> {
  const local = await loadLocalCampaignNotes();
  const next = local.filter((item) => item.id !== noteId);
  await persistLocalCampaignNotes(next);
  return next;
}

function canAccessByRole(note: DMCampaignNote, uid: string): boolean {
  if (!uid) return false;
  if (note.ownerUid === uid) return true;
  if (note.owners.includes(uid)) return true;
  if (note.editors.includes(uid)) return true;
  return false;
}

function buildCloudPayload(note: DMCampaignNote, existing?: Record<string, unknown> | null): Record<string, unknown> {
  const me = fbAuth.currentUser?.uid || note.ownerUid;
  const owners =
    Array.isArray(existing?.owners) && existing?.owners.length ? (existing?.owners as string[]) : note.owners.length ? note.owners : [me];
  const editors = Array.isArray(existing?.editors) ? (existing?.editors as string[]) : note.editors || [];

  return {
    schemaVersion: LATEST_SCHEMA_VERSION,
    id: note.id,
    campaignId: note.campaignId,
    title: note.title,
    content: note.content,
    ownerUid: String(existing?.ownerUid || note.ownerUid || me),
    owners,
    editors,
    createdAt: existing?.createdAt || now(),
    updatedAt: now(),
  };
}

async function syncUpsert(note: DMCampaignNote): Promise<DMCampaignNote> {
  const ref = db.collection('dmCampaignNotes').doc(note.id);
  const snap = await ref.get();
  const exists = hasDoc(snap);
  const remote = exists ? ({ id: snap.id, ...(snap.data?.() || snap.data()) } as Record<string, unknown>) : null;
  const remoteNote = remote ? mapCloudNote(remote) : null;

  if (remoteNote && remoteNote.updatedAtMs > (note.baseUpdatedAtMs || 0) && note.syncStatus !== 'Conflict detected') {
    const conflictNote: DMCampaignNote = {
      ...note,
      schemaVersion: LATEST_SCHEMA_VERSION,
      syncStatus: 'Conflict detected',
      conflictRemote: {
        title: remoteNote.title,
        content: remoteNote.content,
        updatedAtMs: remoteNote.updatedAtMs,
      },
    };
    await replaceLocalNote(conflictNote);
    return conflictNote;
  }

  await ref.set(buildCloudPayload(note, remote), { merge: true });

  const syncedAt = Date.now();
  const synced: DMCampaignNote = {
    ...note,
    schemaVersion: LATEST_SCHEMA_VERSION,
    updatedAtMs: syncedAt,
    baseUpdatedAtMs: syncedAt,
    syncStatus: 'Synced',
    conflictRemote: undefined,
  };
  await replaceLocalNote(synced);
  return synced;
}

function mergeRemoteIntoLocal(local: DMCampaignNote[], remote: DMCampaignNote[]): DMCampaignNote[] {
  const byId = new Map<string, DMCampaignNote>();

  for (const note of local) {
    byId.set(note.id, note);
  }

  for (const remoteNote of remote) {
    const localNote = byId.get(remoteNote.id);
    if (!localNote) {
      byId.set(remoteNote.id, remoteNote);
      continue;
    }

    if (localNote.syncStatus === 'Conflict detected') {
      byId.set(remoteNote.id, localNote);
      continue;
    }

    if (
      (localNote.syncStatus === 'Pending sync' || localNote.syncStatus === 'Offline changes pending') &&
      remoteNote.updatedAtMs > (localNote.baseUpdatedAtMs || 0)
    ) {
      byId.set(remoteNote.id, {
        ...localNote,
        schemaVersion: LATEST_SCHEMA_VERSION,
        syncStatus: 'Conflict detected',
        conflictRemote: {
          title: remoteNote.title,
          content: remoteNote.content,
          updatedAtMs: remoteNote.updatedAtMs,
        },
      });
      continue;
    }

    if (remoteNote.updatedAtMs >= localNote.updatedAtMs) {
      byId.set(remoteNote.id, remoteNote);
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
}

export async function subscribeCampaignNotes(campaignId: string, cb: (notes: DMCampaignNote[]) => void): Promise<() => void> {
  const local = (await loadLocalCampaignNotes()).filter((note) => note.campaignId === campaignId);
  cb(local);

  const me = fbAuth.currentUser?.uid;
  if (!me) {
    return () => {};
  }

  const unsub = db
    .collection('dmCampaignNotes')
    .where('campaignId', '==', campaignId)
    .onSnapshot(
      async (snap) => {
        const remote: DMCampaignNote[] = [];
        snap?.forEach?.((doc) => {
          const mapped = mapCloudNote({ id: doc.id, ...(doc.data?.() || doc.data()) });
          if (mapped && canAccessByRole(mapped, me)) remote.push(mapped);
        });

        const allLocal = await loadLocalCampaignNotes();
        const campaignLocal = allLocal.filter((note) => note.campaignId === campaignId);
        const mergedCampaignNotes = mergeRemoteIntoLocal(campaignLocal, remote);
        const withoutCampaign = allLocal.filter((note) => note.campaignId !== campaignId);
        const nextAll = [...withoutCampaign, ...mergedCampaignNotes].sort((a, b) => b.updatedAtMs - a.updatedAtMs);

        await persistLocalCampaignNotes(nextAll);
        cb(mergedCampaignNotes);
      },
      () => {},
    );

  return () => {
    if (typeof unsub === 'function') unsub();
  };
}

function defaultSyncStatusForNote(): DMNoteSyncDisplayStatus {
  if (!canSyncCloud()) return 'Local only';
  return 'Pending sync';
}

export async function upsertCampaignNote(note: DMCampaignNote): Promise<DMCampaignNote> {
  const timestamp = Date.now();
  const me = fbAuth.currentUser?.uid || note.ownerUid || 'local';
  const normalized: DMCampaignNote = parseCampaignNote({
    ...note,
    schemaVersion: LATEST_SCHEMA_VERSION,
    title: note.title,
    content: note.content,
    ownerUid: note.ownerUid || me,
    owners: note.owners?.length ? note.owners : [me],
    editors: note.editors || [],
    createdAtMs: note.createdAtMs || timestamp,
    updatedAtMs: timestamp,
    baseUpdatedAtMs: note.baseUpdatedAtMs || timestamp,
    syncStatus: note.syncStatus === 'Conflict detected' ? 'Conflict detected' : defaultSyncStatusForNote(),
  });

  await replaceLocalNote(normalized);

  if (!canSyncCloud()) {
    return {
      ...normalized,
      schemaVersion: LATEST_SCHEMA_VERSION,
      syncStatus: 'Local only',
    };
  }

  try {
    const synced = await syncUpsert(normalized);
    const queue = await loadQueue();
    const nextQueue = queue.filter((item) => item.noteId !== normalized.id);
    await persistQueue(nextQueue);
    return synced;
  } catch {
    await enqueue('upsert', normalized.id, normalized.campaignId);
    const queued: DMCampaignNote = {
      ...normalized,
      schemaVersion: LATEST_SCHEMA_VERSION,
      syncStatus: 'Pending sync',
    };
    await replaceLocalNote(queued);
    return queued;
  }
}

export async function deleteCampaignNote(noteId: string, campaignId: string): Promise<void> {
  await removeLocalNote(noteId);

  if (!canSyncCloud()) return;

  try {
    await db.collection('dmCampaignNotes').doc(noteId).delete();
    const queue = await loadQueue();
    const nextQueue = queue.filter((item) => item.noteId !== noteId);
    await persistQueue(nextQueue);
  } catch {
    await enqueue('delete', noteId, campaignId);
  }
}

export async function flushCampaignNotesQueue(): Promise<void> {
  if (!canSyncCloud()) return;

  const queue = await loadQueue();
  if (!queue.length) return;

  let remaining = [...queue];
  const local = await loadLocalCampaignNotes();

  for (const item of queue) {
    try {
      if (item.type === 'delete') {
        await db.collection('dmCampaignNotes').doc(item.noteId).delete();
      } else {
        const note = local.find((entry) => entry.id === item.noteId);
        if (!note) {
          remaining = remaining.filter((entry) => entry.id !== item.id);
          continue;
        }
        await syncUpsert(note);
      }
      remaining = remaining.filter((entry) => entry.id !== item.id);
    } catch (_error) {
      /* intentionally ignored */
    }
  }

  await persistQueue(remaining);
}

export async function resolveCampaignNoteConflict(
  noteId: string,
  strategy: 'keep-local' | 'keep-cloud' | 'merge-manual',
  mergedContent?: string,
): Promise<DMCampaignNote | null> {
  const local = await loadLocalCampaignNotes();
  const note = local.find((item) => item.id === noteId);
  if (!note) return null;
  if (note.syncStatus !== 'Conflict detected' || !note.conflictRemote) return note;

  if (strategy === 'keep-cloud') {
    const resolved: DMCampaignNote = {
      ...note,
      schemaVersion: LATEST_SCHEMA_VERSION,
      title: note.conflictRemote.title,
      content: note.conflictRemote.content,
      updatedAtMs: note.conflictRemote.updatedAtMs,
      baseUpdatedAtMs: note.conflictRemote.updatedAtMs,
      syncStatus: canSyncCloud() ? 'Synced' : 'Local only',
      conflictRemote: undefined,
    };
    await replaceLocalNote(resolved);
    return resolved;
  }

  const localContent = strategy === 'merge-manual' ? String(mergedContent || note.content) : note.content;
  const resolved: DMCampaignNote = {
    ...note,
    schemaVersion: LATEST_SCHEMA_VERSION,
    content: localContent,
    baseUpdatedAtMs: note.conflictRemote.updatedAtMs,
    updatedAtMs: Date.now(),
    syncStatus: canSyncCloud() ? 'Pending sync' : 'Local only',
    conflictRemote: undefined,
  };

  await replaceLocalNote(resolved);

  if (canSyncCloud()) {
    try {
      const synced = await syncUpsert(resolved);
      const queue = await loadQueue();
      await persistQueue(queue.filter((entry) => entry.noteId !== resolved.id));
      return synced;
    } catch {
      await enqueue('upsert', resolved.id, resolved.campaignId);
      return resolved;
    }
  }

  return resolved;
}
