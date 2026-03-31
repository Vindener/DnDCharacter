import type { SyncStatus } from '@/types/Sync';

const CRITICAL_PATH_PREFIXES = [
  'combat.hp',
  'combat.death-saves',
  'magic.spell-slots',
  'homebrew.resources',
  'homebrew.trackers',
];

export type SyncSection = 'overview' | 'combat' | 'magic' | 'inventory' | 'notes' | 'homebrew' | 'unknown';

export function pathToSyncSection(path: string): SyncSection {
  const value = String(path || '').trim().toLowerCase();
  if (!value) return 'unknown';
  if (value.startsWith('overview.')) return 'overview';
  if (value.startsWith('combat.')) return 'combat';
  if (value.startsWith('magic.')) return 'magic';
  if (value.startsWith('inventory.')) return 'inventory';
  if (value.startsWith('notes.') || value.startsWith('homebrew.notes-groups')) return 'notes';
  if (value.startsWith('homebrew.')) return 'homebrew';
  return 'unknown';
}

function isCriticalPath(path: string): boolean {
  const value = String(path || '').trim().toLowerCase();
  return CRITICAL_PATH_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export function collectConflictPaths(localPaths: string[], cloudPaths: string[]): string[] {
  const normalizedCloud = cloudPaths.map((path) => String(path || '').trim()).filter(Boolean);
  const cloudSet = new Set(normalizedCloud);
  const cloudSections = new Set(normalizedCloud.map((path) => pathToSyncSection(path)));
  const hasCriticalCloudPath = normalizedCloud.some((path) => isCriticalPath(path));

  const out: string[] = [];
  for (const rawPath of localPaths) {
    const path = String(rawPath || '').trim();
    if (!path) continue;

    if (cloudSet.has(path)) {
      out.push(path);
      continue;
    }

    const section = pathToSyncSection(path);
    if (section !== 'unknown' && cloudSections.has(section)) {
      out.push(path);
      continue;
    }

    if (isCriticalPath(path) && hasCriticalCloudPath) {
      out.push(path);
    }
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
