import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DMCampaignEncounter, DMCampaignEncounterQueueItem, DMNoteSyncDisplayStatus } from '@/dm/domain/types';
import { parseCampaignEncounter, parseCampaignEncounterQueueItem } from '@/domain/schemas';
import { db, fbAuth, hasDoc, now } from '@/services/firebase';
import { LATEST_SCHEMA_VERSION, createStorageEnvelope, migratePayloadToLatest, normalizeStorageEnvelope } from '@/domain/migrations';

const LOCAL_ENCOUNTERS_KEY = 'DM_CAMPAIGN_ENCOUNTERS_V1';
const LOCAL_QUEUE_KEY = 'DM_CAMPAIGN_ENCOUNTERS_QUEUE_V1';

function toMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const cast = value as { toMillis?: () => number; seconds?: number };
  if (typeof cast.toMillis === 'function') return cast.toMillis();
  if (typeof cast.seconds === 'number') return cast.seconds * 1000;
  return 0;
}

function sanitizeEncounter(raw: unknown): DMCampaignEncounter | null {
  const migrated = migratePayloadToLatest<Record<string, unknown>>('dmCampaignEncounters', raw).data;
  if (!migrated || typeof migrated !== 'object' || Array.isArray(migrated)) return null;
  const cast = migrated as Record<string, unknown>;
  const id = String(cast.id || '');
  const campaignId = String(cast.campaignId || '');
  if (!id || !campaignId) return null;
  const parsed = parseCampaignEncounter(cast);
  return {
    ...parsed,
    schemaVersion: LATEST_SCHEMA_VERSION,
  };
}

function mapCloudEncounter(doc: Record<string, unknown>): DMCampaignEncounter | null {
  const migrated = migratePayloadToLatest<Record<string, unknown>>('dmCampaignEncounters', doc).data;
  const id = String(migrated.id || '');
  const campaignId = String(migrated.campaignId || '');
  if (!id || !campaignId) return null;

  const owners = Array.isArray(migrated.owners) ? migrated.owners.map((item) => String(item)).filter(Boolean) : [];
  const editors = Array.isArray(migrated.editors) ? migrated.editors.map((item) => String(item)).filter(Boolean) : [];
  const updatedAtMs = toMillis(migrated.updatedAt) || Date.now();
  const createdAtMs = toMillis(migrated.createdAt) || updatedAtMs;

  return parseCampaignEncounter({
    schemaVersion: LATEST_SCHEMA_VERSION,
    id,
    campaignId,
    label: migrated.label,
    players: migrated.players,
    monsters: migrated.monsters,
    difficulty: migrated.difficulty,
    status: migrated.status,
    ownerUid: String(migrated.ownerUid || owners[0] || 'local'),
    owners,
    editors,
    createdAtMs,
    updatedAtMs,
    baseUpdatedAtMs: updatedAtMs,
    syncStatus: 'Synced',
  });
}

async function loadQueue(): Promise<DMCampaignEncounterQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const migrated = normalizeStorageEnvelope<DMCampaignEncounterQueueItem[]>('dmCampaignEncountersQueue', parsed, []);
    if (!Array.isArray(migrated.data)) return [];
    return migrated.data
      .map((item) => parseCampaignEncounterQueueItem(item))
      .filter((item): item is DMCampaignEncounterQueueItem => Boolean(item));
  } catch {
    return [];
  }
}

async function persistQueue(queue: DMCampaignEncounterQueueItem[]): Promise<void> {
  try {
    const envelope = createStorageEnvelope('dmCampaignEncountersQueue', queue || []);
    await AsyncStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(envelope));
  } catch (_error) {
    /* intentionally ignored */
  }
}

async function enqueue(type: 'upsert' | 'delete', encounterId: string, campaignId: string): Promise<void> {
  const queue = await loadQueue();
  const next = queue.filter((item) => item.encounterId !== encounterId);
  next.push({
    id: `${type}-${encounterId}-${Date.now()}`,
    type,
    encounterId,
    campaignId,
    atMs: Date.now(),
  });
  await persistQueue(next);
}

export async function loadLocalCampaignEncounters(): Promise<DMCampaignEncounter[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ENCOUNTERS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const migrated = normalizeStorageEnvelope<DMCampaignEncounter[]>('dmCampaignEncounters', parsed, []);
    if (!Array.isArray(migrated.data)) return [];
    return migrated.data
      .map((item) => sanitizeEncounter(item))
      .filter((item): item is DMCampaignEncounter => Boolean(item))
      .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  } catch {
    return [];
  }
}

async function persistLocalCampaignEncounters(encounters: DMCampaignEncounter[]): Promise<void> {
  try {
    const canonical = (encounters || []).map((encounter) => ({
      ...encounter,
      schemaVersion: LATEST_SCHEMA_VERSION,
    }));
    const envelope = createStorageEnvelope('dmCampaignEncounters', canonical);
    await AsyncStorage.setItem(LOCAL_ENCOUNTERS_KEY, JSON.stringify(envelope));
  } catch (_error) {
    /* intentionally ignored */
  }
}

function canSyncCloud(): boolean {
  return Boolean(fbAuth.currentUser?.uid);
}

async function replaceLocalEncounter(encounter: DMCampaignEncounter): Promise<DMCampaignEncounter[]> {
  const local = await loadLocalCampaignEncounters();
  const next = [...local.filter((item) => item.id !== encounter.id), { ...encounter, schemaVersion: LATEST_SCHEMA_VERSION }].sort(
    (a, b) => b.updatedAtMs - a.updatedAtMs,
  );
  await persistLocalCampaignEncounters(next);
  return next;
}

async function removeLocalEncounter(encounterId: string): Promise<DMCampaignEncounter[]> {
  const local = await loadLocalCampaignEncounters();
  const next = local.filter((item) => item.id !== encounterId);
  await persistLocalCampaignEncounters(next);
  return next;
}

function canAccessByRole(encounter: DMCampaignEncounter, uid: string): boolean {
  if (!uid) return false;
  if (encounter.ownerUid === uid) return true;
  if (encounter.owners.includes(uid)) return true;
  if (encounter.editors.includes(uid)) return true;
  return false;
}

function buildCloudPayload(encounter: DMCampaignEncounter, existing?: Record<string, unknown> | null): Record<string, unknown> {
  const me = fbAuth.currentUser?.uid || encounter.ownerUid;
  const owners =
    Array.isArray(existing?.owners) && existing?.owners.length
      ? (existing?.owners as string[])
      : encounter.owners.length
        ? encounter.owners
        : [me];
  const editors = Array.isArray(existing?.editors) ? (existing?.editors as string[]) : encounter.editors || [];

  return {
    schemaVersion: LATEST_SCHEMA_VERSION,
    id: encounter.id,
    campaignId: encounter.campaignId,
    label: encounter.label,
    players: encounter.players,
    monsters: encounter.monsters,
    difficulty: encounter.difficulty,
    status: encounter.status,
    ownerUid: String(existing?.ownerUid || encounter.ownerUid || me),
    owners,
    editors,
    createdAt: existing?.createdAt || now(),
    updatedAt: now(),
  };
}

async function syncUpsertEncounter(encounter: DMCampaignEncounter): Promise<DMCampaignEncounter> {
  const ref = db.collection('dmCampaignEncounters').doc(encounter.id);
  const snap = await ref.get();
  const exists = hasDoc(snap);
  const remote = exists ? ({ id: snap.id, ...(snap.data?.() || snap.data()) } as Record<string, unknown>) : null;
  const remoteEncounter = remote ? mapCloudEncounter(remote) : null;

  if (remoteEncounter && remoteEncounter.updatedAtMs > (encounter.baseUpdatedAtMs || 0) && encounter.syncStatus !== 'Conflict detected') {
    const conflictEncounter: DMCampaignEncounter = {
      ...encounter,
      schemaVersion: LATEST_SCHEMA_VERSION,
      syncStatus: 'Conflict detected',
      conflictRemote: {
        label: remoteEncounter.label,
        players: remoteEncounter.players,
        monsters: remoteEncounter.monsters,
        updatedAtMs: remoteEncounter.updatedAtMs,
      },
    };
    await replaceLocalEncounter(conflictEncounter);
    return conflictEncounter;
  }

  await ref.set(buildCloudPayload(encounter, remote), { merge: true });

  const syncedAt = Date.now();
  const synced: DMCampaignEncounter = {
    ...encounter,
    schemaVersion: LATEST_SCHEMA_VERSION,
    updatedAtMs: syncedAt,
    baseUpdatedAtMs: syncedAt,
    syncStatus: 'Synced',
    conflictRemote: undefined,
  };
  await replaceLocalEncounter(synced);
  return synced;
}

function mergeRemoteIntoLocal(local: DMCampaignEncounter[], remote: DMCampaignEncounter[]): DMCampaignEncounter[] {
  const byId = new Map<string, DMCampaignEncounter>();

  for (const encounter of local) {
    byId.set(encounter.id, encounter);
  }

  for (const remoteEncounter of remote) {
    const localEncounter = byId.get(remoteEncounter.id);
    if (!localEncounter) {
      byId.set(remoteEncounter.id, remoteEncounter);
      continue;
    }

    if (localEncounter.syncStatus === 'Conflict detected') {
      byId.set(remoteEncounter.id, localEncounter);
      continue;
    }

    if (
      (localEncounter.syncStatus === 'Pending sync' || localEncounter.syncStatus === 'Offline changes pending') &&
      remoteEncounter.updatedAtMs > (localEncounter.baseUpdatedAtMs || 0)
    ) {
      byId.set(remoteEncounter.id, {
        ...localEncounter,
        schemaVersion: LATEST_SCHEMA_VERSION,
        syncStatus: 'Conflict detected',
        conflictRemote: {
          label: remoteEncounter.label,
          players: remoteEncounter.players,
          monsters: remoteEncounter.monsters,
          updatedAtMs: remoteEncounter.updatedAtMs,
        },
      });
      continue;
    }

    if (remoteEncounter.updatedAtMs >= localEncounter.updatedAtMs) {
      byId.set(remoteEncounter.id, remoteEncounter);
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
}

export async function subscribeCampaignEncounters(
  campaignId: string,
  cb: (encounters: DMCampaignEncounter[]) => void,
): Promise<() => void> {
  const local = (await loadLocalCampaignEncounters()).filter((encounter) => encounter.campaignId === campaignId);
  cb(local);

  const me = fbAuth.currentUser?.uid;
  if (!me) {
    return () => {};
  }

  const unsub = db
    .collection('dmCampaignEncounters')
    .where('campaignId', '==', campaignId)
    .onSnapshot(
      async (snap) => {
        const remote: DMCampaignEncounter[] = [];
        snap?.forEach?.((doc) => {
          const mapped = mapCloudEncounter({ id: doc.id, ...(doc.data?.() || doc.data()) });
          if (mapped && canAccessByRole(mapped, me)) remote.push(mapped);
        });

        const allLocal = await loadLocalCampaignEncounters();
        const campaignLocal = allLocal.filter((encounter) => encounter.campaignId === campaignId);
        const mergedCampaignEncounters = mergeRemoteIntoLocal(campaignLocal, remote);
        const withoutCampaign = allLocal.filter((encounter) => encounter.campaignId !== campaignId);
        const nextAll = [...withoutCampaign, ...mergedCampaignEncounters].sort((a, b) => b.updatedAtMs - a.updatedAtMs);

        await persistLocalCampaignEncounters(nextAll);
        cb(mergedCampaignEncounters);
      },
      () => {},
    );

  return () => {
    if (typeof unsub === 'function') unsub();
  };
}

function defaultSyncStatusForEncounter(): DMNoteSyncDisplayStatus {
  if (!canSyncCloud()) return 'Local only';
  return 'Pending sync';
}

export async function upsertCampaignEncounter(encounter: DMCampaignEncounter): Promise<DMCampaignEncounter> {
  const timestamp = Date.now();
  const me = fbAuth.currentUser?.uid || encounter.ownerUid || 'local';
  const normalized: DMCampaignEncounter = parseCampaignEncounter({
    ...encounter,
    schemaVersion: LATEST_SCHEMA_VERSION,
    label: encounter.label,
    players: encounter.players,
    monsters: encounter.monsters,
    difficulty: encounter.difficulty,
    status: encounter.status,
    ownerUid: encounter.ownerUid || me,
    owners: encounter.owners?.length ? encounter.owners : [me],
    editors: encounter.editors || [],
    createdAtMs: encounter.createdAtMs || timestamp,
    updatedAtMs: timestamp,
    baseUpdatedAtMs: encounter.baseUpdatedAtMs || timestamp,
    syncStatus: encounter.syncStatus === 'Conflict detected' ? 'Conflict detected' : defaultSyncStatusForEncounter(),
  });

  await replaceLocalEncounter(normalized);

  if (!canSyncCloud()) {
    return {
      ...normalized,
      schemaVersion: LATEST_SCHEMA_VERSION,
      syncStatus: 'Local only',
    };
  }

  try {
    const synced = await syncUpsertEncounter(normalized);
    const queue = await loadQueue();
    const nextQueue = queue.filter((item) => item.encounterId !== normalized.id);
    await persistQueue(nextQueue);
    return synced;
  } catch {
    await enqueue('upsert', normalized.id, normalized.campaignId);
    const queued: DMCampaignEncounter = {
      ...normalized,
      schemaVersion: LATEST_SCHEMA_VERSION,
      syncStatus: 'Pending sync',
    };
    await replaceLocalEncounter(queued);
    return queued;
  }
}

export async function deleteCampaignEncounter(encounterId: string, campaignId: string): Promise<void> {
  await removeLocalEncounter(encounterId);

  if (!canSyncCloud()) return;

  try {
    await db.collection('dmCampaignEncounters').doc(encounterId).delete();
    const queue = await loadQueue();
    const nextQueue = queue.filter((item) => item.encounterId !== encounterId);
    await persistQueue(nextQueue);
  } catch {
    await enqueue('delete', encounterId, campaignId);
  }
}

export async function flushCampaignEncountersQueue(): Promise<void> {
  if (!canSyncCloud()) return;

  const queue = await loadQueue();
  if (!queue.length) return;

  let remaining = [...queue];
  const local = await loadLocalCampaignEncounters();

  for (const item of queue) {
    try {
      if (item.type === 'delete') {
        await db.collection('dmCampaignEncounters').doc(item.encounterId).delete();
      } else {
        const encounter = local.find((entry) => entry.id === item.encounterId);
        if (!encounter) {
          remaining = remaining.filter((entry) => entry.id !== item.id);
          continue;
        }
        await syncUpsertEncounter(encounter);
      }
      remaining = remaining.filter((entry) => entry.id !== item.id);
    } catch (_error) {
      /* intentionally ignored */
    }
  }

  await persistQueue(remaining);
}

// Conflict resolution differs from campaignNotesRepository: encounters are a history log,
// not a single canonical field, so `merge-manual`'s equivalent here is `keep-both` — fork
// the local copy under a new id instead of textually merging label/players/monsters.
export async function resolveCampaignEncounterConflict(
  encounterId: string,
  strategy: 'keep-local' | 'keep-cloud' | 'keep-both',
): Promise<DMCampaignEncounter | null> {
  const local = await loadLocalCampaignEncounters();
  const encounter = local.find((item) => item.id === encounterId);
  if (!encounter) return null;
  if (encounter.syncStatus !== 'Conflict detected' || !encounter.conflictRemote) return encounter;

  if (strategy === 'keep-cloud') {
    const resolved: DMCampaignEncounter = {
      ...encounter,
      schemaVersion: LATEST_SCHEMA_VERSION,
      label: encounter.conflictRemote.label,
      players: encounter.conflictRemote.players,
      monsters: encounter.conflictRemote.monsters,
      updatedAtMs: encounter.conflictRemote.updatedAtMs,
      baseUpdatedAtMs: encounter.conflictRemote.updatedAtMs,
      syncStatus: canSyncCloud() ? 'Synced' : 'Local only',
      conflictRemote: undefined,
    };
    await replaceLocalEncounter(resolved);
    return resolved;
  }

  if (strategy === 'keep-both') {
    const conflictRemote = encounter.conflictRemote;
    const forked: DMCampaignEncounter = {
      ...encounter,
      schemaVersion: LATEST_SCHEMA_VERSION,
      id: `${encounter.id}-fork-${Date.now()}`,
      updatedAtMs: Date.now(),
      baseUpdatedAtMs: 0,
      syncStatus: canSyncCloud() ? 'Pending sync' : 'Local only',
      conflictRemote: undefined,
    };
    const remoteAsLocal: DMCampaignEncounter = {
      ...encounter,
      schemaVersion: LATEST_SCHEMA_VERSION,
      label: conflictRemote.label,
      players: conflictRemote.players,
      monsters: conflictRemote.monsters,
      updatedAtMs: conflictRemote.updatedAtMs,
      baseUpdatedAtMs: conflictRemote.updatedAtMs,
      syncStatus: 'Synced',
      conflictRemote: undefined,
    };

    await removeLocalEncounter(encounter.id);
    await replaceLocalEncounter(forked);
    await replaceLocalEncounter(remoteAsLocal);

    if (canSyncCloud()) {
      try {
        return await syncUpsertEncounter(forked);
      } catch {
        await enqueue('upsert', forked.id, forked.campaignId);
        return forked;
      }
    }
    return forked;
  }

  const resolved: DMCampaignEncounter = {
    ...encounter,
    schemaVersion: LATEST_SCHEMA_VERSION,
    baseUpdatedAtMs: encounter.conflictRemote.updatedAtMs,
    updatedAtMs: Date.now(),
    syncStatus: canSyncCloud() ? 'Pending sync' : 'Local only',
    conflictRemote: undefined,
  };

  await replaceLocalEncounter(resolved);

  if (canSyncCloud()) {
    try {
      const synced = await syncUpsertEncounter(resolved);
      const queue = await loadQueue();
      await persistQueue(queue.filter((entry) => entry.encounterId !== resolved.id));
      return synced;
    } catch {
      await enqueue('upsert', resolved.id, resolved.campaignId);
      return resolved;
    }
  }

  return resolved;
}
