import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  DMCampaignNote,
  DMCampaignNoteQueueItem,
  DMCampaignNoteConflictRemote,
  DMNoteSyncDisplayStatus,
} from '@/types/DM';
import { db, fbAuth, hasDoc, now } from '@/services/firebase';

const LOCAL_NOTES_KEY = 'DM_CAMPAIGN_NOTES_V1';
const LOCAL_QUEUE_KEY = 'DM_CAMPAIGN_NOTES_QUEUE_V1';

function toMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const cast = value as { toMillis?: () => number; seconds?: number };
  if (typeof cast.toMillis === 'function') return cast.toMillis();
  if (typeof cast.seconds === 'number') return cast.seconds * 1000;
  return 0;
}

function sanitizeSyncStatus(value: unknown): DMNoteSyncDisplayStatus {
  if (
    value === 'Local only' ||
    value === 'Synced' ||
    value === 'Pending sync' ||
    value === 'Offline changes pending' ||
    value === 'Conflict detected'
  ) {
    return value;
  }
  return 'Local only';
}

function sanitizeConflictRemote(value: unknown): DMCampaignNoteConflictRemote | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const cast = value as Record<string, unknown>;
  const title = String(cast.title || '');
  const content = String(cast.content || '');
  const updatedAtMs = Number(cast.updatedAtMs || 0);
  if (!title && !content) return undefined;
  return {
    title,
    content,
    updatedAtMs: updatedAtMs || Date.now(),
  };
}

function sanitizeNote(raw: unknown): DMCampaignNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const cast = raw as Record<string, unknown>;
  const id = String(cast.id || '');
  const campaignId = String(cast.campaignId || '');
  if (!id || !campaignId) return null;

  const owners = Array.isArray(cast.owners) ? cast.owners.map((item) => String(item)).filter(Boolean) : [];
  const editors = Array.isArray(cast.editors) ? cast.editors.map((item) => String(item)).filter(Boolean) : [];

  return {
    id,
    campaignId,
    title: String(cast.title || ''),
    content: String(cast.content || ''),
    ownerUid: String(cast.ownerUid || owners[0] || 'local'),
    owners,
    editors,
    createdAtMs: Number(cast.createdAtMs || 0),
    updatedAtMs: Number(cast.updatedAtMs || 0),
    baseUpdatedAtMs: Number(cast.baseUpdatedAtMs || 0),
    syncStatus: sanitizeSyncStatus(cast.syncStatus),
    conflictRemote: sanitizeConflictRemote(cast.conflictRemote),
  };
}

function mapCloudNote(doc: Record<string, unknown>): DMCampaignNote | null {
  const id = String(doc.id || '');
  const campaignId = String(doc.campaignId || '');
  if (!id || !campaignId) return null;

  const owners = Array.isArray(doc.owners) ? doc.owners.map((item) => String(item)).filter(Boolean) : [];
  const editors = Array.isArray(doc.editors) ? doc.editors.map((item) => String(item)).filter(Boolean) : [];
  const updatedAtMs = toMillis(doc.updatedAt) || Date.now();
  const createdAtMs = toMillis(doc.createdAt) || updatedAtMs;

  return {
    id,
    campaignId,
    title: String(doc.title || ''),
    content: String(doc.content || ''),
    ownerUid: String(doc.ownerUid || owners[0] || 'local'),
    owners,
    editors,
    createdAtMs,
    updatedAtMs,
    baseUpdatedAtMs: updatedAtMs,
    syncStatus: 'Synced',
  };
}

async function loadQueue(): Promise<DMCampaignNoteQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_QUEUE_KEY);
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const cast = item as Record<string, unknown>;
        const id = String(cast.id || '');
        const type = cast.type === 'delete' ? 'delete' : cast.type === 'upsert' ? 'upsert' : null;
        const noteId = String(cast.noteId || '');
        const campaignId = String(cast.campaignId || '');
        const atMs = Number(cast.atMs || 0) || Date.now();
        if (!id || !type || !noteId || !campaignId) return null;
        return { id, type, noteId, campaignId, atMs };
      })
      .filter((item): item is DMCampaignNoteQueueItem => Boolean(item));
  } catch {
    return [];
  }
}

async function persistQueue(queue: DMCampaignNoteQueueItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
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

export async function loadLocalCampaignNotes(): Promise<DMCampaignNote[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_NOTES_KEY);
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizeNote(item))
      .filter((item): item is DMCampaignNote => Boolean(item))
      .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  } catch {
    return [];
  }
}

async function persistLocalCampaignNotes(notes: DMCampaignNote[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
  } catch {}
}

function canSyncCloud(): boolean {
  return Boolean(fbAuth.currentUser?.uid);
}

async function replaceLocalNote(note: DMCampaignNote): Promise<DMCampaignNote[]> {
  const local = await loadLocalCampaignNotes();
  const next = [...local.filter((item) => item.id !== note.id), note].sort((a, b) => b.updatedAtMs - a.updatedAtMs);
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
  const owners = Array.isArray(existing?.owners) && existing?.owners.length
    ? (existing?.owners as string[])
    : note.owners.length
      ? note.owners
      : [me];
  const editors = Array.isArray(existing?.editors) ? (existing?.editors as string[]) : note.editors || [];

  return {
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
  const normalized: DMCampaignNote = {
    ...note,
    title: String(note.title || '').trim(),
    content: String(note.content || ''),
    ownerUid: note.ownerUid || me,
    owners: note.owners?.length ? note.owners : [me],
    editors: note.editors || [],
    createdAtMs: note.createdAtMs || timestamp,
    updatedAtMs: timestamp,
    baseUpdatedAtMs: note.baseUpdatedAtMs || timestamp,
    syncStatus: note.syncStatus === 'Conflict detected' ? 'Conflict detected' : defaultSyncStatusForNote(),
  };

  await replaceLocalNote(normalized);

  if (!canSyncCloud()) {
    return {
      ...normalized,
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
    } catch {}
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
