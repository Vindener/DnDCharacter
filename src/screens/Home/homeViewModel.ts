import type { CharacterViewModel } from '@/types/Character';
import type { AppRole } from '@/types/Product';
import type { CharacterSyncMap } from '@/types/Sync';
import type { DMCampaign } from '@/dm/domain/types';
import { isHomebrewCharacter } from '@/shared/helpers/homebrew';
import { getShareDisplayStatus, getSyncDisplayStatus } from '@/shared/helpers/collaboration/status';

export type HomeCharacterSource = 'local' | 'mine' | 'shared';

export type HomeBadgeKind = 'local' | 'cloud' | 'shared' | 'homebrew' | 'synced' | 'pending' | 'offline' | 'conflict';

export type HomeBadge = {
  kind: HomeBadgeKind;
  label: string;
};

export type HomeCharacterInput = {
  payload: CharacterViewModel;
  source: HomeCharacterSource;
  isSharedSheet?: boolean;
};

export type HomeCharacterPreview = {
  id: string;
  name: string;
  className: string;
  race: string;
  level: number;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  initiative: number;
  source: HomeCharacterSource;
  payload: CharacterViewModel;
  syncStatus: ReturnType<typeof getSyncDisplayStatus>;
  shareStatus: ReturnType<typeof getShareDisplayStatus>;
  badges: HomeBadge[];
};

export type HomeContinueState = {
  character: HomeCharacterPreview | null;
  isEmpty: boolean;
};

export type HomeDmPreview = {
  shouldShow: boolean;
  campaignName: string | null;
  partyCount: number;
  pendingChanges: number;
  conflictCount: number;
};

export type HomeSyncStrip = {
  networkLabel: string;
  cloudLabel: string;
  lastSyncLabel: string;
  pendingLabel: string;
  conflictLabel: string;
  hasPending: boolean;
  hasConflict: boolean;
  isOnline: boolean;
};

export const ROLE_LABELS: Record<AppRole, string> = {
  Player: 'Гравець',
  DM: 'Майстер',
  Hybrid: 'Обидва',
};

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function formatInitiative(value: number): string {
  return formatSigned(Number(value) || 0);
}

function pushUniqueBadge(list: HomeBadge[], next: HomeBadge) {
  if (list.some((item) => item.kind === next.kind)) return;
  list.push(next);
}

function buildSyncBadge(status: ReturnType<typeof getSyncDisplayStatus>): HomeBadge | null {
  if (status === 'Synced') return { kind: 'synced', label: 'Синхронізовано' };
  if (status === 'Pending sync') return { kind: 'pending', label: 'Очікує синхронізації' };
  if (status === 'Offline changes pending') return { kind: 'offline', label: 'Офлайн-зміни' };
  if (status === 'Conflict detected') return { kind: 'conflict', label: 'Конфлікт' };
  return null;
}

type PreviewAccumulator = HomeCharacterPreview & {
  sourceKinds: Set<'local' | 'cloud' | 'shared'>;
  hasHomebrew: boolean;
};

function createPreview(input: HomeCharacterInput, syncByCharacter: CharacterSyncMap, isConnected: boolean | null | undefined, role: AppRole): PreviewAccumulator {
  const { payload, source, isSharedSheet } = input;
  const syncStatus = getSyncDisplayStatus(syncByCharacter[payload.id], isConnected);
  const shareStatus = getShareDisplayStatus({
    isSharedSheet: Boolean(isSharedSheet) || source === 'shared',
    source,
    isOwnedByMe: source !== 'shared',
    role,
  });

  const sourceKinds = new Set<'local' | 'cloud' | 'shared'>();
  if (source === 'local') sourceKinds.add('local');
  if (source === 'mine') sourceKinds.add('cloud');
  if (source === 'shared') {
    sourceKinds.add('cloud');
    sourceKinds.add('shared');
  }
  if (isSharedSheet) sourceKinds.add('shared');

  return {
    id: payload.id,
    name: payload.name || 'Персонаж',
    className: payload.class || 'Клас',
    race: payload.race || 'Раса',
    level: payload.level || 1,
    hpCurrent: payload.hp?.current || 0,
    hpMax: payload.hp?.max || 0,
    ac: payload.ac || 0,
    initiative: payload.initiative || 0,
    source,
    payload,
    syncStatus,
    shareStatus,
    badges: [],
    sourceKinds,
    hasHomebrew: isHomebrewCharacter(payload),
  };
}

function finalizePreview(preview: PreviewAccumulator): HomeCharacterPreview {
  const badges: HomeBadge[] = [];
  if (preview.sourceKinds.has('local')) pushUniqueBadge(badges, { kind: 'local', label: 'Локально' });
  if (preview.sourceKinds.has('cloud')) pushUniqueBadge(badges, { kind: 'cloud', label: 'Хмара' });
  if (preview.sourceKinds.has('shared')) pushUniqueBadge(badges, { kind: 'shared', label: 'Спільний доступ' });
  if (preview.hasHomebrew) pushUniqueBadge(badges, { kind: 'homebrew', label: 'Авторський' });

  const syncBadge = buildSyncBadge(preview.syncStatus);
  if (syncBadge) pushUniqueBadge(badges, syncBadge);

  return {
    id: preview.id,
    name: preview.name,
    className: preview.className,
    race: preview.race,
    level: preview.level,
    hpCurrent: preview.hpCurrent,
    hpMax: preview.hpMax,
    ac: preview.ac,
    initiative: preview.initiative,
    source: preview.source,
    payload: preview.payload,
    syncStatus: preview.syncStatus,
    shareStatus: preview.shareStatus,
    badges,
  };
}

export function buildHomeCharacterPreviews(args: {
  characters: HomeCharacterInput[];
  syncByCharacter: CharacterSyncMap;
  isConnected: boolean | null | undefined;
  role: AppRole;
}): HomeCharacterPreview[] {
  const byId = new Map<string, PreviewAccumulator>();

  args.characters.forEach((input) => {
    if (!input.payload?.id) return;
    const next = createPreview(input, args.syncByCharacter, args.isConnected, args.role);
    const existing = byId.get(next.id);
    if (!existing) {
      byId.set(next.id, next);
      return;
    }

    next.sourceKinds.forEach((kind) => existing.sourceKinds.add(kind));
    existing.hasHomebrew = existing.hasHomebrew || next.hasHomebrew;
    existing.shareStatus = existing.shareStatus || next.shareStatus;
    if (next.syncStatus !== 'Local only') existing.syncStatus = next.syncStatus;
    if (existing.source !== 'local' && next.source === 'local') {
      existing.source = 'local';
      existing.payload = next.payload;
    }
  });

  return Array.from(byId.values())
    .map(finalizePreview)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function selectContinueState(args: {
  previews: HomeCharacterPreview[];
  lastSessionCharacterId: string | null;
  currentCharacterId: string | null;
}): HomeContinueState {
  const character =
    args.previews.find((item) => item.id === args.lastSessionCharacterId) ||
    args.previews.find((item) => item.id === args.currentCharacterId) ||
    args.previews.find((item) => item.payload.sessionMode) ||
    args.previews[0] ||
    null;

  return {
    character,
    isEmpty: !args.previews.length,
  };
}

export function countPendingSync(syncByCharacter: CharacterSyncMap, isConnected: boolean | null | undefined): number {
  return Object.values(syncByCharacter).filter((entry) => {
    const status = getSyncDisplayStatus(entry, isConnected);
    return status === 'Pending sync' || status === 'Offline changes pending';
  }).length;
}

export function countConflicts(syncByCharacter: CharacterSyncMap, isConnected: boolean | null | undefined): number {
  return Object.values(syncByCharacter).filter((entry) => getSyncDisplayStatus(entry, isConnected) === 'Conflict detected').length;
}

export function buildDmPreview(args: {
  role: AppRole;
  campaigns: DMCampaign[];
  partyCount: number;
  pendingChanges: number;
  conflictCount: number;
}): HomeDmPreview {
  const activeCampaign = args.campaigns[0] || null;
  const roleCanDm = args.role === 'DM' || args.role === 'Hybrid';
  const hasDmData = Boolean(activeCampaign) || args.partyCount > 0 || args.pendingChanges > 0 || args.conflictCount > 0;
  const shouldShow = roleCanDm && hasDmData && Boolean(activeCampaign);

  return {
    shouldShow,
    campaignName: activeCampaign?.name || null,
    partyCount: args.partyCount,
    pendingChanges: args.pendingChanges,
    conflictCount: args.conflictCount,
  };
}

export function buildSyncStrip(args: {
  isOnline: boolean;
  isSignedIn: boolean;
  pendingCount: number;
  conflictCount: number;
  lastSyncAt: number | null;
}): HomeSyncStrip {
  const lastSyncLabel = args.lastSyncAt ? new Date(args.lastSyncAt).toLocaleTimeString() : 'ще не було';

  return {
    networkLabel: args.isOnline ? 'Онлайн' : 'Офлайн',
    cloudLabel: args.isSignedIn ? 'Хмара підключена' : 'Хмара: потрібен вхід',
    lastSyncLabel: `Синхронізація: ${lastSyncLabel}`,
    pendingLabel: args.pendingCount > 0 ? `Очікують офлайн-зміни: ${args.pendingCount}` : 'Немає локальної черги',
    conflictLabel: args.conflictCount > 0 ? `Виявлено конфліктів: ${args.conflictCount}` : 'Конфліктів немає',
    hasPending: args.pendingCount > 0,
    hasConflict: args.conflictCount > 0,
    isOnline: args.isOnline,
  };
}
