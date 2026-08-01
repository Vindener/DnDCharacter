import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InitiativeCombatant, InitiativeTracker } from '@/dm/domain/types';
import { parseCampaignInitiative } from '@/domain/schemas';
import { db, fbAuth, hasDoc, now } from '@/services/firebase';
import { stripUndefinedDeep } from '@/shared/helpers/stripUndefinedDeep';
import { LATEST_SCHEMA_VERSION, createStorageEnvelope, migratePayloadToLatest, normalizeStorageEnvelope } from '@/domain/migrations';

const LOCAL_INITIATIVE_KEY = 'DM_CAMPAIGN_INITIATIVE_V1';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

function toMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const cast = value as { toMillis?: () => number; seconds?: number };
  if (typeof cast.toMillis === 'function') return cast.toMillis();
  if (typeof cast.seconds === 'number') return cast.seconds * 1000;
  return 0;
}

function sanitizeTracker(raw: unknown): InitiativeTracker | null {
  const migrated = migratePayloadToLatest<Record<string, unknown>>('dmCampaignInitiative', raw).data;
  if (!migrated || typeof migrated !== 'object' || Array.isArray(migrated)) return null;
  const cast = migrated as Record<string, unknown>;
  const campaignId = String(cast.campaignId || '');
  if (!campaignId) return null;
  return { ...parseCampaignInitiative(cast), schemaVersion: LATEST_SCHEMA_VERSION };
}

function mapCloudTracker(doc: Record<string, unknown>): InitiativeTracker | null {
  const migrated = migratePayloadToLatest<Record<string, unknown>>('dmCampaignInitiative', doc).data;
  const campaignId = String(migrated.campaignId || '');
  if (!campaignId) return null;

  const updatedAtMs = toMillis(migrated.updatedAt) || Date.now();
  const createdAtMs = toMillis(migrated.createdAt) || updatedAtMs;

  return parseCampaignInitiative({
    schemaVersion: LATEST_SCHEMA_VERSION,
    id: campaignId,
    campaignId,
    ownerUid: migrated.ownerUid,
    round: migrated.round,
    activeCombatantId: migrated.activeCombatantId,
    combatants: migrated.combatants,
    source: migrated.source,
    createdAtMs,
    updatedAtMs,
    baseUpdatedAtMs: updatedAtMs,
    syncStatus: 'Synced',
  });
}

async function loadAllLocalTrackers(): Promise<InitiativeTracker[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_INITIATIVE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const migrated = normalizeStorageEnvelope<InitiativeTracker[]>('dmCampaignInitiative', parsed, []);
    if (!Array.isArray(migrated.data)) return [];
    return migrated.data.map((item) => sanitizeTracker(item)).filter((item): item is InitiativeTracker => Boolean(item));
  } catch {
    return [];
  }
}

async function persistAllLocalTrackers(trackers: InitiativeTracker[]): Promise<void> {
  try {
    const canonical = trackers.map((tracker) => ({ ...tracker, schemaVersion: LATEST_SCHEMA_VERSION }));
    const envelope = createStorageEnvelope('dmCampaignInitiative', canonical);
    await AsyncStorage.setItem(LOCAL_INITIATIVE_KEY, JSON.stringify(envelope));
  } catch {
    /* intentionally ignored */
  }
}

async function replaceLocalTracker(tracker: InitiativeTracker): Promise<void> {
  const all = await loadAllLocalTrackers();
  const next = [...all.filter((item) => item.campaignId !== tracker.campaignId), tracker];
  await persistAllLocalTrackers(next);
}

async function removeLocalTracker(campaignId: string): Promise<void> {
  const all = await loadAllLocalTrackers();
  await persistAllLocalTrackers(all.filter((item) => item.campaignId !== campaignId));
}

export async function loadLocalCampaignInitiative(campaignId: string): Promise<InitiativeTracker | null> {
  const all = await loadAllLocalTrackers();
  return all.find((item) => item.campaignId === campaignId) || null;
}

function canSyncCloud(): boolean {
  return Boolean(fbAuth.currentUser?.uid);
}

function buildCloudPayload(tracker: InitiativeTracker): Record<string, unknown> {
  // stripUndefinedDeep matters here: InitiativeCombatant.hpMax/monsterId/characterId are
  // optional and frequently literal `undefined` (e.g. a manually-typed monster with no
  // monsterId, or one with no listed hit points) — Firestore's native SDK rejects a `.set()`
  // whose payload contains ANY undefined field value, anywhere, including nested inside the
  // combatants array. That rejection was being swallowed by writeThroughCloud's catch as a
  // quiet "Pending sync", so the tracker doc was never actually created/updated at all —
  // this is why "start initiative" could leave the Initiative screen showing no active
  // combat, and why later mutations like "next turn" seemed to do nothing.
  return stripUndefinedDeep({
    schemaVersion: LATEST_SCHEMA_VERSION,
    id: tracker.campaignId,
    campaignId: tracker.campaignId,
    ownerUid: tracker.ownerUid,
    round: tracker.round,
    activeCombatantId: tracker.activeCombatantId,
    combatants: tracker.combatants,
    source: tracker.source,
    // firestore.rules' isValidDmCampaignInitiativeWrite() requires this exact field (a plain
    // int) in request.resource.data.keys() — without it every create/update was silently
    // rejected server-side too, on top of the undefined-value issue above.
    updatedAtMs: tracker.updatedAtMs,
    createdAt: now(),
    updatedAt: now(),
  });
}

// Single-writer design (campaign owner only, enforced by firestore.rules): unlike
// campaignEncountersRepository/campaignNotesRepository there is no conflict-detection or
// offline-retry queue here — it would be dead code, since only the GM ever writes this
// document. A failed cloud write just leaves the tracker "Pending sync" locally; the GM's
// next mutation (reorder/HP/next-turn) is already a full overwrite of the latest state, so
// it doubles as the retry.
async function writeThroughCloud(tracker: InitiativeTracker): Promise<InitiativeTracker> {
  if (!canSyncCloud()) {
    const localOnly: InitiativeTracker = { ...tracker, syncStatus: 'Local only' };
    await replaceLocalTracker(localOnly);
    return localOnly;
  }

  try {
    await db.collection('dmCampaignInitiative').doc(tracker.campaignId).set(buildCloudPayload(tracker));
    const synced: InitiativeTracker = { ...tracker, syncStatus: 'Synced', baseUpdatedAtMs: tracker.updatedAtMs };
    await replaceLocalTracker(synced);
    return synced;
  } catch (error) {
    if (isDev) console.warn('[campaignInitiativeRepository] cloud write failed, kept as Pending sync:', error);
    const pending: InitiativeTracker = { ...tracker, syncStatus: 'Pending sync' };
    await replaceLocalTracker(pending);
    return pending;
  }
}

export async function startCampaignInitiative(campaignId: string, combatants: InitiativeCombatant[]): Promise<InitiativeTracker> {
  const timestamp = Date.now();
  const me = fbAuth.currentUser?.uid || 'local';
  const tracker: InitiativeTracker = {
    schemaVersion: LATEST_SCHEMA_VERSION,
    id: campaignId,
    campaignId,
    ownerUid: me,
    round: 1,
    activeCombatantId: combatants[0]?.id ?? null,
    combatants,
    source: 'dm-encounter-prep',
    createdAtMs: timestamp,
    updatedAtMs: timestamp,
    baseUpdatedAtMs: timestamp,
    syncStatus: 'Pending sync',
  };

  return writeThroughCloud(tracker);
}

export async function updateCampaignInitiative(
  campaignId: string,
  patch: Partial<Pick<InitiativeTracker, 'round' | 'activeCombatantId' | 'combatants'>>,
): Promise<InitiativeTracker | null> {
  const current = await loadLocalCampaignInitiative(campaignId);
  if (!current) return null;

  const next: InitiativeTracker = {
    ...current,
    ...patch,
    updatedAtMs: Date.now(),
    syncStatus: 'Pending sync',
  };

  return writeThroughCloud(next);
}

export async function endCampaignInitiative(campaignId: string): Promise<void> {
  await removeLocalTracker(campaignId);
  if (!canSyncCloud()) return;

  try {
    await db.collection('dmCampaignInitiative').doc(campaignId).delete();
  } catch {
    /* intentionally ignored — a stale cloud doc is harmless, the next startCampaignInitiative overwrites it */
  }
}

export async function subscribeCampaignInitiative(
  campaignId: string,
  cb: (tracker: InitiativeTracker | null) => void,
): Promise<() => void> {
  const local = await loadLocalCampaignInitiative(campaignId);
  cb(local);

  if (!canSyncCloud()) {
    return () => {};
  }

  const unsub = db
    .collection('dmCampaignInitiative')
    .doc(campaignId)
    .onSnapshot(
      async (snap) => {
        if (!hasDoc(snap)) {
          await removeLocalTracker(campaignId);
          cb(null);
          return;
        }

        const mapped = mapCloudTracker({ id: snap.id, ...(snap.data?.() || snap.data()) });
        if (!mapped) return;
        await replaceLocalTracker(mapped);
        cb(mapped);
      },
      () => {},
    );

  return () => {
    if (typeof unsub === 'function') unsub();
  };
}
