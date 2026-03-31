import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { uuid } from 'expo-modules-core';
import { subscribeMySheets, subscribeSharedWithMe, upsertCharacterSheetFromLocal } from '@/services/characterSheets';
import { fbAuth } from '@/services/firebase';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './DMSharedUpdates.style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import useCharacterStore from '@/context/Character-store';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import type { CharacterViewModel } from '@/types/Character';
import useSyncStore from '@/context/Sync-store';
import useAppRoleStore from '@/context/AppRole-store';
import {
  getChangeSourceLabel,
  getShareDisplayStatus,
  getSyncDisplayStatus,
  isNetworkOnline,
  mapRoleToHistoryActor,
} from '@/shared/helpers/collaboration/status';

type FilterKey = 'all' | 'mine' | 'shared' | 'needs-review';
const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'Усі',
  mine: 'Мої',
  shared: 'Спільні',
  'needs-review': 'Потребують перевірки',
};

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

const REVIEWED_STORAGE_KEY = 'DM_SHARED_REVIEWED_V1';

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
  const navigation = useNavigation<StackNavigationProp<DMStackParamList, 'DMSharedUpdates'>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const characters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);
  const syncByCharacter = useSyncStore((s) => s.syncByCharacter);
  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const markCloudUploaded = useSyncStore((s) => s.markCloudUploaded);
  const setSyncTransport = useSyncStore((s) => s.setSyncTransport);
  const roleMode = useAppRoleStore((s) => s.role);
  const netInfo = useNetInfo();

  const [authVersion, setAuthVersion] = useState(0);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [mySheets, setMySheets] = useState<Record<string, unknown>[]>([]);
  const [sharedSheets, setSharedSheets] = useState<Record<string, unknown>[]>([]);
  const [reviewedMap, setReviewedMap] = useState<Record<string, number>>({});
  const isOnline = isNetworkOnline(netInfo.isConnected);

  useEffect(() => {
    AsyncStorage.getItem(REVIEWED_STORAGE_KEY)
      .then((raw) => {
        const parsed = JSON.parse(raw || '{}');
        if (parsed && typeof parsed === 'object') {
          setReviewedMap(parsed as Record<string, number>);
        }
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
      name: String(sheet.name || 'Персонаж'),
      source: 'mine' as const,
      updatedAtMs: toMillis(sheet.updatedAt),
      payload: sheet,
      changeHistory: sanitizeHistory(sheet.changeHistory),
    }));
    const shared = sharedSheets.map((sheet) => ({
      id: String(sheet.id || ''),
      name: String(sheet.name || 'Персонаж'),
      source: 'shared' as const,
      updatedAtMs: toMillis(sheet.updatedAt),
      payload: sheet,
      changeHistory: sanitizeHistory(sheet.changeHistory),
    }));

    const merged = [...mine, ...shared];
    return merged.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }, [mySheets, sharedSheets]);

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
      await AsyncStorage.setItem(REVIEWED_STORAGE_KEY, JSON.stringify(next));
    } catch {}
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
    const root = navigation.getParent() as any;
    if (!root) return;
    root.navigate('Heroes', { screen: 'Character', params: { character } });
  };

  const createDetachedCopy = async (doc: Record<string, unknown>, mode: 'local-copy' | 'duplicate-shared') => {
    const mapped = mapCloudCharacterToLocalDto(doc);
    const copy: CharacterViewModel = {
      ...mapped,
      id: String(uuid.v4()),
      name: `${mapped.name || 'Персонаж'} (${mode === 'local-copy' ? 'Локальна копія' : 'Спільний дублікат'})`,
    };

    await addCharacter(copy);
    await ensureCharacterSync(copy.id, false);
    setCurrentCharacterId(copy.id);
    const root = navigation.getParent() as any;
    if (!root) return;
    root.navigate('Heroes', { screen: 'Character', params: { character: copy } });
  };

  const syncNow = async (item: SharedRecord) => {
    if (!isOnline) {
      await setSyncTransport(item.id, 'idle', 'Офлайн-черга');
      return;
    }

    const normalized = mapCloudCharacterToLocalDto(item.payload);
    const existing = characters.find((character) => character.id === normalized.id);
    if (existing) {
      await updateCharacter(existing.id, normalized);
    } else {
      await addCharacter(normalized);
    }
    try {
      await ensureCharacterSync(normalized.id, true);
      await setSyncTransport(normalized.id, 'syncing', 'Синхронізація...');
      await upsertCharacterSheetFromLocal(normalized, {
        historyPaths: ['overview.identity'],
        actorRole: mapRoleToHistoryActor(roleMode),
      });
      await markCloudUploaded(normalized.id);
      await setSyncTransport(normalized.id, 'synced', 'Синхронізовано');
    } catch (error) {
      const message = String((error as Error)?.message || 'Помилка синхронізації');
      await setSyncTransport(normalized.id, 'error', message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Черга спільних оновлень</Text>
        <Text style={styles.hint}>Процес: перегляд змін, позначення перевірки, відкриття в локальному листі персонажа.</Text>
        <Text style={styles.hint}>Мережа: {isOnline ? 'Онлайн' : 'Офлайн'} • Роль: {roleMode}</Text>
        <View style={styles.filterRow}>
          {(['all', 'mine', 'shared', 'needs-review'] as FilterKey[]).map((item) => {
            const active = filter === item;
            return (
              <Pressable
                key={item}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
                onPress={() => setFilter(item)}
                android_ripple={{ color: '#999' }}
              >
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{FILTER_LABELS[item]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!filtered.length && <Text style={styles.emptyText}>Немає записів спільних листів для вибраного фільтра.</Text>}

      {filtered.map((item) => {
        const localCopyExists = characters.some((character) => character.id === item.id);
        const updatedLabel = item.updatedAtMs ? new Date(item.updatedAtMs).toLocaleString() : '—';
        const latestHistoryLabel = item.latestHistory
          ? getChangeSourceLabel({
              uid: item.latestHistory.uid,
              actorRole: item.latestHistory.actorRole,
              currentUid: fbAuth.currentUser?.uid,
            })
          : null;

        return (
          <View key={`shared-${item.source}-${item.id}`} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemMeta}>ID листа: {item.id}</Text>
            <Text style={styles.itemMeta}>Джерело: {item.source}</Text>
            <Text style={styles.itemMeta}>Оновлено: {updatedLabel}</Text>
            <Text style={styles.itemMeta}>Статус синхронізації: {item.syncStatus}</Text>
            {!!item.shareStatus && <Text style={styles.itemMeta}>Статус спільного доступу: {item.shareStatus}</Text>}
            {latestHistoryLabel && (
              <Text style={styles.itemMeta}>
                Останній маркер: {latestHistoryLabel} ({item.latestHistory?.summary || 'Без підсумку'})
              </Text>
            )}
            <View style={styles.statusRow}>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>{item.needsReview ? 'Потребує перевірки' : 'Перевірено'}</Text>
              </View>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>{localCopyExists ? 'Локальна копія існує' : 'Немає локальної копії'}</Text>
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
                      {getChangeSourceLabel({ uid: entry.uid, actorRole: entry.actorRole, currentUid: fbAuth.currentUser?.uid })} •{' '}
                      {entry.summary || 'Без підсумку'} • {new Date(entry.atMs).toLocaleString()}
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
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.actionButtonText}>Спільна жива копія</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  void markReviewed(item.id, item.updatedAtMs);
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.actionButtonText}>Позначити перевіреним</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  void syncNow(item);
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.actionButtonText}>Синхронізувати зараз</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  void createDetachedCopy(item.payload, 'local-copy');
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.actionButtonText}>Локальна копія</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  void createDetachedCopy(item.payload, 'duplicate-shared');
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.actionButtonText}>Дублювати зі спільного</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default DMSharedUpdates;

