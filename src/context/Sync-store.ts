import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CharacterSyncMap, CharacterSyncState, SyncTransportState } from '@/types/Sync';
import { resolveSyncStatus } from '@/shared/helpers/sync/conflictPolicy';

interface SyncStore {
  syncByCharacter: CharacterSyncMap;
  loadSyncMeta: () => Promise<void>;
  ensureCharacterSync: (characterId: string, hasCloud?: boolean) => Promise<void>;
  setCloudAvailability: (characterId: string, hasCloud: boolean) => Promise<void>;
  markLocalDraft: (characterId: string, changedPath: string) => Promise<void>;
  markLocalDraftPaths: (characterId: string, changedPaths: string[]) => Promise<void>;
  markCloudUploaded: (characterId: string) => Promise<void>;
  markCloudDownloaded: (characterId: string) => Promise<void>;
  markConflict: (characterId: string, conflictPaths: string[]) => Promise<void>;
  clearConflicts: (characterId: string) => Promise<void>;
  setSyncTransport: (characterId: string, state: SyncTransportState, message?: string | null) => Promise<void>;
  markSyncError: (characterId: string, message: string) => Promise<void>;
  removeCharacterSync: (characterId: string) => Promise<void>;
}

const STORAGE_KEY = 'CHARACTER_SYNC_META_V1';

function buildDefaultState(characterId: string, hasCloud = false): CharacterSyncState {
  return {
    characterId,
    hasCloud,
    localRevision: 0,
    cloudRevision: hasCloud ? 0 : 0,
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

function normalizeState(characterId: string, raw: Partial<CharacterSyncState> | null | undefined): CharacterSyncState {
  const fallback = buildDefaultState(characterId, Boolean(raw?.hasCloud));
  if (!raw) return fallback;

  return {
    ...fallback,
    ...raw,
    characterId,
    pendingPaths: Array.isArray(raw.pendingPaths) ? raw.pendingPaths : [],
    conflictPaths: Array.isArray(raw.conflictPaths) ? raw.conflictPaths : [],
    transportState: raw.transportState || 'idle',
    transportMessage: raw.transportMessage ?? null,
    lastSyncError: raw.lastSyncError ?? null,
    lastSyncAttemptAt: raw.lastSyncAttemptAt ?? null,
  };
}

async function persistSyncMap(map: CharacterSyncMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

const useSyncStore = create<SyncStore>((set, get) => ({
  syncByCharacter: {},

  loadSyncMeta: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(raw || '{}');
      if (parsed && typeof parsed === 'object') {
        const normalized: CharacterSyncMap = {};
        Object.entries(parsed as Record<string, Partial<CharacterSyncState>>).forEach(([id, entry]) => {
          normalized[id] = normalizeState(id, entry);
        });
        set({ syncByCharacter: normalized });
      }
    } catch {}
  },

  ensureCharacterSync: async (characterId, hasCloud = false) => {
    const current = get().syncByCharacter[characterId];
    if (current) {
      const normalizedCurrent = normalizeState(characterId, current);
      const next: CharacterSyncState = {
        ...normalizedCurrent,
        hasCloud,
        status: resolveSyncStatus({
          hasCloud,
          hasPendingPaths: normalizedCurrent.pendingPaths.length > 0,
          hasConflictPaths: normalizedCurrent.conflictPaths.length > 0,
          localRevision: normalizedCurrent.localRevision,
          cloudRevision: normalizedCurrent.cloudRevision,
        }),
      };
      const merged = { ...get().syncByCharacter, [characterId]: next };
      set({ syncByCharacter: merged });
      await persistSyncMap(merged);
      return;
    }

    const created = buildDefaultState(characterId, hasCloud);
    const merged = { ...get().syncByCharacter, [characterId]: created };
    set({ syncByCharacter: merged });
    await persistSyncMap(merged);
  },

  setCloudAvailability: async (characterId, hasCloud) => {
    const existing = normalizeState(characterId, get().syncByCharacter[characterId] || buildDefaultState(characterId, hasCloud));
    const next: CharacterSyncState = {
      ...existing,
      hasCloud,
      status: resolveSyncStatus({
        hasCloud,
        hasPendingPaths: existing.pendingPaths.length > 0,
        hasConflictPaths: existing.conflictPaths.length > 0,
        localRevision: existing.localRevision,
        cloudRevision: existing.cloudRevision,
      }),
    };
    const merged = { ...get().syncByCharacter, [characterId]: next };
    set({ syncByCharacter: merged });
    await persistSyncMap(merged);
  },

  markLocalDraft: async (characterId, changedPath) => {
    const existing = normalizeState(characterId, get().syncByCharacter[characterId] || buildDefaultState(characterId, false));
    const nextPending = Array.from(new Set([...existing.pendingPaths, changedPath]));
    const next: CharacterSyncState = {
      ...existing,
      localRevision: existing.localRevision + 1,
      lastLocalChangeAt: Date.now(),
      lastSyncAttemptAt: Date.now(),
      pendingPaths: nextPending,
      transportState: 'idle',
      transportMessage: null,
      lastSyncError: null,
      status: resolveSyncStatus({
        hasCloud: existing.hasCloud,
        hasPendingPaths: nextPending.length > 0,
        hasConflictPaths: existing.conflictPaths.length > 0,
        localRevision: existing.localRevision + 1,
        cloudRevision: existing.cloudRevision,
      }),
    };
    const merged = { ...get().syncByCharacter, [characterId]: next };
    set({ syncByCharacter: merged });
    await persistSyncMap(merged);
  },

  markLocalDraftPaths: async (characterId, changedPaths) => {
    const existing = normalizeState(characterId, get().syncByCharacter[characterId] || buildDefaultState(characterId, false));
    const cleanPaths = (changedPaths || []).map((path) => String(path || '').trim()).filter(Boolean);
    if (!cleanPaths.length) return;

    const nextPending = Array.from(new Set([...existing.pendingPaths, ...cleanPaths]));
    const next: CharacterSyncState = {
      ...existing,
      localRevision: existing.localRevision + 1,
      lastLocalChangeAt: Date.now(),
      lastSyncAttemptAt: Date.now(),
      pendingPaths: nextPending,
      transportState: 'idle',
      transportMessage: null,
      lastSyncError: null,
      status: resolveSyncStatus({
        hasCloud: existing.hasCloud,
        hasPendingPaths: nextPending.length > 0,
        hasConflictPaths: existing.conflictPaths.length > 0,
        localRevision: existing.localRevision + 1,
        cloudRevision: existing.cloudRevision,
      }),
    };
    const merged = { ...get().syncByCharacter, [characterId]: next };
    set({ syncByCharacter: merged });
    await persistSyncMap(merged);
  },

  markCloudUploaded: async (characterId) => {
    const existing = normalizeState(characterId, get().syncByCharacter[characterId] || buildDefaultState(characterId, true));
    const nextRevision = Math.max(existing.localRevision, existing.cloudRevision);
    const next: CharacterSyncState = {
      ...existing,
      hasCloud: true,
      cloudRevision: nextRevision,
      pendingPaths: [],
      conflictPaths: [],
      lastSyncAt: Date.now(),
      lastSyncAttemptAt: Date.now(),
      status: 'in-sync',
      transportState: 'synced',
      transportMessage: 'Auto-synced just now',
      lastSyncError: null,
    };
    const merged = { ...get().syncByCharacter, [characterId]: next };
    set({ syncByCharacter: merged });
    await persistSyncMap(merged);
  },

  markCloudDownloaded: async (characterId) => {
    const existing = normalizeState(characterId, get().syncByCharacter[characterId] || buildDefaultState(characterId, true));
    const nextRevision = Math.max(existing.localRevision, existing.cloudRevision + 1);
    const next: CharacterSyncState = {
      ...existing,
      hasCloud: true,
      localRevision: nextRevision,
      cloudRevision: nextRevision,
      pendingPaths: [],
      conflictPaths: [],
      lastSyncAt: Date.now(),
      lastSyncAttemptAt: Date.now(),
      status: 'in-sync',
      transportState: 'downloading',
      transportMessage: 'Downloaded latest cloud revision',
      lastSyncError: null,
    };
    const merged = { ...get().syncByCharacter, [characterId]: next };
    set({ syncByCharacter: merged });
    await persistSyncMap(merged);
  },

  markConflict: async (characterId, conflictPaths) => {
    const existing = normalizeState(characterId, get().syncByCharacter[characterId] || buildDefaultState(characterId, true));
    const mergedConflicts = Array.from(new Set([...existing.conflictPaths, ...conflictPaths]));
    const next: CharacterSyncState = {
      ...existing,
      hasCloud: true,
      conflictPaths: mergedConflicts,
      status: 'conflict',
      transportState: 'error',
      transportMessage: 'Conflict requires review',
      lastSyncError: 'Conflict detected',
      lastSyncAttemptAt: Date.now(),
    };
    const merged = { ...get().syncByCharacter, [characterId]: next };
    set({ syncByCharacter: merged });
    await persistSyncMap(merged);
  },

  clearConflicts: async (characterId) => {
    const existing = get().syncByCharacter[characterId];
    if (!existing) return;
    const normalizedExisting = normalizeState(characterId, existing);
    const next: CharacterSyncState = {
      ...normalizedExisting,
      conflictPaths: [],
      status: resolveSyncStatus({
        hasCloud: normalizedExisting.hasCloud,
        hasPendingPaths: normalizedExisting.pendingPaths.length > 0,
        hasConflictPaths: false,
        localRevision: normalizedExisting.localRevision,
        cloudRevision: normalizedExisting.cloudRevision,
      }),
      transportState: 'idle',
      transportMessage: null,
      lastSyncError: null,
    };
    const merged = { ...get().syncByCharacter, [characterId]: next };
    set({ syncByCharacter: merged });
    await persistSyncMap(merged);
  },

  setSyncTransport: async (characterId, state, message = null) => {
    const existing = normalizeState(characterId, get().syncByCharacter[characterId] || buildDefaultState(characterId, false));
    const next: CharacterSyncState = {
      ...existing,
      transportState: state,
      transportMessage: message,
      lastSyncAttemptAt: Date.now(),
    };
    const merged = { ...get().syncByCharacter, [characterId]: next };
    set({ syncByCharacter: merged });
    await persistSyncMap(merged);
  },

  markSyncError: async (characterId, message) => {
    const existing = normalizeState(characterId, get().syncByCharacter[characterId] || buildDefaultState(characterId, false));
    const next: CharacterSyncState = {
      ...existing,
      transportState: 'error',
      transportMessage: message || 'Sync failed',
      lastSyncError: message || 'Sync failed',
      lastSyncAttemptAt: Date.now(),
    };
    const merged = { ...get().syncByCharacter, [characterId]: next };
    set({ syncByCharacter: merged });
    await persistSyncMap(merged);
  },

  removeCharacterSync: async (characterId) => {
    const next = { ...get().syncByCharacter };
    delete next[characterId];
    set({ syncByCharacter: next });
    await persistSyncMap(next);
  },
}));

export default useSyncStore;
