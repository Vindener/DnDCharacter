import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { uuid } from 'expo-modules-core';
import { useTranslation } from 'react-i18next';
import { subscribeMySheets, subscribeSharedWithMe } from '@/repositories/characterCloudRepository';
import { characterLocalRepository } from '@/repositories/characterLocalRepository';
import { fbAuth } from '@/services/firebase';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './DMSharedUpdates.style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import useCharacterStore from '@/context/Character-store';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import type { CharacterViewModel } from '@/types/Character';
import useSyncStore from '@/context/Sync-store';
import useAppRoleStore from '@/context/AppRole-store';
import { getShareDisplayStatus, getSyncDisplayStatus, isNetworkOnline, mapRoleToHistoryActor } from '@/shared/helpers/collaboration/status';
import { syncToCloud } from '@/services/characterSyncCoordinator';

type FilterKey = 'all' | 'mine' | 'shared' | 'needs-review';
const FILTER_KEYS: FilterKey[] = ['all', 'mine', 'shared', 'needs-review'];

type SharedRecord = {
  id: string;
  name: string;
  source: 'mine' | 'shared';
  updatedAtMs: number;
  payload: Record<string, unknown>;
  changeHistory: Array<{
    id: string;
    uid: string;
    actorRole?: string;
    summary?: string;
    atMs: number;
  }>;
};

const toMillis = (value: unknown): number => {
  if (!value || typeof value !== 'object') return 0;
  const cast = value as { toMillis?: () => number; seconds?: number };
  if (typeof cast.toMillis === 'function') return cast.toMillis();
  if (typeof cast.seconds === 'number') return cast.seconds * 1000;
  return 0;
};

const sanitizeHistory = (value: unknown): SharedRecord['changeHistory'] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): SharedRecord['changeHistory'][number] | null => {
      if (!item || typeof item !== 'object') return null;
      const cast = item as Record<string, unknown>;
      const actorRole = cast.actorRole === 'DM' || cast.actorRole === 'Player' ? cast.actorRole : undefined;
      return {
        id: String(cast.id || ''),
        uid: String(cast.uid || ''),
        actorRole,
        summary: typeof cast.summary === 'string' ? cast.summary : undefined,
        atMs: Number(cast.atMs || 0),
      };
    })
    .filter((item): item is SharedRecord['changeHistory'][number] => Boolean(item && item.id && item.uid));
};

const DMSharedUpdates = () => {
  const { t } = useTranslation(['dm', 'common']);
  const navigation = useNavigation<StackNavigationProp<DMStackParamList, 'DMSharedUpdates'>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const characters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);
  const syncByCharacter = useSyncStore((s) => s.syncByCharacter);
  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const setCloudAvailability = useSyncStore((s) => s.setCloudAvailability);
  const markCloudUploaded = useSyncStore((s) => s.markCloudUploaded);
  const setSyncTransport = useSyncStore((s) => s.setSyncTransport);
  const markSyncError = useSyncStore((s) => s.markSyncError);
  const roleMode = useAppRoleStore((s) => s.role);
  const netInfo = useNetInfo();

  const [authVersion, setAuthVersion] = useState(0);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [mySheets, setMySheets] = useState<Record<string, unknown>[]>([]);
  const [sharedSheets, setSharedSheets] = useState<Record<string, unknown>[]>([]);
  const [reviewedMap, setReviewedMap] = useState<Record<string, number>>({});
  const isOnline = isNetworkOnline(netInfo.isConnected);

  useEffect(() => {
    characterLocalRepository
      .loadSharedUpdatesReviewedMap()
      .then((parsed) => {
        setReviewedMap(parsed);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!fbAuth.currentUser) {
      setMySheets([]);
      setSharedSheets([]);
      return;
    }

    const unsubMine = subscribeMySheets((list) => setMySheets((list || []) as Record<string, unknown>[]));
    const unsubShared = subscribeSharedWithMe((list) => setSharedSheets((list || []) as Record<string, unknown>[]));

    return () => {
      if (typeof unsubMine === 'function') unsubMine();
      if (typeof unsubShared === 'function') unsubShared();
    };
  }, [authVersion]);

  useEffect(() => {
    const auth = fbAuth.onAuthStateChanged(() => {
      setAuthVersion((prev) => prev + 1);
    });
    return auth;
  }, []);

  const records = useMemo<SharedRecord[]>(() => {
    const mine = mySheets.map((sheet) => ({
      id: String(sheet.id || ''),
      name: String(sheet.name || t('dm:sharedUpdates.characterFallback')),
      source: 'mine' as const,
      updatedAtMs: toMillis(sheet.updatedAt),
      payload: sheet,
      changeHistory: sanitizeHistory(sheet.changeHistory),
    }));
    const shared = sharedSheets.map((sheet) => ({
      id: String(sheet.id || ''),
      name: String(sheet.name || t('dm:sharedUpdates.characterFallback')),
      source: 'shared' as const,
      updatedAtMs: toMillis(sheet.updatedAt),
      payload: sheet,
      changeHistory: sanitizeHistory(sheet.changeHistory),
    }));

    const merged = [...mine, ...shared];
    return merged.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }, [mySheets, sharedSheets, t]);

  const withReviewState = useMemo(() => {
    return records.map((record) => {
      const reviewedAt = reviewedMap[record.id] || 0;
      const needsReview = record.updatedAtMs > reviewedAt;
      const syncStatus = getSyncDisplayStatus(syncByCharacter[record.id], netInfo.isConnected);
      const shareStatus = getShareDisplayStatus({
        isSharedSheet: record.source === 'shared' || Array.isArray(record.payload.editors),
        role: roleMode,
        source: record.source === 'shared' ? 'shared' : 'mine',
      });
      const latestHistory = record.changeHistory.slice().sort((a, b) => (b.atMs || 0) - (a.atMs || 0))[0];
      return {
        ...record,
        reviewedAt,
        needsReview,
        syncStatus,
        shareStatus,
        latestHistory,
      };
    });
  }, [netInfo.isConnected, records, reviewedMap, roleMode, syncByCharacter]);

  const filtered = useMemo(() => {
    if (filter === 'all') return withReviewState;
    if (filter === 'needs-review') return withReviewState.filter((item) => item.needsReview);
    return withReviewState.filter((item) => item.source === filter);
  }, [filter, withReviewState]);

  const persistReviewed = async (next: Record<string, number>) => {
    setReviewedMap(next);
    try {
      await characterLocalRepository.saveSharedUpdatesReviewedMap(next);
    } catch (_error) {
      /* intentionally ignored */
    }
  };

  const markReviewed = async (id: string, updatedAtMs: number) => {
    const next = { ...reviewedMap, [id]: Math.max(Date.now(), updatedAtMs) };
    await persistReviewed(next);
  };

  const ensureLocalCharacter = async (doc: Record<string, unknown>): Promise<CharacterViewModel> => {
    const mapped = mapCloudCharacterToLocalDto(doc);
    const existing = characters.find((character) => character.id === mapped.id);
    if (existing) {
      await updateCharacter(existing.id, mapped);
    } else {
      await addCharacter(mapped);
    }
    return mapped;
  };

  const openInHeroes = async (doc: Record<string, unknown>) => {
    const character = await ensureLocalCharacter(doc);
    setCurrentCharacterId(character.id);
    const root = navigation.getParent();
    if (!root) return;
    root.dispatch(
      CommonActions.navigate({
        name: 'Heroes',
        params: { screen: 'Character', params: { character } },
      }),
    );
  };

  const createDetachedCopy = async (doc: Record<string, unknown>, mode: 'local-copy' | 'duplicate-shared') => {
    const mapped = mapCloudCharacterToLocalDto(doc);
    const suffix = mode === 'local-copy' ? t('dm:sharedUpdates.localCopySuffix') : t('dm:sharedUpdates.sharedDuplicateSuffix');
    const copy: CharacterViewModel = {
      ...mapped,
      id: String(uuid.v4()),
      name: `${mapped.name || t('dm:sharedUpdates.characterFallback')} (${suffix})`,
    };

    await addCharacter(copy);
    await ensureCharacterSync(copy.id, false);
    setCurrentCharacterId(copy.id);
    const root = navigation.getParent();
    if (!root) return;
    root.dispatch(
      CommonActions.navigate({
        name: 'Heroes',
        params: { screen: 'Character', params: { character: copy } },
      }),
    );
  };

  const syncNow = async (item: SharedRecord) => {
    const normalized = mapCloudCharacterToLocalDto(item.payload);
    const existing = characters.find((character) => character.id === normalized.id);
    if (existing) {
      await updateCharacter(existing.id, normalized);
    } else {
      await addCharacter(normalized);
    }

    const result = await syncToCloud({
      character: normalized,
      syncState: syncByCharacter[normalized.id],
      actorRole: mapRoleToHistoryActor(roleMode),
      syncPort: {
        ensureCharacterSync,
        setCloudAvailability,
        markCloudUploaded,
        setSyncTransport,
        markSyncError,
      },
      isOnline,
      historyPaths: ['overview.identity'],
      offlineMessage: t('dm:sharedUpdates.offlineQueue'),
      syncingMessage: t('dm:sharedUpdates.syncing'),
      syncedMessage: t('dm:sharedUpdates.synced'),
      conflictFallbackPath: 'overview.identity',
    });

    if (result.status === 'error') {
      await setSyncTransport(normalized.id, 'error', result.message || t('dm:sharedUpdates.syncError'));
    }
  };

  const formatSyncStatus = (status: string) => {
    if (status === 'Synced') return t('common:status.synced');
    if (status === 'Pending sync') return t('common:status.pendingSync');
    if (status === 'Offline changes pending') return t('common:status.offlineChanges');
    if (status === 'Conflict detected') return t('common:status.conflictDetected');
    if (status === 'Local only') return t('common:status.localOnly');
    return status;
  };

  const formatShareStatus = (status: string) => {
    if (status === 'Shared with DM') return t('common:status.sharedWithDm');
    if (status === 'Shared with Player') return t('common:status.sharedWithPlayer');
    return status;
  };

  const formatSource = (source: SharedRecord['source']) => t(`dm:sharedUpdates.sources.${source}`);

  const formatChangeSource = (entry: { uid: string; actorRole?: string }) => {
    const currentUid = fbAuth.currentUser?.uid;
    if (currentUid && entry.uid && currentUid === entry.uid) return t('dm:sharedUpdates.changeSources.you');
    if (entry.actorRole === 'DM') return t('dm:sharedUpdates.changeSources.dm');
    if (entry.actorRole === 'Player') return t('dm:sharedUpdates.changeSources.player');
    if (!entry.uid) return t('dm:sharedUpdates.changeSources.remote');
    return t('dm:sharedUpdates.changeSources.uid', { uid: entry.uid.slice(0, 6) });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:sharedUpdates.title')}</Text>
        <Text style={styles.hint}>{t('dm:sharedUpdates.hint')}</Text>
        <Text style={styles.hint}>
          {t('dm:sharedUpdates.networkRole', {
            network: isOnline ? t('common:status.online') : t('common:status.offline'),
            role: t(`common:roles.${roleMode}`),
          })}
        </Text>
        <View style={styles.filterRow}>
          {FILTER_KEYS.map((item) => {
            const active = filter === item;
            return (
              <Pressable
                key={item}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
                onPress={() => setFilter(item)}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                  {t(`dm:sharedUpdates.filters.${item}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!filtered.length && <Text style={styles.emptyText}>{t('dm:sharedUpdates.empty')}</Text>}

      {filtered.map((item) => {
        const localCopyExists = characters.some((character) => character.id === item.id);
        const updatedLabel = item.updatedAtMs ? new Date(item.updatedAtMs).toLocaleString() : '—';
        const latestHistoryLabel = item.latestHistory ? formatChangeSource(item.latestHistory) : null;

        return (
          <View key={`shared-${item.source}-${item.id}`} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemMeta}>{t('dm:sharedUpdates.sheetId', { id: item.id })}</Text>
            <Text style={styles.itemMeta}>{t('dm:sharedUpdates.source', { source: formatSource(item.source) })}</Text>
            <Text style={styles.itemMeta}>{t('dm:sharedUpdates.updated', { value: updatedLabel })}</Text>
            <Text style={styles.itemMeta}>{t('dm:sharedUpdates.syncStatus', { status: formatSyncStatus(item.syncStatus) })}</Text>
            {!!item.shareStatus && (
              <Text style={styles.itemMeta}>{t('dm:sharedUpdates.shareStatus', { status: formatShareStatus(item.shareStatus) })}</Text>
            )}
            {latestHistoryLabel && (
              <Text style={styles.itemMeta}>
                {t('dm:sharedUpdates.latestMarker', {
                  actor: latestHistoryLabel,
                  summary: item.latestHistory?.summary || t('dm:sharedUpdates.noSummary'),
                })}
              </Text>
            )}
            <View style={styles.statusRow}>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>
                  {item.needsReview ? t('dm:sharedUpdates.needsReview') : t('dm:sharedUpdates.reviewed')}
                </Text>
              </View>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>
                  {localCopyExists ? t('dm:sharedUpdates.localCopyExists') : t('dm:sharedUpdates.noLocalCopy')}
                </Text>
              </View>
            </View>
            {!!item.changeHistory.length && (
              <View style={styles.historyBox}>
                {item.changeHistory
                  .slice()
                  .sort((a, b) => (b.atMs || 0) - (a.atMs || 0))
                  .slice(0, 3)
                  .map((entry) => (
                    <Text key={entry.id} style={styles.historyText}>
                      {formatChangeSource(entry)} • {entry.summary || t('dm:sharedUpdates.noSummary')} •{' '}
                      {new Date(entry.atMs).toLocaleString()}
                    </Text>
                  ))}
              </View>
            )}
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  void openInHeroes(item.payload);
                }}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.actionButtonText}>{t('dm:sharedUpdates.openLiveCopy')}</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  void markReviewed(item.id, item.updatedAtMs);
                }}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.actionButtonText}>{t('dm:sharedUpdates.markReviewed')}</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  void syncNow(item);
                }}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.actionButtonText}>{t('dm:sharedUpdates.syncNow')}</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  void createDetachedCopy(item.payload, 'local-copy');
                }}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.actionButtonText}>{t('dm:sharedUpdates.localCopy')}</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  void createDetachedCopy(item.payload, 'duplicate-shared');
                }}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.actionButtonText}>{t('dm:sharedUpdates.duplicateShared')}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default DMSharedUpdates;
