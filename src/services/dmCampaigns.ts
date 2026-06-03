import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CharacterDto } from '@/types/Character';
import type { DMCampaign } from '@/types/DM';
import { db, fbAuth, now } from '@/services/firebase';

const LOCAL_CAMPAIGNS_KEY = 'DM_CAMPAIGNS_V1';

function toMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const cast = value as { toMillis?: () => number; seconds?: number };
  if (typeof cast.toMillis === 'function') return cast.toMillis();
  if (typeof cast.seconds === 'number') return cast.seconds * 1000;
  return 0;
}

export function normalizeCampaignName(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim();
}

function slugifyCampaignName(name: string): string {
  const normalized = normalizeCampaignName(name).replace(/\s+/g, '-');
  return normalized || 'campaign';
}

function buildCampaignId(name: string): string {
  return `campaign-${slugifyCampaignName(name)}`;
}

function sanitizeCampaign(raw: unknown): DMCampaign | null {
  if (!raw || typeof raw !== 'object') return null;
  const cast = raw as Record<string, unknown>;
  const id = String(cast.id || '');
  const name = String(cast.name || '').trim();
  const nameNormalized = normalizeCampaignName(String(cast.nameNormalized || name));
  if (!id || !name || !nameNormalized) return null;

  const owners = Array.isArray(cast.owners) ? cast.owners.map((item) => String(item)).filter(Boolean) : [];
  const editors = Array.isArray(cast.editors) ? cast.editors.map((item) => String(item)).filter(Boolean) : [];
  const ownerUid = String(cast.ownerUid || owners[0] || 'local');

  return {
    id,
    name,
    nameNormalized,
    ownerUid,
    owners,
    editors,
    createdAtMs: Number(cast.createdAtMs || 0),
    updatedAtMs: Number(cast.updatedAtMs || 0),
  };
}

function mapCloudCampaign(doc: Record<string, unknown>): DMCampaign | null {
  const id = String(doc.id || '');
  const name = String(doc.name || '').trim();
  const nameNormalized = normalizeCampaignName(String(doc.nameNormalized || name));
  if (!id || !name || !nameNormalized) return null;

  const owners = Array.isArray(doc.owners) ? doc.owners.map((item) => String(item)).filter(Boolean) : [];
  const editors = Array.isArray(doc.editors) ? doc.editors.map((item) => String(item)).filter(Boolean) : [];

  return {
    id,
    name,
    nameNormalized,
    ownerUid: String(doc.ownerUid || owners[0] || 'local'),
    owners,
    editors,
    createdAtMs: toMillis(doc.createdAt),
    updatedAtMs: toMillis(doc.updatedAt),
  };
}

async function persistLocalCampaigns(campaigns: DMCampaign[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify(campaigns));
  } catch {}
}

export async function loadLocalCampaigns(): Promise<DMCampaign[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_CAMPAIGNS_KEY);
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => sanitizeCampaign(item)).filter((item): item is DMCampaign => Boolean(item));
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

  return Array.from(byId.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs || a.name.localeCompare(b.name));
}

function buildLocalCampaign(name: string): DMCampaign {
  const cleanName = String(name || '').trim();
  const normalized = normalizeCampaignName(cleanName);
  const me = fbAuth.currentUser?.uid || 'local';
  const nowMs = Date.now();

  return {
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
    } catch {}
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
      const next: DMCampaign = { ...existing, name: cleanName, updatedAtMs: Date.now() };
      await upsertCampaign(next);
      return next;
    }
    return existing;
  }

  const created = buildLocalCampaign(cleanName);
  await upsertCampaign(created);
  return created;
}

export function getCampaignForCharacter(character: CharacterDto, campaigns: DMCampaign[]): DMCampaign | null {
  if (character.campaignId) {
    const byId = campaigns.find((campaign) => campaign.id === character.campaignId);
    if (byId) return byId;
  }

  const legacyName = String(character.campaign || '').trim();
  if (!legacyName) return null;
  const normalized = normalizeCampaignName(legacyName);
  return campaigns.find((campaign) => campaign.nameNormalized === normalized) || null;
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
        snap?.forEach?.((doc: any) => {
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
        snap?.forEach?.((doc: any) => {
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
