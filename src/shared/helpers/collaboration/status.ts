import type { AppRole } from '@/types/Product';
import type { CharacterSyncState } from '@/types/Sync';

export type SyncDisplayStatus =
  | 'Local only'
  | 'Synced'
  | 'Pending sync'
  | 'Offline changes pending'
  | 'Conflict detected';

export type ShareDisplayStatus = 'Shared with DM' | 'Shared with Player' | null;

export type StatusKind = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

export function isNetworkOnline(isConnected: boolean | null | undefined): boolean {
  return isConnected !== false;
}

export function getSyncDisplayStatus(
  syncState: CharacterSyncState | undefined,
  isConnected: boolean | null | undefined,
): SyncDisplayStatus {
  if (syncState?.status === 'conflict') return 'Conflict detected';

  const pendingCount = syncState?.pendingPaths?.length || 0;
  if (!isNetworkOnline(isConnected) && pendingCount > 0) {
    return 'Offline changes pending';
  }

  if (syncState?.status === 'pending-upload' || syncState?.status === 'pending-download' || pendingCount > 0) {
    return 'Pending sync';
  }

  if (syncState?.status === 'in-sync') return 'Synced';
  return 'Local only';
}

export function getSyncStatusKind(status: SyncDisplayStatus): StatusKind {
  if (status === 'Synced') return 'success';
  if (status === 'Conflict detected') return 'danger';
  if (status === 'Pending sync' || status === 'Offline changes pending') return 'warning';
  return 'neutral';
}

type ShareLabelArgs = {
  isSharedSheet: boolean;
  role: AppRole;
  source?: 'local' | 'mine' | 'shared';
  isOwnedByMe?: boolean;
};

export function getShareDisplayStatus(args: ShareLabelArgs): ShareDisplayStatus {
  const { isSharedSheet, role, source, isOwnedByMe } = args;
  if (!isSharedSheet && source !== 'shared') return null;

  if (source === 'shared') return 'Shared with Player';
  if (isOwnedByMe === false) return 'Shared with Player';
  if (role === 'DM') return 'Shared with Player';
  return 'Shared with DM';
}

export function mapRoleToHistoryActor(role: AppRole): 'DM' | 'Player' {
  return role === 'DM' ? 'DM' : 'Player';
}

type SourceLabelArgs = {
  uid: string;
  actorRole?: string | null;
  currentUid?: string | null;
};

export function getChangeSourceLabel({ uid, actorRole, currentUid }: SourceLabelArgs): string {
  if (currentUid && uid && currentUid === uid) return 'редаговано вами';
  if (actorRole === 'DM') return 'редаговано DM';
  if (actorRole === 'Player') return 'редаговано гравцем';
  if (!uid) return 'редаговано віддалено';
  return `редаговано ${uid.slice(0, 6)}`;
}

export function summarizeHistoryPaths(paths: string[]): string {
  const clean = (paths || []).map((path) => String(path || '').trim()).filter(Boolean);
  if (!clean.length) return 'Немає деталей шляху';
  if (clean.length <= 2) return clean.join(', ');
  return `${clean.slice(0, 2).join(', ')} +${clean.length - 2}`;
}
