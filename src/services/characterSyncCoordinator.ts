import type { CharacterSyncMap, CharacterSyncState, SyncTransportState } from '@/types/Sync';
import type { CharacterViewModel } from '@/types/Character';
import type { CharacterActorRole, CharacterChangeHistoryEntry } from '@/repositories/characterCloudRepository';
import { characterCloudRepository } from '@/repositories/characterCloudRepository';
import { mapSyncPathsToFieldPaths } from '@/repositories/syncPathFieldMap';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import { resolveSyncStatus, collectConflictPaths, pathToSyncSection, type SyncSection } from '@/shared/helpers/sync/conflictPolicy';
import { classifySyncError } from '@/shared/helpers/sync/syncErrorClassification';
import { characterMapper } from '@/domain/mappers';
import { timestampToMillis } from '@/services/firebase';
import { toast } from '@/shared/services/toast';
import { trackProductEvent } from '@/shared/services/telemetry/productTelemetry';
import i18n from '@/i18n';

export type SyncTransitionType =
  | 'ensure'
  | 'set-cloud-availability'
  | 'mark-local-draft-paths'
  | 'mark-cloud-uploaded'
  | 'mark-cloud-downloaded'
  | 'mark-conflict'
  | 'clear-conflicts'
  | 'set-transport'
  | 'mark-sync-error'
  | 'remove-character'
  | 'record-remote-sync-state';

type TransitionBase = {
  characterId: string;
  atMs?: number;
};

type EnsureTransition = TransitionBase & {
  type: 'ensure';
  hasCloud?: boolean;
};

type SetCloudAvailabilityTransition = TransitionBase & {
  type: 'set-cloud-availability';
  hasCloud: boolean;
};

type MarkLocalDraftPathsTransition = TransitionBase & {
  type: 'mark-local-draft-paths';
  changedPaths: string[];
};

// COL-4: counterBaseline/conditionsBaseline advance the delta baseline for exactly the
// counter keys this upload actually wrote (see extractCounterSnapshot/counterKeysInScope
// below) — merged into the existing baseline, never a wholesale replace, so an unrelated
// still-pending edit's baseline stays frozen.
type MarkCloudUploadedTransition = TransitionBase & {
  type: 'mark-cloud-uploaded';
  message?: string | null;
  counterBaseline?: Record<string, number>;
  conditionsBaseline?: string[];
};

type MarkCloudDownloadedTransition = TransitionBase & {
  type: 'mark-cloud-downloaded';
  message?: string | null;
};

type MarkConflictTransition = TransitionBase & {
  type: 'mark-conflict';
  conflictPaths: string[];
  message?: string | null;
};

type ClearConflictsTransition = TransitionBase & {
  type: 'clear-conflicts';
};

type SetTransportTransition = TransitionBase & {
  type: 'set-transport';
  state: SyncTransportState;
  message?: string | null;
};

type MarkSyncErrorTransition = TransitionBase & {
  type: 'mark-sync-error';
  message?: string | null;
};

type RemoveCharacterTransition = TransitionBase & {
  type: 'remove-character';
};

// COL-5: bookkeeping-only transition — records which changeHistory entries this device has
// already accounted for (clock-independent id diff) and the server time of the last remote
// change it has observed. Deliberately does not touch pendingPaths/conflictPaths/status.
type RecordRemoteSyncStateTransition = TransitionBase & {
  type: 'record-remote-sync-state';
  seenHistoryEntryIds: string[];
  serverSyncAtMs?: number;
  // COL-4: baseline advancement from an observed remote snapshot — only for counter/condition
  // keys not currently held back by a still-pending local edit (see computeNextCounterBaseline).
  counterBaseline?: Record<string, number>;
  conditionsBaseline?: string[];
};

export type SyncTransition =
  | EnsureTransition
  | SetCloudAvailabilityTransition
  | MarkLocalDraftPathsTransition
  | MarkCloudUploadedTransition
  | MarkCloudDownloadedTransition
  | MarkConflictTransition
  | ClearConflictsTransition
  | SetTransportTransition
  | MarkSyncErrorTransition
  | RemoveCharacterTransition
  | RecordRemoteSyncStateTransition;

export type ApplySyncTransitionResult = {
  map: CharacterSyncMap;
  nextState?: CharacterSyncState;
};

export type BuildUploadPlanArgs = {
  syncState?: CharacterSyncState;
  historyPaths?: string[] | null;
  fallbackPath?: string;
};

export type BuildUploadPlanResult = {
  pendingPaths: string[];
  pendingCount: number;
  historyPaths: string[];
};

export type ReconcileRemoteSnapshotArgs = {
  syncState?: CharacterSyncState;
  localCharacter: CharacterViewModel;
  remoteCharacter: CharacterViewModel;
  remotePathsSinceLastSync: string[];
  normalizeCharacter?: (character: CharacterViewModel) => CharacterViewModel;
};

export type ReconcileRemoteSnapshotResult =
  | { action: 'conflict'; conflictPaths: string[]; pendingPaths: string[]; remotePathsSinceLastSync: string[] }
  | {
      action: 'merge';
      character: CharacterViewModel;
      pendingPaths: string[];
      remotePathsSinceLastSync: string[];
      counterBaseline: Record<string, number>;
      conditionsBaseline: string[];
    }
  | {
      action: 'replace';
      character: CharacterViewModel;
      pendingPaths: string[];
      remotePathsSinceLastSync: string[];
      counterBaseline: Record<string, number>;
      conditionsBaseline: string[];
    }
  | { action: 'noop'; pendingPaths: string[]; remotePathsSinceLastSync: string[] };

export interface CharacterSyncUploadPort {
  ensureCharacterSync: (characterId: string, hasCloud?: boolean) => Promise<void>;
  setCloudAvailability: (characterId: string, hasCloud: boolean) => Promise<void>;
  markCloudUploaded: (
    characterId: string,
    baseline?: { counterBaseline?: Record<string, number>; conditionsBaseline?: string[] },
  ) => Promise<void>;
  setSyncTransport: (characterId: string, state: SyncTransportState, message?: string | null) => Promise<void>;
  markSyncError: (characterId: string, message: string) => Promise<void>;
  markConflict?: (characterId: string, conflictPaths: string[]) => Promise<void>;
}

export interface CharacterSyncConflictPort extends CharacterSyncUploadPort {
  markCloudDownloaded: (characterId: string) => Promise<void>;
  clearConflicts: (characterId: string) => Promise<void>;
  // Only required for the keep-cloud resolution path (see resolveConflict below) — the other
  // strategies never call it, so it's optional to avoid forcing every syncPort literal to supply it.
  recordRemoteSyncState?: (
    characterId: string,
    payload: {
      seenHistoryEntryIds: string[];
      serverSyncAtMs?: number;
      counterBaseline?: Record<string, number>;
      conditionsBaseline?: string[];
    },
  ) => Promise<void>;
}

export type SyncToCloudArgs = {
  character: CharacterViewModel;
  syncState?: CharacterSyncState;
  actorRole: CharacterActorRole;
  syncPort: CharacterSyncUploadPort;
  isOnline: boolean;
  fallbackPath?: string;
  historyPaths?: string[] | null;
  startTransportState?: SyncTransportState;
  offlineMessage?: string;
  syncingMessage?: string;
  syncedMessage?: string;
  conflictFallbackPath?: string;
};

export type SyncToCloudResult = {
  status: 'offline' | 'synced' | 'error';
  message?: string;
  pendingCount: number;
  historyPaths: string[];
  targetCharacter: CharacterViewModel;
  created?: boolean;
  updated?: boolean;
};

export type ResolveConflictArgs = {
  strategy: 'keep-local' | 'keep-cloud' | 'later';
  character: CharacterViewModel;
  syncState?: CharacterSyncState;
  actorRole: CharacterActorRole;
  syncPort: CharacterSyncConflictPort;
  isOnline: boolean;
  normalizeCharacter?: (character: CharacterViewModel) => CharacterViewModel;
};

export type ResolveConflictResult =
  | { status: 'resolved-local'; targetCharacter: CharacterViewModel }
  | { status: 'resolved-cloud'; targetCharacter: CharacterViewModel }
  | { status: 'deferred' }
  | { status: 'error'; message: string };

function toTimestamp(atMs?: number): number {
  return typeof atMs === 'number' ? atMs : Date.now();
}

function cleanPaths(paths: unknown): string[] {
  if (!Array.isArray(paths)) return [];
  const normalized = paths.map((path) => String(path || '').trim()).filter(Boolean);
  const deduped = Array.from(new Set(normalized));
  // Referential stability matters here: normalizeSyncState() runs this on every sync
  // transition (not just ones that touch these fields), and callers key a React effect's
  // dependency array off the result (useCharacterActions.tsx). Always allocating a new
  // array made that effect see a "changed" dependency on every transition, looping
  // setSyncTransport → re-render → effect re-run indefinitely (crashes synchronously when
  // offline, since that branch has no debounce timer).
  if (deduped.length === paths.length && deduped.every((path, i) => path === paths[i])) {
    return paths as string[];
  }
  return deduped;
}

function resolveStatus(next: CharacterSyncState): CharacterSyncState {
  return {
    ...next,
    status: resolveSyncStatus({
      hasCloud: next.hasCloud,
      hasPendingPaths: next.pendingPaths.length > 0,
      hasConflictPaths: next.conflictPaths.length > 0,
      localRevision: next.localRevision,
      cloudRevision: next.cloudRevision,
    }),
  };
}

export function buildDefaultSyncState(characterId: string, hasCloud = false): CharacterSyncState {
  return {
    characterId,
    hasCloud,
    localRevision: 0,
    cloudRevision: 0,
    lastLocalChangeAt: null,
    lastSyncAt: null,
    pendingPaths: [],
    conflictPaths: [],
    status: hasCloud ? 'in-sync' : 'local-only',
    transportState: 'idle',
    transportMessage: null,
    lastSyncError: null,
    lastSyncAttemptAt: null,
    seenHistoryEntryIds: [],
    counterBaseline: {},
    conditionsBaseline: [],
  };
}

export function normalizeSyncState(characterId: string, raw: Partial<CharacterSyncState> | null | undefined): CharacterSyncState {
  const fallback = buildDefaultSyncState(characterId, Boolean(raw?.hasCloud));
  if (!raw) return fallback;

  return resolveStatus({
    ...fallback,
    ...raw,
    characterId,
    pendingPaths: cleanPaths(raw.pendingPaths),
    conflictPaths: cleanPaths(raw.conflictPaths),
    seenHistoryEntryIds: cleanPaths(raw.seenHistoryEntryIds),
    transportState: raw.transportState || 'idle',
    transportMessage: raw.transportMessage ?? null,
    lastSyncError: raw.lastSyncError ?? null,
    lastSyncAttemptAt: raw.lastSyncAttemptAt ?? null,
    counterBaseline: raw.counterBaseline && typeof raw.counterBaseline === 'object' ? raw.counterBaseline : {},
    conditionsBaseline: cleanPaths(raw.conditionsBaseline),
  });
}

export function normalizeSyncMap(raw: unknown): CharacterSyncMap {
  if (!raw || typeof raw !== 'object') return {};

  const cast = raw as Record<string, Partial<CharacterSyncState>>;
  const normalized: CharacterSyncMap = {};
  Object.entries(cast).forEach(([characterId, entry]) => {
    if (!characterId) return;
    normalized[characterId] = normalizeSyncState(characterId, entry);
  });

  return normalized;
}

function updateMap(map: CharacterSyncMap, nextState: CharacterSyncState): ApplySyncTransitionResult {
  return {
    map: { ...map, [nextState.characterId]: nextState },
    nextState,
  };
}

export function applySyncTransition(map: CharacterSyncMap, transition: SyncTransition): ApplySyncTransitionResult {
  const atMs = toTimestamp(transition.atMs);

  if (transition.type === 'remove-character') {
    if (!map[transition.characterId]) return { map };
    const nextMap = { ...map };
    delete nextMap[transition.characterId];
    return { map: nextMap };
  }

  const existing = map[transition.characterId] ? normalizeSyncState(transition.characterId, map[transition.characterId]) : null;

  if (transition.type === 'ensure') {
    if (existing) {
      const next = resolveStatus({
        ...existing,
        hasCloud: existing.hasCloud || Boolean(transition.hasCloud),
      });
      return updateMap(map, next);
    }

    const created = buildDefaultSyncState(transition.characterId, Boolean(transition.hasCloud));
    return updateMap(map, created);
  }

  if (transition.type === 'set-cloud-availability') {
    const base = existing || buildDefaultSyncState(transition.characterId, transition.hasCloud);
    const next = resolveStatus({
      ...base,
      hasCloud: transition.hasCloud,
    });
    return updateMap(map, next);
  }

  if (transition.type === 'mark-local-draft-paths') {
    const changedPaths = cleanPaths(transition.changedPaths);
    if (!changedPaths.length) return { map, nextState: existing || undefined };

    const base = existing || buildDefaultSyncState(transition.characterId, false);
    const pendingPaths = Array.from(new Set([...base.pendingPaths, ...changedPaths]));
    const next = resolveStatus({
      ...base,
      localRevision: base.localRevision + 1,
      lastLocalChangeAt: atMs,
      lastSyncAttemptAt: atMs,
      pendingPaths,
      transportState: 'idle',
      transportMessage: null,
      lastSyncError: null,
    });
    return updateMap(map, next);
  }

  if (transition.type === 'mark-cloud-uploaded') {
    const base = existing || buildDefaultSyncState(transition.characterId, true);
    const nextRevision = Math.max(base.localRevision, base.cloudRevision);
    const next: CharacterSyncState = {
      ...base,
      hasCloud: true,
      cloudRevision: nextRevision,
      pendingPaths: [],
      conflictPaths: [],
      lastSyncAt: atMs,
      lastSyncAttemptAt: atMs,
      status: 'in-sync',
      transportState: 'synced',
      transportMessage: transition.message ?? 'Auto-synced just now',
      lastSyncError: null,
      counterBaseline: transition.counterBaseline ? { ...base.counterBaseline, ...transition.counterBaseline } : base.counterBaseline,
      conditionsBaseline: transition.conditionsBaseline ?? base.conditionsBaseline,
    };
    return updateMap(map, next);
  }

  if (transition.type === 'mark-cloud-downloaded') {
    const base = existing || buildDefaultSyncState(transition.characterId, true);
    const nextRevision = Math.max(base.localRevision, base.cloudRevision + 1);
    const next: CharacterSyncState = {
      ...base,
      hasCloud: true,
      localRevision: nextRevision,
      cloudRevision: nextRevision,
      pendingPaths: [],
      conflictPaths: [],
      lastSyncAt: atMs,
      lastSyncAttemptAt: atMs,
      status: 'in-sync',
      transportState: 'downloading',
      transportMessage: transition.message ?? 'Downloaded latest cloud revision',
      lastSyncError: null,
    };
    return updateMap(map, next);
  }

  if (transition.type === 'mark-conflict') {
    const base = existing || buildDefaultSyncState(transition.characterId, true);
    const conflictPaths = Array.from(new Set([...base.conflictPaths, ...cleanPaths(transition.conflictPaths)]));
    const next: CharacterSyncState = {
      ...base,
      hasCloud: true,
      conflictPaths,
      status: 'conflict',
      transportState: 'error',
      transportMessage: transition.message ?? 'Conflict requires review',
      lastSyncError: 'Conflict detected',
      lastSyncAttemptAt: atMs,
    };
    return updateMap(map, next);
  }

  if (transition.type === 'clear-conflicts') {
    if (!existing) return { map };
    const next = resolveStatus({
      ...existing,
      conflictPaths: [],
      transportState: 'idle',
      transportMessage: null,
      lastSyncError: null,
    });
    return updateMap(map, next);
  }

  if (transition.type === 'record-remote-sync-state') {
    const base = existing || buildDefaultSyncState(transition.characterId, true);
    const next: CharacterSyncState = {
      ...base,
      seenHistoryEntryIds: transition.seenHistoryEntryIds,
      lastSyncAt: typeof transition.serverSyncAtMs === 'number' ? transition.serverSyncAtMs : base.lastSyncAt,
      counterBaseline: transition.counterBaseline ? { ...base.counterBaseline, ...transition.counterBaseline } : base.counterBaseline,
      conditionsBaseline: transition.conditionsBaseline ?? base.conditionsBaseline,
    };
    return updateMap(map, next);
  }

  if (transition.type === 'set-transport') {
    const base = existing || buildDefaultSyncState(transition.characterId, false);
    const next: CharacterSyncState = {
      ...base,
      transportState: transition.state,
      transportMessage: transition.message ?? null,
      lastSyncAttemptAt: atMs,
    };
    return updateMap(map, next);
  }

  const base = existing || buildDefaultSyncState(transition.characterId, false);
  const next: CharacterSyncState = {
    ...base,
    transportState: 'error',
    transportMessage: transition.message || 'Sync failed',
    lastSyncError: transition.message || 'Sync failed',
    lastSyncAttemptAt: atMs,
  };
  return updateMap(map, next);
}

export function buildUploadPlan(args: BuildUploadPlanArgs): BuildUploadPlanResult {
  const pendingPaths = cleanPaths(args.syncState?.pendingPaths || []);
  const explicitHistoryPaths = cleanPaths(args.historyPaths || []);

  let historyPaths = explicitHistoryPaths.length ? explicitHistoryPaths : pendingPaths;
  if (!historyPaths.length) {
    historyPaths = cleanPaths(args.fallbackPath ? [args.fallbackPath] : []);
  }

  return {
    pendingPaths,
    pendingCount: pendingPaths.length,
    historyPaths,
  };
}

function computePendingSections(pendingPaths: string[]): Set<SyncSection> {
  const sections = new Set<SyncSection>();
  pendingPaths.forEach((path) => {
    const section = pathToSyncSection(path);
    if (section !== 'unknown') sections.add(section);
  });
  return sections;
}

// COL-4: hp.current/hp.temp are now written as FieldValue.increment() deltas, which have no
// upper/lower bound of their own — two concurrent deltas can (correctly, per their own math)
// push the server total above hp.max or below 0 momentarily. Clamp is purely a display
// concern: it never feeds back into a write, so it can't itself cause a conflict or lose data.
function clampHp(hp: CharacterViewModel['hp']): CharacterViewModel['hp'] {
  if (!hp) return hp;
  const max = typeof hp.max === 'number' ? hp.max : hp.current;
  const current = Math.min(Math.max(hp.current, 0), max);
  return current === hp.current ? hp : { ...hp, current };
}

// COL-4: last-known-synced value for every counter/condition field this device can observe on
// a CharacterViewModel — the raw material for CharacterSyncState.counterBaseline/
// conditionsBaseline. Keys match the dotted Firestore field paths the repository writes
// (see characterCloudRepository.ts) so the two layers never disagree on naming.
export function extractCounterSnapshot(character: CharacterViewModel): Record<string, number> {
  const snapshot: Record<string, number> = {};
  if (character.hp) {
    snapshot['hp.current'] = character.hp.current ?? 0;
    snapshot['hp.temp'] = character.hp.temp ?? 0;
  }
  if (character.deathSaves) {
    snapshot['deathSaves.successes'] = character.deathSaves.successes ?? 0;
    snapshot['deathSaves.failures'] = character.deathSaves.failures ?? 0;
  }
  Object.entries(character.spells?.spellSlots || {}).forEach(([level, slot]) => {
    if (slot && typeof slot.used === 'number') snapshot[`spells.spellSlots.${level}.used`] = slot.used;
  });
  (character.customResources || []).forEach((resource) => {
    if (resource?.id) snapshot[`customResources.${resource.id}.current`] = resource.current ?? 0;
  });
  (character.customTrackers || []).forEach((tracker) => {
    if (tracker?.id) snapshot[`customTrackers.${tracker.id}.current`] = tracker.current ?? 0;
  });
  return snapshot;
}

export function extractConditionsSnapshot(character: CharacterViewModel): string[] {
  return Array.from(new Set((character.conditions || []).map((condition) => String(condition || '').trim()).filter(Boolean)));
}

// Which counter-snapshot keys a given set of sync-path tags actually writes — mirrors
// NARROW_SYNC_PATH_FIELD_MAP's per-tag granularity (not the coarser SyncSection grouping),
// so advancing the baseline after an upload never touches a counter that upload didn't
// actually write (that would freeze out a different, still-pending edit's own delta).
const COUNTER_SCOPE_BY_TAG: Record<string, string[]> = {
  'combat.hp': ['hp.current', 'hp.temp'],
  'combat.death-saves': ['deathSaves.successes', 'deathSaves.failures'],
  'magic.slots': ['spells.spellSlots.'],
  'homebrew.resources': ['customResources.'],
  'homebrew.trackers': ['customTrackers.'],
};

function isKeyInTagScope(key: string, scopeEntries: string[]): boolean {
  return scopeEntries.some((entry) => (entry.endsWith('.') ? key.startsWith(entry) : key === entry));
}

export function counterKeysInScope(historyPaths: string[]): string[] {
  const scope: string[] = [];
  historyPaths.forEach((path) => {
    const entries = COUNTER_SCOPE_BY_TAG[String(path || '').trim()];
    if (entries) scope.push(...entries);
  });
  return scope;
}

export function conditionsInScope(historyPaths: string[]): boolean {
  return historyPaths.some((path) => pathToSyncSection(path) === 'combat.conditions');
}

function pickInScopeSnapshot(snapshot: Record<string, number>, scopeEntries: string[]): Record<string, number> {
  const picked: Record<string, number> = {};
  Object.keys(snapshot).forEach((key) => {
    if (isKeyInTagScope(key, scopeEntries)) picked[key] = snapshot[key];
  });
  return picked;
}

// Which counter-snapshot key-prefixes a still-pending local edit is holding back — used when
// a remote snapshot arrives so the baseline only advances for fields that upload actually
// left untouched, never for a field this device has its own un-uploaded delta against.
function computeNextCounterBaseline(
  oldBaseline: Record<string, number> | undefined,
  remoteCharacter: CharacterViewModel,
  pendingSections: Set<SyncSection>,
): Record<string, number> {
  const remoteSnapshot = extractCounterSnapshot(remoteCharacter);
  const next = { ...(oldBaseline || {}) };
  const vitalsHeld = pendingSections.has('combat.vitals') || pendingSections.has('combat');
  const magicHeld = pendingSections.has('magic');
  const resourcesHeld = pendingSections.has('homebrew.resources') || pendingSections.has('homebrew');
  const trackersHeld = pendingSections.has('homebrew.trackers') || pendingSections.has('homebrew');

  Object.keys(remoteSnapshot).forEach((key) => {
    if ((key.startsWith('hp.') || key.startsWith('deathSaves.')) && vitalsHeld) return;
    if (key.startsWith('spells.spellSlots.') && magicHeld) return;
    if (key.startsWith('customResources.') && resourcesHeld) return;
    if (key.startsWith('customTrackers.') && trackersHeld) return;
    next[key] = remoteSnapshot[key];
  });

  return next;
}

function computeNextConditionsBaseline(
  oldBaseline: string[] | undefined,
  remoteCharacter: CharacterViewModel,
  pendingSections: Set<SyncSection>,
): string[] {
  if (pendingSections.has('combat.conditions')) return oldBaseline || [];
  return extractConditionsSnapshot(remoteCharacter);
}

function mergeCharacterBySections(
  local: CharacterViewModel,
  remote: CharacterViewModel,
  pendingPaths: string[],
  normalizeCharacter?: (character: CharacterViewModel) => CharacterViewModel,
): CharacterViewModel {
  const pendingSections = computePendingSections(pendingPaths);

  const next = { ...local };

  if (!pendingSections.has('overview')) {
    next.name = remote.name;
    next.class = remote.class;
    next.subclass = remote.subclass;
    next.race = remote.race;
    next.subrace = remote.subrace;
    next.background = remote.background;
    next.level = remote.level;
    next.experience = remote.experience;
    next.stats = remote.stats;
    next.skills = remote.skills;
    next.savingThrows = remote.savingThrows;
    next.traits = remote.traits;
    next.featuresAndTraits = remote.featuresAndTraits;
    next.proficiencyBonus = remote.proficiencyBonus;
    // COL-4: moved from the old combat bucket — the write tag is overview.session-mode,
    // so the merge gate must match, or a pending sessionMode toggle gets silently
    // clobbered by an unrelated combat merge.
    next.sessionMode = remote.sessionMode;
  }

  if (!pendingSections.has('combat.vitals') && !pendingSections.has('combat')) {
    // COL-4: remote.hp.current is the server-authoritative sum of every device's increment()
    // deltas — this assignment takes it as-is exactly once, it never re-adds a local delta on
    // top (mergeCharacterBySections either takes the whole remote value for a field or keeps
    // the whole local value; it never combines the two), so this can't double-count.
    next.hp = clampHp(remote.hp);
    next.deathSaves = remote.deathSaves;
  }

  if (!pendingSections.has('combat.defense') && !pendingSections.has('combat')) {
    next.ac = remote.ac;
    // COL-4: armorClassDetails was never assigned here before — a pre-existing gap
    // where it silently never synced from remote. Belongs with ac.
    next.armorClassDetails = remote.armorClassDetails;
    next.initiative = remote.initiative;
    next.speed = remote.speed;
    next.hitDice = remote.hitDice;
  }

  if (!pendingSections.has('combat.conditions') && !pendingSections.has('combat')) {
    next.conditions = remote.conditions;
  }

  if (!pendingSections.has('combat.weapons') && !pendingSections.has('combat')) {
    next.weapons = remote.weapons;
  }

  if (!pendingSections.has('combat.actions') && !pendingSections.has('combat')) {
    next.combatTemplates = remote.combatTemplates;
  }

  if (!pendingSections.has('magic')) {
    next.spells = remote.spells;
  }

  if (!pendingSections.has('inventory')) {
    next.inventory = remote.inventory;
    next.coins = remote.coins;
    next.customCoins = remote.customCoins;
    next.tools = remote.tools;
    next.proficiencies = remote.proficiencies;
  }

  if (!pendingSections.has('notes')) {
    next.notes = remote.notes;
    next.backstory = remote.backstory;
    next.campaign = remote.campaign;
    next.campaignId = remote.campaignId;
    next.alliesAndOrganizations = remote.alliesAndOrganizations;
    next.notesBlocks = remote.notesBlocks;
    next.customNotesGroups = remote.customNotesGroups;
  }

  if (!pendingSections.has('homebrew.resources') && !pendingSections.has('homebrew')) {
    next.customResources = remote.customResources;
  }

  if (!pendingSections.has('homebrew.trackers') && !pendingSections.has('homebrew')) {
    next.customTrackers = remote.customTrackers;
    next.customResetRules = remote.customResetRules;
  }

  if (!pendingSections.has('homebrew.fields') && !pendingSections.has('homebrew')) {
    next.characterTemplateId = remote.characterTemplateId;
    next.customFields = remote.customFields;
    next.customFeatureBlocks = remote.customFeatureBlocks;
    next.customSpellLists = remote.customSpellLists;
  }

  if (!pendingSections.has('homebrew.sections') && !pendingSections.has('homebrew')) {
    next.customSections = remote.customSections;
    next.homebrewEntries = remote.homebrewEntries;
  }

  return normalizeCharacter ? normalizeCharacter(next) : next;
}

export function reconcileRemoteSnapshot(args: ReconcileRemoteSnapshotArgs): ReconcileRemoteSnapshotResult {
  const pendingPaths = cleanPaths(args.syncState?.pendingPaths || []);
  const remotePathsSinceLastSync = cleanPaths(args.remotePathsSinceLastSync || []);

  if (!pendingPaths.length) {
    // No pending local edits at all: nothing is held back, so the whole counter/conditions
    // baseline advances to the remote snapshot's values.
    const character = args.normalizeCharacter ? args.normalizeCharacter(args.remoteCharacter) : args.remoteCharacter;
    return {
      action: 'replace',
      character: { ...character, hp: clampHp(character.hp) },
      pendingPaths,
      remotePathsSinceLastSync,
      counterBaseline: extractCounterSnapshot(args.remoteCharacter),
      conditionsBaseline: extractConditionsSnapshot(args.remoteCharacter),
    };
  }

  const conflictPaths = collectConflictPaths(pendingPaths, remotePathsSinceLastSync);
  if (conflictPaths.length) {
    return {
      action: 'conflict',
      conflictPaths,
      pendingPaths,
      remotePathsSinceLastSync,
    };
  }

  if (remotePathsSinceLastSync.length) {
    const pendingSections = computePendingSections(pendingPaths);
    return {
      action: 'merge',
      character: mergeCharacterBySections(args.localCharacter, args.remoteCharacter, pendingPaths, args.normalizeCharacter),
      pendingPaths,
      remotePathsSinceLastSync,
      counterBaseline: computeNextCounterBaseline(args.syncState?.counterBaseline, args.remoteCharacter, pendingSections),
      conditionsBaseline: computeNextConditionsBaseline(args.syncState?.conditionsBaseline, args.remoteCharacter, pendingSections),
    };
  }

  return {
    action: 'noop',
    pendingPaths,
    remotePathsSinceLastSync,
  };
}

// COL-5: entry.atMs is the writer device's own clock, so comparing it against this device's
// lastSyncAt compares two different clocks and breaks under skew. Instead, diff changeHistory
// against the set of entry ids this device has already accounted for — clock-independent.
export function computeRemoteHistorySync(args: {
  history: CharacterChangeHistoryEntry[];
  selfUid: string;
  seenHistoryEntryIds?: string[];
}): { remotePathsSinceLastSync: string[]; seenHistoryEntryIds: string[] } {
  const priorSeen = new Set(args.seenHistoryEntryIds || []);
  const nextSeen: string[] = [];
  const paths: string[] = [];

  for (const entry of args.history) {
    if (!entry.id) continue;
    nextSeen.push(entry.id);
    if (priorSeen.has(entry.id)) continue;
    if (!entry.uid || entry.uid === args.selfUid) continue;
    paths.push(...(entry.paths || []));
  }

  return { remotePathsSinceLastSync: paths, seenHistoryEntryIds: nextSeen };
}

// Same id-extraction as computeRemoteHistorySync, but for the raw doc fetched directly in
// resolveConflict's keep-cloud path (not the sanitized CharacterChangeHistoryEntry[] shape).
export function computeSeenEntryIdsFromRawHistory(rawHistory: unknown): string[] {
  if (!Array.isArray(rawHistory)) return [];
  const ids: string[] = [];
  for (const entry of rawHistory) {
    const id = entry && typeof entry === 'object' ? (entry as Record<string, unknown>).id : undefined;
    if (typeof id === 'string' && id) ids.push(id);
  }
  return ids;
}

export async function syncToCloud(args: SyncToCloudArgs): Promise<SyncToCloudResult> {
  const plan = buildUploadPlan({
    syncState: args.syncState,
    historyPaths: args.historyPaths,
    fallbackPath: args.fallbackPath,
  });

  const fallbackCharacter = args.character;

  if (!args.isOnline) {
    const defaultOfflineMessage = plan.pendingCount ? `Офлайн-черга: ${plan.pendingCount} шлях(ів) очікує` : 'Офлайн-черга';
    await args.syncPort.setSyncTransport(args.character.id, 'idle', args.offlineMessage || defaultOfflineMessage);
    return {
      status: 'offline',
      pendingCount: plan.pendingCount,
      historyPaths: plan.historyPaths,
      targetCharacter: fallbackCharacter,
      message: args.offlineMessage || defaultOfflineMessage,
    };
  }

  await args.syncPort.ensureCharacterSync(args.character.id, true);
  await args.syncPort.setSyncTransport(args.character.id, args.startTransportState || 'syncing', args.syncingMessage || 'Синхронізація...');

  try {
    // COL-4: the repository computes its own increment()/arrayUnion()/arrayRemove() deltas
    // from these baselines — this call only forwards the last-known-synced values, it never
    // pre-computes a delta itself (see characterCloudRepository.ts for why: array-shaped
    // counters need a transactional by-id merge the repository alone can safely perform).
    const result = await characterCloudRepository.upsertFromLocal(characterMapper.entityToDto(args.character), {
      historyPaths: plan.historyPaths,
      actorRole: args.actorRole,
      counterBaseline: args.syncState?.counterBaseline,
      conditionsBaseline: args.syncState?.conditionsBaseline,
    });

    const targetCharacter = result?.id && result.id !== args.character.id ? { ...args.character, id: result.id } : args.character;
    await args.syncPort.ensureCharacterSync(targetCharacter.id, true);
    await args.syncPort.setCloudAvailability(targetCharacter.id, true);

    // Advance the baseline only for the counter/condition keys this specific upload actually
    // wrote (see counterKeysInScope) — an unrelated still-pending edit's own delta must not be
    // silently zeroed out by prematurely treating its field as "known-synced". A brand-new doc
    // or an untagged/unknown-tag fallback write (mapSyncPathsToFieldPaths -> 'fallback') is the
    // one case that genuinely writes the WHOLE document, absolute values and all — the baseline
    // must advance for everything then, or the next narrow upload for an untouched-by-this-call
    // field would recompute (and resend) the same delta a second time.
    const isFullDocumentWrite = Boolean(result?.created) || mapSyncPathsToFieldPaths(plan.historyPaths).kind === 'fallback';
    const counterSnapshotNow = extractCounterSnapshot(args.character);
    const scopeEntries = counterKeysInScope(plan.historyPaths);
    const nextCounterBaseline = isFullDocumentWrite
      ? { ...(args.syncState?.counterBaseline || {}), ...counterSnapshotNow }
      : scopeEntries.length
        ? { ...(args.syncState?.counterBaseline || {}), ...pickInScopeSnapshot(counterSnapshotNow, scopeEntries) }
        : undefined;
    const nextConditionsBaseline =
      isFullDocumentWrite || conditionsInScope(plan.historyPaths) ? extractConditionsSnapshot(args.character) : undefined;

    await args.syncPort.markCloudUploaded(
      targetCharacter.id,
      nextCounterBaseline || nextConditionsBaseline
        ? { counterBaseline: nextCounterBaseline, conditionsBaseline: nextConditionsBaseline }
        : undefined,
    );
    await args.syncPort.setSyncTransport(targetCharacter.id, 'synced', args.syncedMessage || 'Синхронізовано');

    return {
      status: 'synced',
      pendingCount: plan.pendingCount,
      historyPaths: plan.historyPaths,
      targetCharacter,
      created: Boolean(result?.created),
      updated: Boolean(result?.updated),
    };
  } catch (error) {
    const message = String((error as Error)?.message || 'Помилка синхронізації');
    const classified = classifySyncError(error);
    await args.syncPort.markSyncError(args.character.id, message);

    if (args.syncPort.markConflict && classified.isConflict) {
      const fallbackConflictPath = args.conflictFallbackPath || 'overview.identity';
      const conflictPaths = plan.historyPaths.length ? plan.historyPaths : [fallbackConflictPath];
      await args.syncPort.markConflict(args.character.id, conflictPaths);
    } else if (classified.severity === 'unexpected') {
      // COL-7: expected/offline-like codes stay a silent queue (unchanged); anything else
      // is a real write failure the user must be told about, not just a quiet state badge.
      trackProductEvent('sync_failed', { code: classified.code || 'unknown' });

      if (classified.code === 'firestore/permission-denied') {
        trackProductEvent('permission_denied_on_upload');
        toast.error(i18n.t('character:sync.unexpectedErrorTitle'), i18n.t('character:sync.permissionDeniedMessage'));
      } else {
        toast.error(i18n.t('character:sync.unexpectedErrorTitle'), i18n.t('character:sync.unexpectedErrorMessage'));
      }
    }

    return {
      status: 'error',
      message,
      pendingCount: plan.pendingCount,
      historyPaths: plan.historyPaths,
      targetCharacter: fallbackCharacter,
    };
  }
}

export async function resolveConflict(args: ResolveConflictArgs): Promise<ResolveConflictResult> {
  if (args.strategy === 'later') {
    await args.syncPort.clearConflicts(args.character.id);
    return { status: 'deferred' };
  }

  if (args.strategy === 'keep-local') {
    const plan = buildUploadPlan({ syncState: args.syncState, fallbackPath: 'overview.identity' });
    const result = await syncToCloud({
      character: args.character,
      syncState: args.syncState,
      actorRole: args.actorRole,
      syncPort: args.syncPort,
      isOnline: args.isOnline,
      historyPaths: plan.historyPaths,
      startTransportState: 'uploading',
      syncingMessage: 'Застосування локальної версії до хмари...',
      syncedMessage: 'Конфлікт вирішено локальною версією',
      conflictFallbackPath: 'overview.identity',
    });

    if (result.status !== 'synced') {
      if (result.status === 'offline') {
        return { status: 'error', message: 'Активна офлайн-черга. Відновіть з’єднання і повторіть синхронізацію.' };
      }
      return { status: 'error', message: result.message || 'Не вдалося вирішити конфлікт локальною версією' };
    }

    await args.syncPort.clearConflicts(result.targetCharacter.id);
    return { status: 'resolved-local', targetCharacter: result.targetCharacter };
  }

  try {
    const doc = await characterCloudRepository.fetchById(args.character.id);
    if (!doc) {
      return { status: 'error', message: 'Не вдалося отримати хмарну версію персонажа' };
    }

    const mapped = mapCloudCharacterToLocalDto(doc as Record<string, unknown>);
    const normalized = args.normalizeCharacter ? args.normalizeCharacter(mapped) : mapped;

    // COL-5: keep-cloud is the one resolution path that never triggers a new Firestore write
    // from this device, so no follow-up onSnapshot will bump the cursor on its own — bump it
    // here using the doc we just fetched, or the conflicting entries stay "unseen" forever and
    // keep re-triggering false conflicts against unrelated future remote changes.
    const seenHistoryEntryIds = computeSeenEntryIdsFromRawHistory((doc as { changeHistory?: unknown }).changeHistory);
    const serverSyncAtMs = timestampToMillis((doc as { lastChangeAt?: unknown }).lastChangeAt);
    if (args.syncPort.recordRemoteSyncState) {
      // keep-cloud fully replaces local with the fetched cloud doc — nothing is held back, so
      // (like the 'replace' branch of reconcileRemoteSnapshot) the whole baseline advances.
      await args.syncPort.recordRemoteSyncState(normalized.id, {
        seenHistoryEntryIds,
        serverSyncAtMs,
        counterBaseline: extractCounterSnapshot(normalized),
        conditionsBaseline: extractConditionsSnapshot(normalized),
      });
    }

    await args.syncPort.markCloudDownloaded(normalized.id);
    await args.syncPort.clearConflicts(normalized.id);
    await args.syncPort.setSyncTransport(normalized.id, 'downloading', 'Конфлікт вирішено хмарною версією');

    return {
      status: 'resolved-cloud',
      targetCharacter: { ...normalized, hp: clampHp(normalized.hp) },
    };
  } catch (error) {
    return {
      status: 'error',
      message: String((error as Error)?.message || 'Не вдалося вирішити конфлікт хмарною версією'),
    };
  }
}
