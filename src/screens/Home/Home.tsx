import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { getStyles } from './styles';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import { subscribeMySheets, subscribeSharedWithMe } from '@/repositories/characterCloudRepository';
import type { CharacterSheet } from '@/repositories/characterCloudRepository';
import { ensureUserIndexOnLogin } from '@/services/users';
import { useAuth, configureGoogleSignIn, onGoogleButtonPress } from '@/shared/services/auth/index';
import useSyncStore from '@/context/Sync-store';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import { trackProductEvent } from '@/shared/services/telemetry/productTelemetry';
import { isNetworkOnline } from '@/shared/helpers/collaboration/status';
import { SkeletonHome } from '@/shared/ui/skeleton';
import {
  buildHomeCharacterPreviews,
  buildSyncStrip,
  countConflicts,
  countPendingSync,
  formatInitiative,
  selectContinueState,
} from './homeViewModel';

const HOME_ROLE = 'Player' as const;

const Home = () => {
  const navigation = useNavigation<StackNavigationProp<TabStackParamList>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { user } = useAuth();

  const characters = useCharacterStore((s) => s.characters);
  const charactersLoaded = useCharacterStore((s) => s.isLoaded);
  const charactersLoadError = useCharacterStore((s) => s.loadError);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);
  const lastSessionCharacterId = useCharacterStore((s) => s.lastSessionCharacterId);
  const setLastSessionCharacterId = useCharacterStore((s) => s.setLastSessionCharacterId);

  const syncByCharacter = useSyncStore((s) => s.syncByCharacter);
  const loadSyncMeta = useSyncStore((s) => s.loadSyncMeta);
  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const setCloudAvailability = useSyncStore((s) => s.setCloudAvailability);

  const [myCloud, setMyCloud] = useState<CharacterSheet[]>([]);
  const [sharedCloud, setSharedCloud] = useState<CharacterSheet[]>([]);
  const [cloudPulseAt, setCloudPulseAt] = useState<number | null>(null);
  const netInfo = useNetInfo();

  const isSignedIn = Boolean(user);
  const isOnline = isNetworkOnline(netInfo.isConnected);
  const providerPhoto = user?.photoURL || user?.providerData?.find(Boolean)?.photoURL || null;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Влад';

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
    const localInputs = characters.map((payload) => ({ payload, source: 'local' as const }));
    const myCloudInputs = myCloud.map((doc) => ({
      payload: mapCloudCharacterToLocalDto(doc as unknown as Record<string, unknown>),
      source: 'mine' as const,
      isSharedSheet: Array.isArray(doc.editors) && doc.editors.length > 0,
    }));
    const sharedInputs = sharedCloud.map((doc) => ({
      payload: mapCloudCharacterToLocalDto(doc as unknown as Record<string, unknown>),
      source: 'shared' as const,
      isSharedSheet: true,
    }));

    return buildHomeCharacterPreviews({
      characters: [...localInputs, ...myCloudInputs, ...sharedInputs],
      syncByCharacter,
      isConnected: netInfo.isConnected,
      role: HOME_ROLE,
    });
  }, [characters, myCloud, netInfo.isConnected, sharedCloud, syncByCharacter]);

  const pendingSyncCount = useMemo(
    () => countPendingSync(syncByCharacter, netInfo.isConnected),
    [netInfo.isConnected, syncByCharacter],
  );

  const conflictCount = useMemo(
    () => countConflicts(syncByCharacter, netInfo.isConnected),
    [netInfo.isConnected, syncByCharacter],
  );

  const storeLastSyncAt = useMemo(() => {
    const values = Object.values(syncByCharacter)
      .map((entry) => entry.lastSyncAt)
      .filter((value): value is number => typeof value === 'number');
    if (!values.length) return null;
    return Math.max(...values);
  }, [syncByCharacter]);

  const continueState = useMemo(
    () =>
      selectContinueState({
        previews: previewList,
        lastSessionCharacterId,
        currentCharacterId,
      }),
    [currentCharacterId, lastSessionCharacterId, previewList],
  );

  const syncStrip = useMemo(
    () =>
      buildSyncStrip({
        isOnline,
        isSignedIn,
        pendingCount: pendingSyncCount,
        conflictCount,
        lastSyncAt: storeLastSyncAt ?? cloudPulseAt,
      }),
    [cloudPulseAt, conflictCount, isOnline, isSignedIn, pendingSyncCount, storeLastSyncAt],
  );

  const openRootTab = React.useCallback((routeName: 'DM' | 'References', params?: Record<string, unknown>) => {
    const parent = navigation.getParent();
    if (!parent) return;
    parent.dispatch(CommonActions.navigate({ name: routeName, params }));
  }, [navigation]);

  const quickActions = useMemo(() => {
    const createCharacter = {
      id: 'createCharacter',
      testID: 'home.createCharacterButton',
      icon: 'person-add-outline' as const,
      label: 'Створити персонажа',
      onPress: () => navigation.navigate('CreateCharacter'),
    };
    const rollDice = {
      id: 'rollDice',
      testID: 'home.openDiceButton',
      icon: 'dice-outline' as const,
      label: 'Кинути кубики',
      onPress: () => navigation.navigate('DiceRoller'),
    };
    const spellbook = {
      id: 'spellbook',
      testID: 'home.openSpellbookButton',
      icon: 'book-outline' as const,
      label: 'Заклинання',
      onPress: () => navigation.navigate('Spellbook'),
    };
    const bestiary = {
      id: 'bestiary',
      testID: 'home.openBestiaryButton',
      icon: 'skull-outline' as const,
      label: 'Бестіарій',
      onPress: () => openRootTab('References', { screen: 'List' }),
    };
    return [createCharacter, rollDice, spellbook, bestiary];
  }, [navigation, openRootTab]);

  const openCharacter = async (character: (typeof previewList)[number]) => {
    const existsLocal = characters.find((c) => c.id === character.id);

    if (!existsLocal) {
      await addCharacter(character.payload);
    } else if (character.source !== 'local') {
      await updateCharacter(character.id, character.payload);
    }

    await setLastSessionCharacterId(character.id);
    setCurrentCharacterId(character.id);
    navigation.navigate('Character', { character: character.payload });
    trackProductEvent('character_opened', {
      characterId: character.id,
      source: character.source,
    });
  };

  const continueSession = () => {
    if (!continueState.character) {
      navigation.navigate('CreateCharacter');
      return;
    }

    trackProductEvent('session_continue', {
      characterId: continueState.character.id,
      role: HOME_ROLE,
    });
    void openCharacter(continueState.character);
  };

  const onLogin = async () => {
    try {
      await onGoogleButtonPress();
    } catch (_error) { /* intentionally ignored */ }
  };

  if (!charactersLoaded && !charactersLoadError) {
    return <SkeletonHome />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID='home.screen'>
      <View style={styles.heroCard} testID='home.header'>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.greetingTitle}>Продовжити гру</Text>
            <Text style={styles.greetingMeta}>Режим: Гравець · {userName}</Text>
          </View>
          {providerPhoto ? <Image source={{ uri: providerPhoto }} style={styles.authAvatar} resizeMode='cover' /> : null}
        </View>
      </View>

      {charactersLoadError ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Помилка завантаження</Text>
          <Text style={styles.sectionHint}>{charactersLoadError}</Text>
        </View>
      ) : null}

      <View style={styles.card} testID='home.quickActions'>
        <Text style={styles.sectionTitle}>Швидкі дії</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <Pressable
              key={action.id}
              style={styles.quickButton}
              onPress={action.onPress}
              android_ripple={{ color: colors.ripple }}
              testID={action.testID}
            >
              <Ionicons name={action.icon} size={20} color={colors.text} />
              <Text style={styles.quickButtonText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card} testID='home.continueSession'>
        {continueState.character ? (
          <>
            <Text style={styles.sectionEyebrow}>Продовжити сесію</Text>
            <Text style={styles.continueName}>
              {continueState.character.name} — {continueState.character.className} Рів. {continueState.character.level}
            </Text>
            <Text style={styles.continueMeta}>
              Здоров’я {continueState.character.hpCurrent}/{continueState.character.hpMax} · КЗ {continueState.character.ac} ·{' '}
              {continueState.character.syncStatus === 'Synced' ? 'Синхронізовано' : continueState.character.badges.at(-1)?.label || 'Локально'}
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={continueSession}
              android_ripple={{ color: colors.ripple }}
              testID='home.openSheetButton'
            >
              <Ionicons name='document-text-outline' size={18} color={colors.onPrimary} />
              <Text style={styles.primaryButtonText}>Відкрити лист</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.sectionEyebrow}>Створи першого персонажа</Text>
            <Text style={styles.sectionHint}>Почни з локального персонажа. Синхронізацію й шерінг можна підключити пізніше.</Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => navigation.navigate('CreateCharacter')}
              android_ripple={{ color: colors.ripple }}
              testID='home.emptyCreateButton'
            >
              <Ionicons name='person-add-outline' size={18} color={colors.onPrimary} />
              <Text style={styles.primaryButtonText}>Створити персонажа</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Персонажі</Text>
        <Text style={styles.sectionHint}>{previewList.length ? `${previewList.length} готово до гри` : 'Немає персонажів'}</Text>
      </View>

      {previewList.map((item) => (
        <Pressable
          key={item.id}
          style={styles.characterCard}
          onPress={() => {
            void openCharacter(item);
          }}
          android_ripple={{ color: colors.ripple }}
          testID={`home.character.${item.id}`}
        >
          <View style={styles.characterHeader}>
            <View style={styles.characterTitleWrap}>
              <Text style={styles.characterName}>{item.name}</Text>
              <Text style={styles.characterMeta}>
                {item.race} {item.className} · Рівень {item.level}
              </Text>
            </View>
            <Ionicons name='chevron-forward-outline' size={20} color={colors.textSecondary} />
          </View>

          <View style={styles.characterStatsRow}>
            <View style={styles.characterStatBox}>
              <Text style={styles.characterStatLabel}>Здоров’я</Text>
              <Text style={styles.characterStatValue}>{item.hpCurrent}/{item.hpMax}</Text>
            </View>
            <View style={styles.characterStatBox}>
              <Text style={styles.characterStatLabel}>КЗ</Text>
              <Text style={styles.characterStatValue}>{item.ac}</Text>
            </View>
            <View style={styles.characterStatBox}>
              <Text style={styles.characterStatLabel}>Ініціатива</Text>
              <Text style={styles.characterStatValue}>{formatInitiative(item.initiative)}</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            {item.badges.map((badge) => (
              <View
                key={`${item.id}-${badge.kind}`}
                style={[
                  styles.badge,
                  badge.kind === 'synced' ? styles.successBadge : null,
                  badge.kind === 'pending' || badge.kind === 'offline' ? styles.warningBadge : null,
                  badge.kind === 'conflict' ? styles.conflictBadge : null,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    badge.kind === 'synced' ? styles.successBadgeText : null,
                    badge.kind === 'pending' || badge.kind === 'offline' ? styles.warningBadgeText : null,
                    badge.kind === 'conflict' ? styles.conflictBadgeText : null,
                  ]}
                >
                  {badge.label}
                </Text>
              </View>
            ))}
          </View>
        </Pressable>
      ))}

      {!previewList.length ? (
        <View style={styles.emptyInline} testID='home.emptyState'>
          <Text style={styles.emptyTitle}>Ще немає персонажів</Text>
          <Text style={styles.sectionHint}>Головна стане швидким стартом, щойно з’явиться перший лист.</Text>
        </View>
      ) : null}

      <View
        style={[
          styles.syncStrip,
          syncStrip.hasConflict ? styles.syncStripDanger : null,
          !syncStrip.hasConflict && syncStrip.hasPending ? styles.syncStripWarning : null,
        ]}
        testID='home.syncStrip'
      >
        <View style={styles.syncStripHeader}>
          <Ionicons
            name={syncStrip.hasConflict ? 'alert-circle-outline' : syncStrip.hasPending ? 'cloud-upload-outline' : 'checkmark-circle-outline'}
            size={20}
            color={syncStrip.hasConflict ? colors.danger : syncStrip.hasPending ? colors.warning : colors.success}
          />
          <Text style={styles.syncStripTitle}>{syncStrip.hasConflict ? 'Виявлено конфлікт' : syncStrip.hasPending ? 'Очікують офлайн-зміни' : 'Синхронізовано'}</Text>
        </View>
        <View style={styles.syncPillRow}>
          <Text style={styles.syncPillText}>{syncStrip.networkLabel}</Text>
          <Text style={styles.syncPillText}>{syncStrip.cloudLabel}</Text>
          <Text style={styles.syncPillText}>{syncStrip.lastSyncLabel}</Text>
          <Text style={styles.syncPillText}>{syncStrip.pendingLabel}</Text>
          <Text style={styles.syncPillText}>{syncStrip.conflictLabel}</Text>
        </View>
        {!isSignedIn ? (
          <Pressable style={styles.cloudLoginButton} onPress={onLogin} android_ripple={{ color: colors.ripple }} testID='home.cloudLoginButton'>
            <Text style={styles.cloudLoginText}>Увійти для хмари</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
};

export default Home;
