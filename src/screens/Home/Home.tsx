import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { getStyles } from './styles';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import FileService from '@/shared/services/fileSerice';
import { subscribeMySheets, subscribeSharedWithMe } from '@/repositories/characterCloudRepository';
import type { CharacterSheet } from '@/repositories/characterCloudRepository';
import { ensureUserIndexOnLogin } from '@/services/users';
import { useAuth, configureGoogleSignIn, onGoogleButtonPress } from '@/shared/services/auth/index';
import type { CharacterViewModel } from '@/types/Character';
import useSyncStore from '@/context/Sync-store';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import { trackProductEvent } from '@/shared/services/telemetry/productTelemetry';
import { isHomebrewCharacter } from '@/shared/helpers/homebrew';
import { getShareDisplayStatus, getSyncDisplayStatus, isNetworkOnline } from '@/shared/helpers/collaboration/status';

type CharacterPreview = {
  id: string;
  name: string;
  className: string;
  race: string;
  level: number;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  syncStatus: string;
  shareStatus: string | null;
  statuses: string[];
  source: 'local' | 'mine' | 'shared';
  payload: CharacterViewModel;
};

const mapRemoteToLocalDto = (doc: CharacterSheet): CharacterViewModel =>
  mapCloudCharacterToLocalDto(doc as unknown as Record<string, unknown>);

const toMillis = (value: unknown): number => {
  if (!value || typeof value !== 'object') return 0;
  const cast = value as { toMillis?: () => number; seconds?: number };
  if (typeof cast.toMillis === 'function') return cast.toMillis();
  if (typeof cast.seconds === 'number') return cast.seconds * 1000;
  return 0;
};

type TimelineEvent = {
  id: string;
  atMs: number;
  type: 'local-edit' | 'synced' | 'shared-update';
  text: string;
};

const STATUS_TRANSLATIONS: Record<string, string> = {
  'Local only': 'Лише локально',
  Synced: 'Синхронізовано',
  'Pending sync': 'Очікує синхронізації',
  'Offline changes pending': 'Очікують офлайн-зміни',
  'Conflict detected': 'Виявлено конфлікт',
  'Shared with DM': 'Поділено з DM',
  'Shared with Player': 'Поділено з гравцем',
  Homebrew: 'Авторський',
};

const TIMELINE_BADGE_TRANSLATIONS: Record<TimelineEvent['type'], string> = {
  'local-edit': 'Локально',
  synced: 'Синк',
  'shared-update': 'Спільне',
};

const translateLabel = (value: string, dictionary: Record<string, string>): string => dictionary[value] || value;

const Home = () => {
  const navigation = useNavigation<StackNavigationProp<TabStackParamList>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { user } = useAuth();

  const characters = useCharacterStore((s) => s.characters);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);
  const lastSessionCharacterId = useCharacterStore((s) => s.lastSessionCharacterId);
  const setLastSessionCharacterId = useCharacterStore((s) => s.setLastSessionCharacterId);
  const maxCharacters = useCharacterStore((s) => s.maxCharacters);

  const syncByCharacter = useSyncStore((s) => s.syncByCharacter);
  const loadSyncMeta = useSyncStore((s) => s.loadSyncMeta);
  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const setCloudAvailability = useSyncStore((s) => s.setCloudAvailability);

  const [search, setSearch] = useState('');
  const [myCloud, setMyCloud] = useState<CharacterSheet[]>([]);
  const [sharedCloud, setSharedCloud] = useState<CharacterSheet[]>([]);
  const [cloudPulseAt, setCloudPulseAt] = useState<number | null>(null);
  const netInfo = useNetInfo();

  const isSignedIn = Boolean(user);
  const isOnline = isNetworkOnline(netInfo.isConnected);
  const providerPhoto = user?.photoURL || user?.providerData?.find(Boolean)?.photoURL || null;
  const userEmail = user?.email || user?.providerData?.find((item) => item?.email)?.email || 'Користувач Google';

  useEffect(() => {
    configureGoogleSignIn('608733335623-k857u9k0p2t6gd52k9uthr76jbm001m3.apps.googleusercontent.com');
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  useEffect(() => {
    loadSyncMeta();
  }, [loadSyncMeta]);

  useEffect(() => {
    characters.forEach((character) => {
      void ensureCharacterSync(character.id, false);
    });
  }, [characters, ensureCharacterSync]);

  useEffect(() => {
    if (!user) {
      setMyCloud([]);
      setSharedCloud([]);
      return;
    }

    const unsubMine = subscribeMySheets((list) => {
      setMyCloud(list || []);
      setCloudPulseAt(Date.now());
      (list || []).forEach((doc) => {
        if (doc?.id) void setCloudAvailability(String(doc.id), true);
      });
    });

    const unsubShared = subscribeSharedWithMe((list) => {
      setSharedCloud(list || []);
      setCloudPulseAt(Date.now());
      (list || []).forEach((doc) => {
        if (doc?.id) void setCloudAvailability(String(doc.id), true);
      });
    });

    return () => {
      if (typeof unsubMine === 'function') unsubMine();
      if (typeof unsubShared === 'function') unsubShared();
    };
  }, [setCloudAvailability, user]);

  useEffect(() => {
    if (user) {
      ensureUserIndexOnLogin().catch(() => {});
    }
  }, [user]);

  const previewList = useMemo(() => {
    const byId = new Map<string, CharacterPreview>();

    const pushPreview = (
      payload: CharacterViewModel,
      source: 'local' | 'mine' | 'shared',
      rawDoc?: CharacterSheet | null,
    ) => {
      const existing = byId.get(payload.id);
      const syncState = syncByCharacter[payload.id];
      const syncStatus = getSyncDisplayStatus(syncState, netInfo.isConnected);
      const shareStatus = getShareDisplayStatus({
        isSharedSheet:
          source === 'shared' ||
          Boolean(rawDoc && Array.isArray(rawDoc.editors) && rawDoc.editors.length > 0) ||
          Boolean(existing?.shareStatus),
        source,
        isOwnedByMe: source !== 'shared',
        role: 'Player',
      });

      const statuses = new Set<string>();
      statuses.add(syncStatus);
      if (shareStatus) statuses.add(shareStatus);
      if (isHomebrewCharacter(payload)) statuses.add('Homebrew');

      const next: CharacterPreview = {
        id: payload.id,
        name: payload.name || 'Персонаж',
        className: payload.class || 'Клас',
        race: payload.race || 'Раса',
        level: payload.level || 1,
        hpCurrent: payload.hp?.current || 0,
        hpMax: payload.hp?.max || 0,
        ac: payload.ac || 0,
        syncStatus,
        shareStatus,
        statuses: Array.from(statuses),
        source,
        payload,
      };

      byId.set(payload.id, next);
    };

    characters.forEach((localChar) => pushPreview(localChar, 'local'));
    myCloud.forEach((doc) => pushPreview(mapRemoteToLocalDto(doc), 'mine', doc));
    sharedCloud.forEach((doc) => pushPreview(mapRemoteToLocalDto(doc), 'shared', doc));

    const text = search.trim().toLowerCase();
    return Array.from(byId.values())
      .filter((item) => {
        if (!text) return true;
        return (
          item.name.toLowerCase().includes(text) ||
          item.className.toLowerCase().includes(text) ||
          item.race.toLowerCase().includes(text)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [characters, myCloud, netInfo.isConnected, sharedCloud, search, syncByCharacter]);

  const pendingSyncCount = useMemo(() => {
    return Object.values(syncByCharacter).filter((entry) => {
      const status = getSyncDisplayStatus(entry, netInfo.isConnected);
      return status === 'Pending sync' || status === 'Offline changes pending';
    }).length;
  }, [netInfo.isConnected, syncByCharacter]);

  const conflictCount = useMemo(() => {
    return Object.values(syncByCharacter).filter((entry) => getSyncDisplayStatus(entry, netInfo.isConnected) === 'Conflict detected').length;
  }, [netInfo.isConnected, syncByCharacter]);

  const userCharacterCount = useMemo(() => {
    const ids = new Set<string>();
    characters.forEach((character) => {
      if (character.id) ids.add(character.id);
    });
    myCloud.forEach((doc) => {
      const id = String(doc.id || '').trim();
      if (id) ids.add(id);
    });
    return ids.size;
  }, [characters, myCloud]);

  const characterLimitTone = useMemo<'safe' | 'warn' | 'danger'>(() => {
    if (maxCharacters <= 0) return 'danger';
    if (userCharacterCount >= maxCharacters) return 'danger';
    if (userCharacterCount >= Math.ceil(maxCharacters * 0.8)) return 'warn';
    return 'safe';
  }, [maxCharacters, userCharacterCount]);

  const openCharacter = async (character: CharacterPreview) => {
    const existsLocal = characters.find((c) => c.id === character.id);

    if (!existsLocal) {
      await addCharacter(character.payload);
    } else {
      await updateCharacter(character.id, character.payload);
    }

    setCurrentCharacterId(character.id);
    navigation.navigate('Character', { character: character.payload });
    trackProductEvent('character_opened', {
      characterId: character.id,
      source: character.source,
    });
  };

  const continueSession = () => {
    const current =
      previewList.find((item) => item.id === lastSessionCharacterId) ||
      previewList.find((item) => item.id === currentCharacterId) ||
      previewList.find((item) => item.payload.sessionMode) ||
      previewList[0];
    if (!current) {
      navigation.navigate('CreateCharacter');
      return;
    }
    void setLastSessionCharacterId(current.id);
    trackProductEvent('session_continue', {
      characterId: current.id,
      role: 'Player',
    });
    void openCharacter(current);
  };

  const onImport = async () => {
    const character = await FileService.importCharacterFromFile();
    if (character) await addCharacter(character);
  };

  const onLogin = async () => {
    try {
      await onGoogleButtonPress();
    } catch (_error) { /* intentionally ignored */ }
  };


  const storeLastSyncAt = useMemo(() => {
    const values = Object.values(syncByCharacter)
      .map((entry) => entry.lastSyncAt)
      .filter((value): value is number => typeof value === 'number');
    if (!values.length) return null;
    return Math.max(...values);
  }, [syncByCharacter]);

  const effectiveLastSyncAt = storeLastSyncAt ?? cloudPulseAt;
  const lastSyncLabel = effectiveLastSyncAt ? new Date(effectiveLastSyncAt).toLocaleTimeString() : '—';

  const timeline = useMemo<TimelineEvent[]>(() => {
    const characterNameById = new Map<string, string>();
    previewList.forEach((item) => {
      characterNameById.set(item.id, item.name);
    });

    const syncEvents = Object.values(syncByCharacter).flatMap((entry) => {
      const name = characterNameById.get(entry.characterId) || entry.characterId;
      const events: TimelineEvent[] = [];
      if (entry.lastLocalChangeAt) {
        events.push({
          id: `${entry.characterId}-local-${entry.lastLocalChangeAt}`,
          atMs: entry.lastLocalChangeAt,
          type: 'local-edit',
          text: `${name}: Локальна правка`,
        });
      }
      if (entry.lastSyncAt) {
        events.push({
          id: `${entry.characterId}-sync-${entry.lastSyncAt}`,
          atMs: entry.lastSyncAt,
          type: 'synced',
          text: `${name}: Синхронізовано`,
        });
      }
      return events;
    });

    const sharedEvents: TimelineEvent[] = sharedCloud
      .map((doc) => {
        const atMs = toMillis(doc.updatedAt);
        if (!atMs) return null;
        const name = String(doc.name || 'Персонаж');
        return {
          id: `${String(doc.id || name)}-shared-${atMs}`,
          atMs,
          type: 'shared-update' as const,
          text: `${name}: Оновлення спільного листа`,
        };
      })
      .filter(Boolean) as TimelineEvent[];

    return [...syncEvents, ...sharedEvents]
      .sort((a, b) => b.atMs - a.atMs)
      .slice(0, 12);
  }, [previewList, sharedCloud, syncByCharacter]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>


      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Продовжити</Text>

        {sharedCloud.slice(0, 2).map((doc) => (
          <Text key={String(doc.id)} style={styles.lineText}>
            • Активний спільний лист: {String(doc.name || 'Персонаж')}
          </Text>
        ))}

        {!isSignedIn && (
          <TouchableOpacity style={styles.authButton} onPress={onLogin} activeOpacity={0.85}>
            <Text style={styles.authButtonText}>Увійти за допомогою Google</Text>
          </TouchableOpacity>
        )}
        {isSignedIn && (
          <View style={styles.authUserRow}>
            {providerPhoto ? <Image source={{ uri: providerPhoto }} style={styles.authAvatar} resizeMode='cover' /> : null}
            <View style={styles.authUserTextWrap}>
              <Text style={styles.authUserEmail}>Вітаємо, {userEmail}!</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionHint}>Останні листи та швидкий старт поточної сесії.</Text>
        <TouchableOpacity style={styles.resumeButton} onPress={continueSession} activeOpacity={0.85}>
          <Text style={styles.resumeButtonText}>Продовжити сесію</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Швидкі дії</Text>
        <View style={styles.quickGrid}>
          <Pressable style={styles.quickButton} onPress={() => navigation.navigate('CreateCharacter')} android_ripple={{ color: '#999' }}>
            <Ionicons name='person-add-outline' size={18} color={colors.text} />
            <Text style={styles.quickButtonText}>Створити персонажа</Text>
          </Pressable>
          <Pressable style={styles.quickButton} onPress={onImport} android_ripple={{ color: '#999' }}>
            <Ionicons name='download-outline' size={18} color={colors.text} />
            <Text style={styles.quickButtonText}>Імпортувати</Text>
          </Pressable>
          <Pressable style={styles.quickButton} onPress={() => navigation.navigate('Spellbook')} android_ripple={{ color: '#999' }}>
            <Ionicons name='book-outline' size={18} color={colors.text} />
            <Text style={styles.quickButtonText}>Відкрити заклинання</Text>
          </Pressable>
          <Pressable style={styles.quickButton} onPress={continueSession} android_ripple={{ color: '#999' }}>
            <Ionicons name='play-outline' size={18} color={colors.text} />
            <Text style={styles.quickButtonText}>Почати сесію</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Огляд персонажів</Text>
        <Text style={styles.sectionHint}>
          Персонажів користувача ({isSignedIn ? userEmail : 'локальний профіль'}):{' '}
          <Text
            style={[
              styles.characterLimitText,
              characterLimitTone === 'safe'
                ? styles.characterLimitTextSafe
                : characterLimitTone === 'warn'
                  ? styles.characterLimitTextWarn
                  : styles.characterLimitTextDanger,
            ]}
          >
            {userCharacterCount}/{maxCharacters}
          </Text>
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder='Пошук персонажа'
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
        />

        {previewList.slice(0, 8).map((item) => (
          <Pressable
            key={item.id}
            style={styles.characterCard}
            onPress={() => {
              void openCharacter(item);
            }}
            android_ripple={{ color: '#999' }}
          >
            <View style={styles.characterHeader}>
              <Text style={styles.characterName}>{item.name}</Text>
              <Text style={styles.characterMeta}>Рів. {item.level}</Text>
            </View>
            <Text style={styles.characterMeta}>
              {item.className} / {item.race}
            </Text>
            <View style={styles.characterStatsRow}>
              <Text style={styles.characterStat}>
                HP {item.hpCurrent}/{item.hpMax}
              </Text>
              <Text style={styles.characterStat}>AC {item.ac}</Text>
            </View>
            <Text style={styles.characterMeta}>Стан синхронізації: {translateLabel(item.syncStatus, STATUS_TRANSLATIONS)}</Text>
            {!!item.shareStatus && (
              <Text style={styles.characterMeta}>Статус спільного доступу: {translateLabel(item.shareStatus, STATUS_TRANSLATIONS)}</Text>
            )}
            <View style={styles.badgeRow}>
              {item.statuses.map((status) => (
                <View key={`${item.id}-${status}`} style={[styles.badge, status === 'Conflict detected' ? styles.conflictBadge : null]}>
                  <Text style={[styles.badgeText, status === 'Conflict detected' ? styles.conflictBadgeText : null]}>
                    {translateLabel(status, STATUS_TRANSLATIONS)}
                  </Text>
                </View>
              ))}
            </View>
          </Pressable>
        ))}

        {!previewList.length && <Text style={styles.sectionHint}>Поки немає персонажів. Створи або імпортуй лист.</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Хронологія останньої сесії</Text>
        <Text style={styles.sectionHint}>Останні локальні правки, синхронізація й оновлення спільних листів.</Text>
        {!timeline.length && <Text style={styles.sectionHint}>Подій поки немає.</Text>}
        {timeline.map((event) => {
          const badge = translateLabel(event.type, TIMELINE_BADGE_TRANSLATIONS);
          return (
            <View key={event.id} style={styles.timelineRow}>
              <View style={styles.timelineBadge}>
                <Text style={styles.timelineBadgeText}>{badge}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineText}>{event.text}</Text>
                <Text style={styles.timelineMeta}>{new Date(event.atMs).toLocaleString()}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Стан синхронізації</Text>
        <View style={styles.syncRow}>
          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>{isOnline ? 'Мережа: онлайн' : 'Мережа: офлайн'}</Text>
          </View>
          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>{isSignedIn ? 'Хмара: підключено' : 'Хмара: потрібен вхід'}</Text>
          </View>
          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>Очікує синхронізації: {pendingSyncCount}</Text>
          </View>
          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>Конфлікти: {conflictCount}</Text>
          </View>
          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>Остання синхронізація: {lastSyncLabel}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Home;



