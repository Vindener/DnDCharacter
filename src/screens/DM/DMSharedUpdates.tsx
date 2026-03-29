import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { subscribeMySheets, subscribeSharedWithMe } from '@/services/characterSheets';
import { fbAuth } from '@/services/firebase';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './DMSharedUpdates.style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import useCharacterStore from '@/context/Character-store';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import type { CharacterDto } from '@/types/Character';

type FilterKey = 'all' | 'mine' | 'shared' | 'needs-review';
type SharedRecord = {
  id: string;
  name: string;
  source: 'mine' | 'shared';
  updatedAtMs: number;
  payload: Record<string, unknown>;
};

const REVIEWED_STORAGE_KEY = 'DM_SHARED_REVIEWED_V1';

const toMillis = (value: unknown): number => {
  if (!value || typeof value !== 'object') return 0;
  const cast = value as { toMillis?: () => number; seconds?: number };
  if (typeof cast.toMillis === 'function') return cast.toMillis();
  if (typeof cast.seconds === 'number') return cast.seconds * 1000;
  return 0;
};

const DMSharedUpdates = () => {
  const navigation = useNavigation<StackNavigationProp<DMStackParamList, 'DMSharedUpdates'>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const characters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);

  const [authVersion, setAuthVersion] = useState(0);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [mySheets, setMySheets] = useState<Record<string, unknown>[]>([]);
  const [sharedSheets, setSharedSheets] = useState<Record<string, unknown>[]>([]);
  const [reviewedMap, setReviewedMap] = useState<Record<string, number>>({});

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
      name: String(sheet.name || 'Character'),
      source: 'mine' as const,
      updatedAtMs: toMillis(sheet.updatedAt),
      payload: sheet,
    }));
    const shared = sharedSheets.map((sheet) => ({
      id: String(sheet.id || ''),
      name: String(sheet.name || 'Character'),
      source: 'shared' as const,
      updatedAtMs: toMillis(sheet.updatedAt),
      payload: sheet,
    }));

    const merged = [...mine, ...shared];
    return merged.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }, [mySheets, sharedSheets]);

  const withReviewState = useMemo(() => {
    return records.map((record) => {
      const reviewedAt = reviewedMap[record.id] || 0;
      const needsReview = record.updatedAtMs > reviewedAt;
      return {
        ...record,
        reviewedAt,
        needsReview,
      };
    });
  }, [records, reviewedMap]);

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

  const ensureLocalCharacter = async (doc: Record<string, unknown>): Promise<CharacterDto> => {
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
    root.navigate('Heroes' as never, { screen: 'Character', params: { character } } as never);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Shared Updates Queue</Text>
        <Text style={styles.hint}>Workflow: перегляд змін, маркування review, відкриття у локальному Character листі.</Text>
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
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!filtered.length && <Text style={styles.emptyText}>Немає shared sheet записів для обраного фільтра.</Text>}

      {filtered.map((item) => {
        const localCopyExists = characters.some((character) => character.id === item.id);
        const updatedLabel = item.updatedAtMs ? new Date(item.updatedAtMs).toLocaleString() : '—';

        return (
          <View key={`shared-${item.source}-${item.id}`} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemMeta}>Sheet ID: {item.id}</Text>
            <Text style={styles.itemMeta}>Source: {item.source}</Text>
            <Text style={styles.itemMeta}>Updated at: {updatedLabel}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>{item.needsReview ? 'Needs review' : 'Reviewed'}</Text>
              </View>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>{localCopyExists ? 'Local copy exists' : 'No local copy'}</Text>
              </View>
            </View>
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  void openInHeroes(item.payload);
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.actionButtonText}>{localCopyExists ? 'Open Local Copy' : 'Add + Open Local'}</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  void markReviewed(item.id, item.updatedAtMs);
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.actionButtonText}>Mark Reviewed</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default DMSharedUpdates;
