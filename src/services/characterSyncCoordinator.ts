import type { CharacterSyncMap, CharacterSyncState, SyncTransportState } from '@/types/Sync';
import type { CharacterViewModel } from '@/types/Character';
import type { CharacterActorRole } from '@/repositories/characterCloudRepository';
import { characterCloudRepository } from '@/repositories/characterCloudRepository';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import { resolveSyncStatus, collectConflictPaths, pathToSyncSection } from '@/shared/helpers/sync/conflictPolicy';
import { characterMapper } from '@/domain/mappers';

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
  | 'remove-character';

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

type MarkCloudUploadedTransition = TransitionBase & {
  type: 'mark-cloud-uploaded';
  message?: string | null;
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
  | RemoveCharacterTransition;

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
  | { action: 'merge'; character: CharacterViewModel; pendingPaths: string[]; remotePathsSinceLastSync: string[] }
  | { action: 'replace'; character: CharacterViewModel; pendingPaths: string[]; remotePathsSinceLastSync: string[] }
  | { action: 'noop'; pendingPaths: string[]; remotePathsSinceLastSync: string[] };

export interface CharacterSyncUploadPort {
  ensureCharacterSync: (characterId: string, hasCloud?: boolean) => Promise<void>;
  setCloudAvailability: (characterId: string, hasCloud: boolean) => Promise<void>;
  markCloudUploaded: (characterId: string) => Promise<void>;
  setSyncTransport: (characterId: string, state: SyncTransportState, message?: string | null) => Promise<void>;
  markSyncError: (characterId: string, message: string) => Promise<void>;
  markConflict?: (characterId: string, conflictPaths: string[]) => Promise<void>;
}

export interface CharacterSyncConflictPort extends CharacterSyncUploadPort {
  markCloudDownloaded: (characterId: string) => Promise<void>;
  clearConflicts: (characterId: string) => Promise<void>;
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
  return Array.from(new Set(normalized));
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
    transportState: raw.transportState || 'idle',
    transportMessage: raw.transportMessage ?? null,
    lastSyncError: raw.lastSyncError ?? null,
    lastSyncAttemptAt: raw.lastSyncAttemptAt ?? null,
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

  const existing = map[transition.characterId]
    ? normalizeSyncState(transition.characterId, map[transition.characterId])
    : null;

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

function mergeCharacterBySections(
  local: CharacterViewModel,
  remote: CharacterViewModel,
  pendingPaths: string[],
  normalizeCharacter?: (character: CharacterViewModel) => CharacterViewModel,
): CharacterViewModel {
  const pendingSections = new Set<string>();
  pendingPaths.forEach((path) => {
    const section = pathToSyncSection(path);
    if (section !== 'unknown') pendingSections.add(section);
  });

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
  }

  if (!pendingSections.has('combat')) {
    next.hp = remote.hp;
    next.ac = remote.ac;
    next.initiative = remote.initiative;
    next.speed = remote.speed;
    next.hitDice = remote.hitDice;
    next.deathSaves = remote.deathSaves;
    next.weapons = remote.weapons;
    next.conditions = remote.conditions;
    next.combatTemplates = remote.combatTemplates;
    next.sessionMode = remote.sessionMode;
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

  if (!pendingSections.has('homebrew')) {
    next.characterTemplateId = remote.characterTemplateId;
    next.customFields = remote.customFields;
    next.customTrackers = remote.customTrackers;
    next.customSections = remote.customSections;
    next.customResources = remote.customResources;
    next.customResetRules = remote.customResetRules;
    next.customFeatureBlocks = remote.customFeatureBlocks;
    next.customSpellLists = remote.customSpellLists;
    next.homebrewEntries = remote.homebrewEntries;
  }

  return normalizeCharacter ? normalizeCharacter(next) : next;
}

export function reconcileRemoteSnapshot(args: ReconcileRemoteSnapshotArgs): ReconcileRemoteSnapshotResult {
  const pendingPaths = cleanPaths(args.syncState?.pendingPaths || []);
  const remotePathsSinceLastSync = cleanPaths(args.remotePathsSinceLastSync || []);

  if (!pendingPaths.length) {
    return {
      action: 'replace',
      character: args.normalizeCharacter ? args.normalizeCharacter(args.remoteCharacter) : args.remoteCharacter,
      pendingPaths,
      remotePathsSinceLastSync,
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
    return {
      action: 'merge',
      character: mergeCharacterBySections(args.localCharacter, args.remoteCharacter, pendingPaths, args.normalizeCharacter),
      pendingPaths,
      remotePathsSinceLastSync,
    };
  }

  return {
    action: 'noop',
    pendingPaths,
    remotePathsSinceLastSync,
  };
}

export async function syncToCloud(args: SyncToCloudArgs): Promise<SyncToCloudResult> {
  const plan = buildUploadPlan({
    syncState: args.syncState,
    historyPaths: args.historyPaths,
    fallbackPath: args.fallbackPath,
  });

  const fallbackCharacter = args.character;

  if (!args.isOnline) {
    const defaultOfflineMessage = plan.pendingCount
      ? `Офлайн-черга: ${plan.pendingCount} шлях(ів) очікує`
      : 'Офлайн-черга';
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
  await args.syncPort.setSyncTransport(
    args.character.id,
    args.startTransportState || 'syncing',
    args.syncingMessage || 'Синхронізація...',
  );

  try {
    const result = await characterCloudRepository.upsertFromLocal(characterMapper.entityToDto(args.character), {
      historyPaths: plan.historyPaths,
      actorRole: args.actorRole,
    });

    const targetCharacter = result?.id && result.id !== args.character.id ? { ...args.character, id: result.id } : args.character;
    await args.syncPort.ensureCharacterSync(targetCharacter.id, true);
    await args.syncPort.setCloudAvailability(targetCharacter.id, true);
    await args.syncPort.markCloudUploaded(targetCharacter.id);
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
    await args.syncPort.markSyncError(args.character.id, message);

    if (args.syncPort.markConflict && message.toLowerCase().includes('conflict')) {
      const fallbackConflictPath = args.conflictFallbackPath || 'overview.identity';
      const conflictPaths = plan.historyPaths.length ? plan.historyPaths : [fallbackConflictPath];
      await args.syncPort.markConflict(args.character.id, conflictPaths);
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

    await args.syncPort.markCloudDownloaded(normalized.id);
    await args.syncPort.clearConflicts(normalized.id);
    await args.syncPort.setSyncTransport(normalized.id, 'downloading', 'Конфлікт вирішено хмарною версією');

    return {
      status: 'resolved-cloud',
      targetCharacter: normalized,
    };
  } catch (error) {
    return {
      status: 'error',
      message: String((error as Error)?.message || 'Не вдалося вирішити конфлікт хмарною версією'),
    };
  }
}

