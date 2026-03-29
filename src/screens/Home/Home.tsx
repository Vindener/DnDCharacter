import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import type { AppStackParamList } from '@/navigation/AppNavigator';
import { getStyles } from './styles';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import FileService from '@/shared/services/fileSerice';
import { subscribeMySheets, subscribeSharedWithMe } from '@/services/characterSheets';
import { fbAuth } from '@/services/firebase';
import { onGoogleButtonPress } from '@/shared/services/auth/index';
import type { CharacterDto } from '@/types/Character';
import useAppRoleStore from '@/context/AppRole-store';
import { APP_ROLES } from '@/types/Product';
import useSyncStore from '@/context/Sync-store';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import { trackProductEvent } from '@/shared/services/telemetry/productTelemetry';
import { isHomebrewCharacter } from '@/shared/helpers/homebrew';

type CharacterPreview = {
  id: string;
  name: string;
  className: string;
  race: string;
  level: number;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  statuses: string[];
  source: 'local' | 'mine' | 'shared';
  payload: CharacterDto;
};

const mapRemoteToLocalDto = (doc: Record<string, unknown>): CharacterDto => mapCloudCharacterToLocalDto(doc);

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

const Home = () => {
  const navigation = useNavigation<StackNavigationProp<TabStackParamList>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const characters = useCharacterStore((s) => s.characters);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);

  const roleMode = useAppRoleStore((s) => s.role);
  const setRoleMode = useAppRoleStore((s) => s.setRole);
  const loadRoleMode = useAppRoleStore((s) => s.loadRole);
  const syncByCharacter = useSyncStore((s) => s.syncByCharacter);
  const loadSyncMeta = useSyncStore((s) => s.loadSyncMeta);
  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const setCloudAvailability = useSyncStore((s) => s.setCloudAvailability);

  const [search, setSearch] = useState('');
  const [authVersion, setAuthVersion] = useState(0);
  const [myCloud, setMyCloud] = useState<Record<string, unknown>[]>([]);
  const [sharedCloud, setSharedCloud] = useState<Record<string, unknown>[]>([]);
  const [cloudPulseAt, setCloudPulseAt] = useState<number | null>(null);

  const isSignedIn = Boolean(fbAuth.currentUser);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  useEffect(() => {
    loadRoleMode();
  }, [loadRoleMode]);

  useEffect(() => {
    loadSyncMeta();
  }, [loadSyncMeta]);

  useEffect(() => {
    characters.forEach((character) => {
      void ensureCharacterSync(character.id, false);
    });
  }, [characters, ensureCharacterSync]);

  useEffect(() => {
    if (!fbAuth.currentUser) {
      setMyCloud([]);
      setSharedCloud([]);
      return;
    }

    const unsubMine = subscribeMySheets((list) => {
      setMyCloud((list || []) as Record<string, unknown>[]);
      setCloudPulseAt(Date.now());
      (list || []).forEach((doc: any) => {
        if (doc?.id) void setCloudAvailability(String(doc.id), true);
      });
    });

    const unsubShared = subscribeSharedWithMe((list) => {
      setSharedCloud((list || []) as Record<string, unknown>[]);
      setCloudPulseAt(Date.now());
      (list || []).forEach((doc: any) => {
        if (doc?.id) void setCloudAvailability(String(doc.id), true);
      });
    });

    return () => {
      if (typeof unsubMine === 'function') unsubMine();
      if (typeof unsubShared === 'function') unsubShared();
    };
  }, [authVersion, setCloudAvailability]);

  const previewList = useMemo(() => {
    const byId = new Map<string, CharacterPreview>();

    const pushPreview = (payload: CharacterDto, source: 'local' | 'mine' | 'shared') => {
      const existing = byId.get(payload.id);
      const statuses = new Set(existing?.statuses || []);
      const syncState = syncByCharacter[payload.id];

      if (source === 'local' && !syncState) statuses.add('Local');
      if (source === 'mine' && !syncState) statuses.add('Synced');
      if (source === 'shared') statuses.add('Shared');
      if (syncState?.status === 'local-only') statuses.add('Local');
      if (syncState?.status === 'in-sync') statuses.add('Synced');
      if (syncState?.status === 'pending-upload' || syncState?.status === 'pending-download') statuses.add('Pending');
      if (syncState?.status === 'conflict') statuses.add('Conflict');
      if (isHomebrewCharacter(payload)) statuses.add('Homebrew');

      const next: CharacterPreview = {
        id: payload.id,
        name: payload.name || 'Character',
        className: payload.class || 'Class',
        race: payload.race || 'Race',
        level: payload.level || 1,
        hpCurrent: payload.hp?.current || 0,
        hpMax: payload.hp?.max || 0,
        ac: payload.ac || 0,
        statuses: Array.from(statuses),
        source,
        payload,
      };

      byId.set(payload.id, next);
    };

    characters.forEach((localChar) => pushPreview(localChar, 'local'));
    myCloud.forEach((doc) => pushPreview(mapRemoteToLocalDto(doc), 'mine'));
    sharedCloud.forEach((doc) => pushPreview(mapRemoteToLocalDto(doc), 'shared'));

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
  }, [characters, myCloud, sharedCloud, search, syncByCharacter]);

  const pendingSyncCount = useMemo(() => {
    return Object.values(syncByCharacter).filter(
      (entry) => entry.status === 'pending-upload' || entry.status === 'pending-download',
    ).length;
  }, [syncByCharacter]);

  const conflictCount = useMemo(() => {
    return Object.values(syncByCharacter).filter((entry) => entry.status === 'conflict').length;
  }, [syncByCharacter]);

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
    const current = previewList.find((item) => item.id === currentCharacterId) || previewList[0];
    if (!current) {
      navigation.navigate('CreateCharacter');
      return;
    }
    trackProductEvent('session_continue', {
      characterId: current.id,
      role: roleMode,
    });
    void openCharacter(current);
  };

  const openRootTab = (routeName: keyof AppStackParamList) => {
    const parentNav = navigation.getParent<BottomTabNavigationProp<AppStackParamList>>();
    if (!parentNav) return;
    parentNav.navigate(routeName);
  };

  const openSharedUpdatesQueue = () => {
    const parentNav = navigation.getParent<BottomTabNavigationProp<AppStackParamList>>();
    if (!parentNav) return;
    parentNav.navigate('DM', { screen: 'DMSharedUpdates' });
  };

  const onImport = async () => {
    const character = await FileService.importCharacterFromFile();
    if (character) await addCharacter(character);
  };

  const onLogin = async () => {
    try {
      await onGoogleButtonPress();
      setAuthVersion((prev) => prev + 1);
    } catch {}
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
          text: `${name}: Local edit`,
        });
      }
      if (entry.lastSyncAt) {
        events.push({
          id: `${entry.characterId}-sync-${entry.lastSyncAt}`,
          atMs: entry.lastSyncAt,
          type: 'synced',
          text: `${name}: Synced`,
        });
      }
      return events;
    });

    const sharedEvents: TimelineEvent[] = sharedCloud
      .map((doc) => {
        const atMs = toMillis(doc.updatedAt);
        if (!atMs) return null;
        const name = String(doc.name || 'Character');
        return {
          id: `${String(doc.id || name)}-shared-${atMs}`,
          atMs,
          type: 'shared-update' as const,
          text: `${name}: Shared update`,
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
        <Text style={styles.greetingTitle}>Home • {roleMode} Mode</Text>
        <Text style={styles.greetingMeta}>Живий центр сесії: персонажі, статус синку, швидкий доступ до DM-інструментів.</Text>

        <View style={styles.roleSwitchRow}>
          {APP_ROLES.map((option) => (
            <Pressable
              key={option}
              style={[styles.roleChip, roleMode === option ? styles.roleChipActive : null]}
              onPress={() => {
                void setRoleMode(option);
                trackProductEvent('role_changed', { role: option });
              }}
              android_ripple={{ color: '#999' }}
            >
              <Text style={[styles.roleChipText, roleMode === option ? styles.roleChipTextActive : null]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Resume</Text>
        <Text style={styles.sectionHint}>Останні листи та поточний session-start.</Text>
        <TouchableOpacity style={styles.resumeButton} onPress={continueSession} activeOpacity={0.85}>
          <Text style={styles.resumeButtonText}>Continue Session</Text>
        </TouchableOpacity>

        {sharedCloud.slice(0, 2).map((doc) => (
          <Text key={String(doc.id)} style={styles.lineText}>• Shared active: {String(doc.name || 'Character')}</Text>
        ))}

        {!isSignedIn && (
          <TouchableOpacity style={styles.authButton} onPress={onLogin} activeOpacity={0.85}>
            <Text style={styles.authButtonText}>Увійти через Google для cloud-sync</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Last Active Session Timeline</Text>
        <Text style={styles.sectionHint}>Останні локальні правки, синк і shared-оновлення.</Text>
        {!timeline.length && <Text style={styles.sectionHint}>Подій поки немає.</Text>}
        {timeline.map((event) => {
          const badge =
            event.type === 'local-edit'
              ? 'Local'
              : event.type === 'synced'
                ? 'Synced'
                : 'Shared';
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
        <Text style={styles.sectionTitle}>Characters Preview</Text>
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
              <Text style={styles.characterMeta}>Lv.{item.level}</Text>
            </View>
            <Text style={styles.characterMeta}>{item.className} / {item.race}</Text>
            <View style={styles.characterStatsRow}>
              <Text style={styles.characterStat}>HP {item.hpCurrent}/{item.hpMax}</Text>
              <Text style={styles.characterStat}>AC {item.ac}</Text>
            </View>
            <View style={styles.badgeRow}>
              {item.statuses.map((status) => (
                <View key={`${item.id}-${status}`} style={[styles.badge, status === 'Conflict' ? styles.conflictBadge : null]}>
                  <Text style={[styles.badgeText, status === 'Conflict' ? styles.conflictBadgeText : null]}>{status}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        ))}

        {!previewList.length && <Text style={styles.sectionHint}>Поки немає персонажів. Створи або імпортуй лист.</Text>}
      </View>

      {(roleMode === 'DM' || roleMode === 'Hybrid') && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>DM Panel Preview</Text>
          <Text style={styles.sectionHint}>Active party, pending shared updates, швидкий доступ до DM-потоку.</Text>
          <Pressable style={styles.pendingButton} onPress={openSharedUpdatesQueue} android_ripple={{ color: '#999' }}>
            <Ionicons name='git-compare-outline' size={18} color={colors.text} />
            <Text style={styles.pendingButtonText}>Pending Shared Updates ({sharedCloud.length})</Text>
          </Pressable>
          <Text style={styles.lineText}>Pending shared changes: {sharedCloud.length}</Text>
          <Text style={styles.lineText}>Active party size: {previewList.length}</Text>

          <View style={styles.dmGrid}>
            <Pressable style={styles.dmButton} onPress={() => openRootTab('DM')} android_ripple={{ color: '#999' }}>
              <Ionicons name='people-outline' size={18} color={colors.text} />
              <Text style={styles.dmButtonText}>Open DM</Text>
            </Pressable>
            <Pressable style={styles.dmButton} onPress={() => openRootTab('Initiative')} android_ripple={{ color: '#999' }}>
              <Ionicons name='flame-outline' size={18} color={colors.text} />
              <Text style={styles.dmButtonText}>Open Initiative</Text>
            </Pressable>
            <Pressable style={styles.dmButton} onPress={() => openRootTab('Bestiary')} android_ripple={{ color: '#999' }}>
              <Ionicons name='skull-outline' size={18} color={colors.text} />
              <Text style={styles.dmButtonText}>Open Bestiary</Text>
            </Pressable>
            <Pressable style={styles.dmButton} onPress={() => openRootTab('DM')} android_ripple={{ color: '#999' }}>
              <Ionicons name='document-text-outline' size={18} color={colors.text} />
              <Text style={styles.dmButtonText}>Recent Edits</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <Pressable style={styles.quickButton} onPress={() => navigation.navigate('CreateCharacter')} android_ripple={{ color: '#999' }}>
            <Ionicons name='person-add-outline' size={18} color={colors.text} />
            <Text style={styles.quickButtonText}>Create Character</Text>
          </Pressable>
          <Pressable style={styles.quickButton} onPress={onImport} android_ripple={{ color: '#999' }}>
            <Ionicons name='download-outline' size={18} color={colors.text} />
            <Text style={styles.quickButtonText}>Import</Text>
          </Pressable>
          <Pressable style={styles.quickButton} onPress={() => navigation.navigate('Spellbook')} android_ripple={{ color: '#999' }}>
            <Ionicons name='book-outline' size={18} color={colors.text} />
            <Text style={styles.quickButtonText}>Open Spellbook</Text>
          </Pressable>
          <Pressable style={styles.quickButton} onPress={() => openRootTab('Bestiary')} android_ripple={{ color: '#999' }}>
            <Ionicons name='skull-outline' size={18} color={colors.text} />
            <Text style={styles.quickButtonText}>Open Bestiary</Text>
          </Pressable>
          <Pressable style={styles.quickButton} onPress={continueSession} android_ripple={{ color: '#999' }}>
            <Ionicons name='play-outline' size={18} color={colors.text} />
            <Text style={styles.quickButtonText}>Start Session</Text>
          </Pressable>
          <Pressable style={styles.quickButton} onPress={() => openRootTab('DM')} android_ripple={{ color: '#999' }}>
            <Ionicons name='construct-outline' size={18} color={colors.text} />
            <Text style={styles.quickButtonText}>DM Tools</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        <View style={styles.syncRow}>
          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>{isSignedIn ? 'Cloud OK' : 'Offline mode (local-only)'}</Text>
          </View>
          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>Sync pending: {pendingSyncCount}</Text>
          </View>
          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>Conflicts: {conflictCount}</Text>
          </View>
          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>Last sync: {lastSyncLabel}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Home;
