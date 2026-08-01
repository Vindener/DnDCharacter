import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CampaignLinkInput, DMCampaign } from '@/dm/domain/types';
import {
  buildCampaignId,
  clampPartyLevelEstimate,
  normalizeCampaignName,
  resolveCampaignForLink,
  sanitizeCampaignPinnedIds,
  sanitizeCampaignSummary,
  sortCampaignsByRecency,
} from '@/dm/domain/campaign';
import { db, fbAuth, now } from '@/services/firebase';
import { LATEST_SCHEMA_VERSION, createStorageEnvelope, migratePayloadToLatest, normalizeStorageEnvelope } from '@/domain/migrations';

const LOCAL_CAMPAIGNS_KEY = 'DM_CAMPAIGNS_V1';

function toMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const cast = value as { toMillis?: () => number; seconds?: number };
  if (typeof cast.toMillis === 'function') return cast.toMillis();
  if (typeof cast.seconds === 'number') return cast.seconds * 1000;
  return 0;
}

function sanitizeCampaign(raw: unknown): DMCampaign | null {
  const migrated = migratePayloadToLatest<Record<string, unknown>>('dmCampaigns', raw).data;
  if (!migrated || typeof migrated !== 'object' || Array.isArray(migrated)) return null;
  const cast = migrated as Record<string, unknown>;
  const id = String(cast.id || '');
  const name = String(cast.name || '').trim();
  const nameNormalized = normalizeCampaignName(String(cast.nameNormalized || name));
  if (!id || !name || !nameNormalized) return null;

  const owners = Array.isArray(cast.owners) ? cast.owners.map((item) => String(item)).filter(Boolean) : [];
  const editors = Array.isArray(cast.editors) ? cast.editors.map((item) => String(item)).filter(Boolean) : [];
  const ownerUid = String(cast.ownerUid || owners[0] || 'local');

  return {
    schemaVersion: LATEST_SCHEMA_VERSION,
    id,
    name,
    nameNormalized,
    ownerUid,
    owners,
    editors,
    createdAtMs: Number(cast.createdAtMs || 0),
    updatedAtMs: Number(cast.updatedAtMs || 0),
    summary: sanitizeCampaignSummary(cast.summary),
    partyLevelEstimate: clampPartyLevelEstimate(cast.partyLevelEstimate),
    pinnedMonsterIds: sanitizeCampaignPinnedIds(cast.pinnedMonsterIds),
    pinnedSpellIds: sanitizeCampaignPinnedIds(cast.pinnedSpellIds),
  };
}

function mapCloudCampaign(doc: Record<string, unknown>): DMCampaign | null {
  const migrated = migratePayloadToLatest<Record<string, unknown>>('dmCampaigns', doc).data;
  const id = String(migrated.id || '');
  const name = String(migrated.name || '').trim();
  const nameNormalized = normalizeCampaignName(String(migrated.nameNormalized || name));
  if (!id || !name || !nameNormalized) return null;

  const owners = Array.isArray(migrated.owners) ? migrated.owners.map((item) => String(item)).filter(Boolean) : [];
  const editors = Array.isArray(migrated.editors) ? migrated.editors.map((item) => String(item)).filter(Boolean) : [];

  return {
    schemaVersion: LATEST_SCHEMA_VERSION,
    id,
    name,
    nameNormalized,
    ownerUid: String(migrated.ownerUid || owners[0] || 'local'),
    owners,
    editors,
    createdAtMs: toMillis(migrated.createdAt),
    updatedAtMs: toMillis(migrated.updatedAt),
    summary: sanitizeCampaignSummary(migrated.summary),
    partyLevelEstimate: clampPartyLevelEstimate(migrated.partyLevelEstimate),
    pinnedMonsterIds: sanitizeCampaignPinnedIds(migrated.pinnedMonsterIds),
    pinnedSpellIds: sanitizeCampaignPinnedIds(migrated.pinnedSpellIds),
  };
}

async function persistLocalCampaigns(campaigns: DMCampaign[]): Promise<void> {
  try {
    const canonical = campaigns.map((campaign) => ({
      ...campaign,
      schemaVersion: LATEST_SCHEMA_VERSION,
    }));
    const envelope = createStorageEnvelope('dmCampaigns', canonical);
    await AsyncStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify(envelope));
  } catch (_error) {
    /* intentionally ignored */
  }
}

export async function loadLocalCampaigns(): Promise<DMCampaign[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_CAMPAIGNS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const migrated = normalizeStorageEnvelope<DMCampaign[]>('dmCampaigns', parsed, []);
    if (!Array.isArray(migrated.data)) return [];
    return migrated.data.map((item) => sanitizeCampaign(item)).filter((item): item is DMCampaign => Boolean(item));
  } catch {
    return [];
  }
}

function mergeCampaigns(...lists: DMCampaign[][]): DMCampaign[] {
  const byId = new Map<string, DMCampaign>();

  for (const list of lists) {
    for (const campaign of list) {
      const existing = byId.get(campaign.id);
      if (!existing || campaign.updatedAtMs >= existing.updatedAtMs) {
        byId.set(campaign.id, campaign);
      }
    }
  }

  return sortCampaignsByRecency(Array.from(byId.values()));
}

function buildLocalCampaign(name: string): DMCampaign {
  const cleanName = String(name || '').trim();
  const normalized = normalizeCampaignName(cleanName);
  const me = fbAuth.currentUser?.uid || 'local';
  const nowMs = Date.now();

  return {
    schemaVersion: LATEST_SCHEMA_VERSION,
    id: buildCampaignId(cleanName),
    name: cleanName,
    nameNormalized: normalized,
    ownerUid: me,
    owners: me ? [me] : [],
    editors: [],
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
  };
}

function canCloudSync(): boolean {
  return Boolean(fbAuth.currentUser?.uid);
}

function buildCloudPayload(campaign: DMCampaign): Record<string, unknown> {
  const me = fbAuth.currentUser?.uid || campaign.ownerUid;
  const owners = campaign.owners.length ? campaign.owners : [me];
  return {
    schemaVersion: LATEST_SCHEMA_VERSION,
    id: campaign.id,
    name: campaign.name,
    nameNormalized: campaign.nameNormalized,
    ownerUid: campaign.ownerUid || me,
    owners,
    editors: campaign.editors || [],
    createdAt: now(),
    updatedAt: now(),
  };
}

export async function upsertCampaign(campaign: DMCampaign): Promise<DMCampaign> {
  const current = await loadLocalCampaigns();
  const nextUpdated = campaign.updatedAtMs || Date.now();
  const normalized: DMCampaign = {
    ...campaign,
    schemaVersion: LATEST_SCHEMA_VERSION,
    name: String(campaign.name || '').trim(),
    nameNormalized: normalizeCampaignName(campaign.nameNormalized || campaign.name),
    updatedAtMs: nextUpdated,
    createdAtMs: campaign.createdAtMs || nextUpdated,
  };

  const merged = mergeCampaigns(current, [normalized]);
  await persistLocalCampaigns(merged);

  if (canCloudSync()) {
    try {
      await db.collection('dmCampaigns').doc(normalized.id).set(buildCloudPayload(normalized), { merge: true });
    } catch (_error) {
      /* intentionally ignored */
    }
  }

  return normalized;
}

export async function ensureCampaignForName(name: string): Promise<DMCampaign | null> {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;

  const normalized = normalizeCampaignName(cleanName);
  const local = await loadLocalCampaigns();
  const existing = local.find((campaign) => campaign.nameNormalized === normalized || campaign.id === buildCampaignId(cleanName));
  if (existing) {
    if (existing.name !== cleanName) {
      const next: DMCampaign = { ...existing, name: cleanName, updatedAtMs: Date.now(), schemaVersion: LATEST_SCHEMA_VERSION };
      await upsertCampaign(next);
      return next;
    }
    return existing;
  }

  const created = buildLocalCampaign(cleanName);
  await upsertCampaign(created);
  return created;
}

export async function renameCampaign(campaignId: string, name: string): Promise<DMCampaign | null> {
  const cleanName = String(name || '').trim();
  if (!campaignId || !cleanName) return null;

  const current = await loadLocalCampaigns();
  const existing = current.find((campaign) => campaign.id === campaignId);
  if (!existing) return null;

  const nowMs = Date.now();
  const next: DMCampaign = {
    ...existing,
    schemaVersion: LATEST_SCHEMA_VERSION,
    name: cleanName,
    nameNormalized: normalizeCampaignName(cleanName),
    updatedAtMs: nowMs,
  };

  const merged = mergeCampaigns(current, [next]);
  await persistLocalCampaigns(merged);

  if (canCloudSync()) {
    try {
      await db.collection('dmCampaigns').doc(campaignId).update({
        name: next.name,
        nameNormalized: next.nameNormalized,
        updatedAt: now(),
      });
    } catch (_error) {
      /* intentionally ignored */
    }
  }

  return next;
}

export async function updateCampaignSummary(
  campaignId: string,
  patch: { summary?: string; partyLevelEstimate?: number },
): Promise<DMCampaign | null> {
  if (!campaignId) return null;

  const current = await loadLocalCampaigns();
  const existing = current.find((campaign) => campaign.id === campaignId);
  if (!existing) return null;

  const nowMs = Date.now();
  const next: DMCampaign = {
    ...existing,
    schemaVersion: LATEST_SCHEMA_VERSION,
    updatedAtMs: nowMs,
  };

  const cloudPatch: Record<string, unknown> = {};
  if ('summary' in patch) {
    next.summary = sanitizeCampaignSummary(patch.summary);
    cloudPatch.summary = next.summary ?? null;
  }
  if ('partyLevelEstimate' in patch) {
    next.partyLevelEstimate = clampPartyLevelEstimate(patch.partyLevelEstimate);
    cloudPatch.partyLevelEstimate = next.partyLevelEstimate ?? null;
  }

  const merged = mergeCampaigns(current, [next]);
  await persistLocalCampaigns(merged);

  if (canCloudSync()) {
    try {
      await db
        .collection('dmCampaigns')
        .doc(campaignId)
        .update({ ...cloudPatch, updatedAt: now() });
    } catch (_error) {
      /* intentionally ignored */
    }
  }

  return next;
}

// NOTE: deleteCampaign intentionally does NOT cascade-delete this campaign's
// dmCampaignNotes/dmCampaignEncounters. Cascading is a separate, not-yet-made
// product decision (docs/campaign-management-prompts.md, C1) — deleting them
// here would risk silently destroying a co-editor's notes on a shared campaign.
export async function deleteCampaign(campaignId: string): Promise<void> {
  if (!campaignId) return;

  const current = await loadLocalCampaigns();
  const remaining = current.filter((campaign) => campaign.id !== campaignId);
  await persistLocalCampaigns(remaining);

  if (canCloudSync()) {
    try {
      await db.collection('dmCampaigns').doc(campaignId).delete();
    } catch (_error) {
      /* intentionally ignored */
    }
  }
}

async function toggleCampaignPinnedId(
  campaignId: string,
  field: 'pinnedMonsterIds' | 'pinnedSpellIds',
  itemId: string,
): Promise<DMCampaign | null> {
  if (!campaignId || !itemId) return null;

  const current = await loadLocalCampaigns();
  const existing = current.find((campaign) => campaign.id === campaignId);
  if (!existing) return null;

  const currentIds = existing[field] || [];
  const nextIds = currentIds.includes(itemId)
    ? currentIds.filter((id) => id !== itemId)
    : sanitizeCampaignPinnedIds([...currentIds, itemId]);

  const next: DMCampaign = { ...existing, [field]: nextIds, updatedAtMs: Date.now(), schemaVersion: LATEST_SCHEMA_VERSION };
  const merged = mergeCampaigns(current, [next]);
  await persistLocalCampaigns(merged);

  if (canCloudSync()) {
    try {
      await db
        .collection('dmCampaigns')
        .doc(campaignId)
        .update({ [field]: nextIds, updatedAt: now() });
    } catch (_error) {
      /* intentionally ignored */
    }
  }

  return next;
}

export async function togglePinnedMonsterForCampaign(campaignId: string, monsterId: string): Promise<DMCampaign | null> {
  return toggleCampaignPinnedId(campaignId, 'pinnedMonsterIds', monsterId);
}

export async function togglePinnedSpellForCampaign(campaignId: string, spellId: string): Promise<DMCampaign | null> {
  return toggleCampaignPinnedId(campaignId, 'pinnedSpellIds', spellId);
}

export function getCampaignForLink(link: CampaignLinkInput, campaigns: DMCampaign[]): DMCampaign | null {
  return resolveCampaignForLink(link, campaigns);
}

export async function subscribeAccessibleCampaigns(cb: (campaigns: DMCampaign[]) => void): Promise<() => void> {
  const local = await loadLocalCampaigns();
  cb(local);

  const me = fbAuth.currentUser?.uid;
  if (!me) {
    return () => {};
  }

  let ownersCloud: DMCampaign[] = [];
  let editorsCloud: DMCampaign[] = [];

  const push = async () => {
    const merged = mergeCampaigns(local, ownersCloud, editorsCloud);
    cb(merged);
    await persistLocalCampaigns(merged);
  };

  const unsubOwners = db
    .collection('dmCampaigns')
    .where('owners', 'array-contains', me)
    .onSnapshot(
      (snap) => {
        const list: DMCampaign[] = [];
        snap?.forEach?.((doc) => {
          const mapped = mapCloudCampaign({ id: doc.id, ...(doc.data?.() || doc.data()) });
          if (mapped) list.push(mapped);
        });
        ownersCloud = list;
        void push();
      },
      () => {},
    );

  const unsubEditors = db
    .collection('dmCampaigns')
    .where('editors', 'array-contains', me)
    .onSnapshot(
      (snap) => {
        const list: DMCampaign[] = [];
        snap?.forEach?.((doc) => {
          const mapped = mapCloudCampaign({ id: doc.id, ...(doc.data?.() || doc.data()) });
          if (mapped) list.push(mapped);
        });
        editorsCloud = list;
        void push();
      },
      () => {},
    );

  return () => {
    if (typeof unsubOwners === 'function') unsubOwners();
    if (typeof unsubEditors === 'function') unsubEditors();
  };
}
