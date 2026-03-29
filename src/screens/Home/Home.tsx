import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { getStyles } from './styles';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import FileService from '@/shared/services/fileSerice';
import { subscribeMySheets, subscribeSharedWithMe } from '@/services/characterSheets';
import { fbAuth } from '@/services/firebase';
import { onGoogleButtonPress } from '@/shared/services/auth/index';
import type { CharacterDto } from '@/types/Character';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import useAppRoleStore from '@/context/AppRole-store';
import { APP_ROLES } from '@/types/Product';
import useSyncStore from '@/context/Sync-store';

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

const mapRemoteToLocalDto = (doc: Record<string, unknown>): CharacterDto =>
  createEmptyCharacter({
    id: String(doc.id || Date.now().toString()),
    name: String(doc.name || 'Character'),
    class: String(doc.class || ''),
    race: String(doc.race || ''),
    level: Number(doc.level || 1),
    experience: Number(doc.experience || 0),
    ac: Number(doc.ac || 10),
    speed: Number(doc.speed || 30),
    initiative: Number(doc.initiative || 0),
    hp: {
      max: Number((doc.hp as any)?.max || 10),
      current: Number((doc.hp as any)?.current || 10),
      temp: Number((doc.hp as any)?.temp || 0),
    },
    inventory: Array.isArray(doc.inventory) ? (doc.inventory as string[]) : [],
    notes: String(doc.notes || ''),
    conditions: Array.isArray(doc.conditions) ? (doc.conditions as string[]) : [],
    customFields: Array.isArray(doc.customFields) ? (doc.customFields as CharacterDto['customFields']) : [],
    customTrackers: Array.isArray(doc.customTrackers) ? (doc.customTrackers as CharacterDto['customTrackers']) : [],
    notesBlocks: (doc.notesBlocks as CharacterDto['notesBlocks']) || undefined,
    spells: (doc.spells as CharacterDto['spells']) || undefined,
    weapons: Array.isArray(doc.weapons) ? (doc.weapons as CharacterDto['weapons']) : [],
    proficiencies: Array.isArray(doc.proficiencies) ? (doc.proficiencies as string[]) : [],
  });

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
      if ((payload.customFields?.length || 0) > 0 || (payload.customTrackers?.length || 0) > 0) statuses.add('Homebrew');

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
  };

  const continueSession = () => {
    const current = previewList.find((item) => item.id === currentCharacterId) || previewList[0];
    if (!current) {
      navigation.navigate('CreateCharacter');
      return;
    }
    void openCharacter(current);
  };

  const openRootTab = (routeName: string) => {
    const parentNav = navigation.getParent();
    if (!parentNav) return;
    parentNav.navigate(routeName as never);
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
                <View key={`${item.id}-${status}`} style={styles.badge}>
                  <Text style={styles.badgeText}>{status}</Text>
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
