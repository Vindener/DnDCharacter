import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import useCharacterStore from '@/context/Character-store';
import useSyncStore from '@/context/Sync-store';
import { subscribeMySheets, subscribeSharedWithMe } from '@/services/characterSheets';
import { fbAuth } from '@/services/firebase';
import { onGoogleButtonPress } from '@/shared/services/auth';
import useAppRoleStore from '@/context/AppRole-store';
import { getShareDisplayStatus, getSyncDisplayStatus, isNetworkOnline } from '@/shared/helpers/collaboration/status';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import { ensureCampaignForName, subscribeAccessibleCampaigns } from '@/services/dmCampaigns';
import { loadLocalCampaignNotes } from '@/services/dmCampaignNotes';
import type { DMCampaign } from '@/types/DM';
import type { CharacterDto } from '@/types/Character';

type TimestampLike = { toMillis?: () => number; seconds?: number } | null | undefined;

type DashboardCharacter = {
  id: string;
  payload: CharacterDto;
  source: 'local' | 'mine' | 'shared';
};

const toMillis = (value: TimestampLike): number => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
};

const DM: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<DMStackParamList, 'DMHome'>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const localCharacters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);
  const syncByCharacter = useSyncStore((s) => s.syncByCharacter);
  const markLocalDraftPaths = useSyncStore((s) => s.markLocalDraftPaths);
  const roleMode = useAppRoleStore((s) => s.role);
  const netInfo = useNetInfo();

  const [authVersion, setAuthVersion] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [mySheets, setMySheets] = useState<Record<string, unknown>[]>([]);
  const [sharedSheets, setSharedSheets] = useState<Record<string, unknown>[]>([]);
  const [campaigns, setCampaigns] = useState<DMCampaign[]>([]);
  const [notesCount, setNotesCount] = useState(0);

  const isSignedIn = useMemo(() => Boolean(fbAuth.currentUser), [authVersion]);
  const isOnline = isNetworkOnline(netInfo.isConnected);

  useEffect(() => {
    let unsubCampaigns = () => {};
    let cancelled = false;

    const run = async () => {
      unsubCampaigns = await subscribeAccessibleCampaigns((next) => {
        if (!cancelled) setCampaigns(next);
      });

      const notes = await loadLocalCampaignNotes();
      if (!cancelled) setNotesCount(notes.length);
    };

    void run();

    return () => {
      cancelled = true;
      if (typeof unsubCampaigns === 'function') unsubCampaigns();
    };
  }, [authVersion]);

  useEffect(() => {
    if (!fbAuth.currentUser) {
      setMySheets([]);
      setSharedSheets([]);
      return;
    }

    const unsubMine = subscribeMySheets((list) => {
      setMySheets((list || []) as Record<string, unknown>[]);
    });
    const unsubShared = subscribeSharedWithMe((list) => {
      setSharedSheets((list || []) as Record<string, unknown>[]);
    });

    return () => {
      if (typeof unsubMine === 'function') unsubMine();
      if (typeof unsubShared === 'function') unsubShared();
    };
  }, [authVersion]);

  useEffect(() => {
    const runMigration = async () => {
      for (const character of localCharacters) {
        if (character.campaignId || !String(character.campaign || '').trim()) continue;
        const campaign = await ensureCampaignForName(String(character.campaign || ''));
        if (!campaign) continue;
        await updateCharacter(character.id, { ...character, campaignId: campaign.id });
        await markLocalDraftPaths(character.id, ['overview.identity']);
      }
    };

    void runMigration();
  }, [localCharacters, markLocalDraftPaths, updateCharacter]);

  const pendingSyncCount = useMemo(
    () =>
      Object.values(syncByCharacter).filter((entry) => {
        const status = getSyncDisplayStatus(entry, netInfo.isConnected);
        return status === 'Pending sync' || status === 'Offline changes pending';
      }).length,
    [netInfo.isConnected, syncByCharacter],
  );

  const conflictCount = useMemo(
    () =>
      Object.values(syncByCharacter).filter((entry) => getSyncDisplayStatus(entry, netInfo.isConnected) === 'Conflict detected').length,
    [netInfo.isConnected, syncByCharacter],
  );

  const unifiedParty = useMemo<DashboardCharacter[]>(() => {
    const byId = new Map<string, DashboardCharacter>();

    localCharacters.forEach((character) => {
      byId.set(character.id, { id: character.id, payload: character, source: 'local' });
    });

    mySheets.forEach((doc) => {
      const mapped = mapCloudCharacterToLocalDto(doc);
      byId.set(mapped.id, { id: mapped.id, payload: mapped, source: 'mine' });
    });

    sharedSheets.forEach((doc) => {
      const mapped = mapCloudCharacterToLocalDto(doc);
      byId.set(mapped.id, { id: mapped.id, payload: mapped, source: 'shared' });
    });

    return Array.from(byId.values()).sort((a, b) => (a.payload.name || '').localeCompare(b.payload.name || ''));
  }, [localCharacters, mySheets, sharedSheets]);

  const recentSharedUpdates = useMemo(() => {
    const all = [...mySheets, ...sharedSheets];
    return all
      .slice()
      .sort((a, b) => toMillis(b.updatedAt as TimestampLike) - toMillis(a.updatedAt as TimestampLike))
      .slice(0, 4);
  }, [mySheets, sharedSheets]);

  const openRootTab = (routeName: string, params?: Record<string, unknown>) => {
    const parent = navigation.getParent() as any;
    if (!parent) return;
    parent.navigate(routeName, params);
  };

  const openHeroesNested = (screen: 'Spellbook' | 'Home', params?: Record<string, unknown>) => {
    const parent = navigation.getParent() as any;
    if (!parent) return;
    parent.navigate('Heroes', { screen, params });
  };

  const ensureLocalCharacter = async (character: CharacterDto) => {
    const existing = useCharacterStore.getState().characters.find((item) => item.id === character.id);
    if (existing) {
      await updateCharacter(existing.id, character);
    } else {
      await addCharacter(character);
    }
    return character;
  };

  const openFullSheet = async (character: CharacterDto) => {
    const local = await ensureLocalCharacter(character);
    setCurrentCharacterId(local.id);
    const parent = navigation.getParent() as any;
    if (!parent) return;
    parent.navigate('Heroes', { screen: 'Character', params: { character: local } });
  };

  const openQuickEdit = async (character: CharacterDto) => {
    const local = await ensureLocalCharacter(character);
    navigation.navigate('DMQuickEdit', { characterId: local.id });
  };

  const onLogin = async () => {
    try {
      setIsSigningIn(true);
      await onGoogleButtonPress();
      setAuthVersion((prev) => prev + 1);
    } catch {}
    setIsSigningIn(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Огляд групи</Text>
        <Text style={styles.hint}>DM-орієнтований дашборд стану групи, спільного доступу та ризиків синхронізації.</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Кампанії: {campaigns.length}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Розмір групи: {unifiedParty.length}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Мережа: {isOnline ? 'Онлайн' : 'Офлайн'}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Очікує синхронізації: {pendingSyncCount}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Конфлікти: {conflictCount}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Роль: {roleMode}</Text>
          </View>
        </View>
        <Pressable style={styles.authButton} onPress={() => navigation.navigate('DMPartyOverview')} android_ripple={{ color: '#999' }}>
          <Text style={styles.authButtonText}>Відкрити повний огляд групи</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Підготовка сутички</Text>
        <Text style={styles.hint}>Зберіть склад сутички з групи кампанії та бестіарію і передайте в Ініціативу одним потоком.</Text>
        <View style={styles.laneGrid}>
          <Pressable
            style={styles.laneButton}
            onPress={() => navigation.navigate('DMEncounterPrep', { campaignId: campaigns[0]?.id })}
            android_ripple={{ color: '#999' }}
          >
            <Ionicons name='rocket-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Почати підготовку сутички</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={() => openRootTab('Initiative')} android_ripple={{ color: '#999' }}>
            <Ionicons name='flame-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Відкрити ініціативу</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={() => openRootTab('Bestiary')} android_ripple={{ color: '#999' }}>
            <Ionicons name='skull-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Швидкий доступ до бестіарію</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={() => openHeroesNested('Spellbook')} android_ripple={{ color: '#999' }}>
            <Ionicons name='book-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Швидкий доступ до книги заклять</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Доступ до спільних персонажів + швидке редагування</Text>
        <Text style={styles.hint}>Відкрийте спільну живу копію, швидко редагуйте критичні для сесії поля або перейдіть до повного листа.</Text>
        {unifiedParty.slice(0, 4).map((item) => {
          const syncStatus = getSyncDisplayStatus(syncByCharacter[item.id], netInfo.isConnected);
          const shareStatus = getShareDisplayStatus({
            isSharedSheet: item.source === 'shared',
            role: roleMode,
            source: item.source,
          });

          return (
            <View key={item.id} style={styles.updateRow}>
              <Text style={styles.updateTitle}>{item.payload.name || 'Character'}</Text>
              <Text style={styles.updateMeta}>Джерело: {item.source}</Text>
              <Text style={styles.updateMeta}>Статус синхронізації: {syncStatus}</Text>
              {!!shareStatus && <Text style={styles.updateMeta}>Статус спільного доступу: {shareStatus}</Text>}
              <View style={styles.laneGrid}>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void openFullSheet(item.payload);
                  }}
                  android_ripple={{ color: '#999' }}
                >
                  <Ionicons name='link-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>Відкрити спільну живу копію</Text>
                </Pressable>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void openQuickEdit(item.payload);
                  }}
                  android_ripple={{ color: '#999' }}
                >
                  <Ionicons name='create-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>Швидке редагування</Text>
                </Pressable>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void openFullSheet(item.payload);
                  }}
                  android_ripple={{ color: '#999' }}
                >
                  <Ionicons name='document-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>Відкрити повний лист</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Нотатки кампанії</Text>
        <Text style={styles.hint}>Черга нотаток кампанії з підтримкою хмари й офлайну та статусами синхронізації/конфліктів.</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Нотатки кампанії: {notesCount}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Кампаній відстежується: {campaigns.length}</Text>
          </View>
        </View>
        <Pressable
          style={styles.authButton}
          onPress={() => navigation.navigate('DMCampaignNotes', { campaignId: campaigns[0]?.id })}
          android_ripple={{ color: '#999' }}
        >
          <Text style={styles.authButtonText}>Відкрити нотатки кампанії</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Останні спільні зміни</Text>
        <Text style={styles.hint}>Компактна стрічка з переходом у чергу детального перегляду в один дотик.</Text>
        {!recentSharedUpdates.length ? (
          <Text style={styles.hint}>Спільних змін поки немає.</Text>
        ) : (
          recentSharedUpdates.map((item) => {
            const id = String(item.id || '');
            const updatedAt = toMillis(item.updatedAt as TimestampLike);
            const timeLabel = updatedAt ? new Date(updatedAt).toLocaleString() : '—';
            const syncState = syncByCharacter[id];
            const syncStatus = getSyncDisplayStatus(syncState, netInfo.isConnected);
            const shareStatus = getShareDisplayStatus({
              isSharedSheet: Array.isArray(item.editors) ? item.editors.length > 0 : false,
              role: roleMode,
              source: sharedSheets.some((sheet) => String(sheet.id || '') === id) ? 'shared' : 'mine',
            });
            return (
              <View key={`recent-${id}`} style={styles.updateRow}>
                <Text style={styles.updateTitle}>{String(item.name || 'Character')}</Text>
                <Text style={styles.updateMeta}>Оновлено: {timeLabel}</Text>
                <Text style={styles.updateMeta}>Статус синхронізації: {syncStatus}</Text>
                {!!shareStatus && <Text style={styles.updateMeta}>Статус спільного доступу: {shareStatus}</Text>}
              </View>
            );
          })
        )}

        <Pressable style={styles.authButton} onPress={() => navigation.navigate('DMSharedUpdates')} android_ripple={{ color: '#999' }}>
          <Text style={styles.authButtonText}>Відкрити чергу спільних оновлень</Text>
        </Pressable>

        {!isSignedIn && (
          <Pressable style={styles.authButton} onPress={onLogin} disabled={isSigningIn} android_ripple={{ color: '#999' }}>
            <Text style={styles.authButtonText}>{isSigningIn ? 'Авторизація…' : 'Увійти через Google для спільної синхронізації'}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
};

export default DM;
