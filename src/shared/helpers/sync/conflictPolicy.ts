import type { SyncStatus } from '@/types/Sync';

export function collectConflictPaths(localPaths: string[], cloudPaths: string[]): string[] {
  const cloudSet = new Set(cloudPaths);
  const out: string[] = [];
  for (const path of localPaths) {
    if (cloudSet.has(path)) out.push(path);
  }
  return Array.from(new Set(out));
}

type ResolveSyncStatusArgs = {
  hasCloud: boolean;
  hasPendingPaths: boolean;
  hasConflictPaths: boolean;
  localRevision: number;
  cloudRevision: number;
};

export function resolveSyncStatus(args: ResolveSyncStatusArgs): SyncStatus {
  if (args.hasConflictPaths) return 'conflict';
  if (!args.hasCloud) return 'local-only';
  if (args.hasPendingPaths) return 'pending-upload';
  if (args.localRevision > args.cloudRevision) return 'pending-upload';
  if (args.cloudRevision > args.localRevision) return 'pending-download';
  return 'in-sync';
}
