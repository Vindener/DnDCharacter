import type { SyncStatus } from '@/types/Sync';

const CRITICAL_PATH_PREFIXES = ['combat.hp', 'combat.death-saves', 'magic.spell-slots', 'homebrew.resources', 'homebrew.trackers'];

export type SyncSection =
  | 'overview'
  | 'combat' // legacy fallback: combat.rest and any unrecognized combat.*
  | 'combat.vitals' // hp, deathSaves
  | 'combat.defense' // ac, armorClassDetails, initiative, speed, hitDice
  | 'combat.conditions' // conditions — shared target for both overview.conditions and combat.conditions
  | 'combat.weapons' // weapons
  | 'combat.actions' // combatTemplates (actions/bonusActions/reactions)
  | 'magic'
  | 'inventory'
  | 'notes'
  | 'homebrew' // legacy fallback
  | 'homebrew.resources' // customResources
  | 'homebrew.trackers' // customTrackers, customResetRules
  | 'homebrew.fields' // customFields, characterTemplateId, customFeatureBlocks, customSpellLists
  | 'homebrew.sections' // customSections, homebrewEntries
  | 'unknown';

export function pathToSyncSection(path: string): SyncSection {
  const value = String(path || '')
    .trim()
    .toLowerCase();
  if (!value) return 'unknown';

  // COL-4: overview.conditions (player screen) and combat.conditions (DM quick-edit)
  // write the same underlying `conditions` field (see syncPathFieldMap.ts) — must
  // resolve to the same section or the two surfaces can silently clobber each other.
  if (value.startsWith('overview.conditions')) return 'combat.conditions';
  if (value.startsWith('overview.')) return 'overview';

  if (value.startsWith('combat.templates')) return 'combat.actions';
  if (value.startsWith('combat.conditions')) return 'combat.conditions';
  if (value.startsWith('combat.weapons')) return 'combat.weapons';
  if (value.startsWith('combat.hp') || value.startsWith('combat.death-saves')) return 'combat.vitals';
  if (value.startsWith('combat.core')) return 'combat.defense';
  if (value.startsWith('combat.')) return 'combat'; // e.g. combat.rest — legacy fallback, not unknown

  if (value.startsWith('magic.')) return 'magic';
  if (value.startsWith('inventory.')) return 'inventory';
  if (value.startsWith('notes.') || value.startsWith('homebrew.notes-groups')) return 'notes';

  if (value.startsWith('homebrew.resources')) return 'homebrew.resources';
  if (value.startsWith('homebrew.trackers')) return 'homebrew.trackers';
  if (value.startsWith('homebrew.fields')) return 'homebrew.fields';
  // homebrew.entries is a real, distinct literal path — folded into the same section
  // as homebrew.sections (same aliasing technique as conditions above).
  if (value.startsWith('homebrew.sections') || value.startsWith('homebrew.entries')) return 'homebrew.sections';
  if (value.startsWith('homebrew.')) return 'homebrew'; // legacy fallback, not unknown

  return 'unknown';
}

function isCriticalPath(path: string): boolean {
  const value = String(path || '')
    .trim()
    .toLowerCase();
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
