import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

type TimestampLike = { toMillis?: () => number; seconds?: number } | null | undefined;

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
  const syncByCharacter = useSyncStore((s) => s.syncByCharacter);

  const [authVersion, setAuthVersion] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [mySheets, setMySheets] = useState<Record<string, unknown>[]>([]);
  const [sharedSheets, setSharedSheets] = useState<Record<string, unknown>[]>([]);

  const isSignedIn = useMemo(() => Boolean(fbAuth.currentUser), [authVersion]);

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

  const pendingSyncCount = useMemo(
    () =>
      Object.values(syncByCharacter).filter(
        (entry) => entry.status === 'pending-upload' || entry.status === 'pending-download',
      ).length,
    [syncByCharacter],
  );
  const conflictCount = useMemo(
    () => Object.values(syncByCharacter).filter((entry) => entry.status === 'conflict').length,
    [syncByCharacter],
  );

  const sharedTotal = sharedSheets.length;
  const ownedCloudTotal = mySheets.length;

  const recentSharedUpdates = useMemo(() => {
    const all = [...mySheets, ...sharedSheets];
    return all
      .slice()
      .sort((a, b) => toMillis(b.updatedAt as TimestampLike) - toMillis(a.updatedAt as TimestampLike))
      .slice(0, 4);
  }, [mySheets, sharedSheets]);

  const openRootTab = (routeName: string) => {
    const parent = navigation.getParent() as any;
    if (!parent) return;
    parent.navigate(routeName);
  };

  const openHeroesNested = (screen: 'Spellbook' | 'Home') => {
    const parent = navigation.getParent() as any;
    if (!parent) return;
    parent.navigate('Heroes', { screen });
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
        <Text style={styles.title}>Party Overview</Text>
        <Text style={styles.hint}>Primary card для DM. Тут видно стан партії, shared-шари і sync-ризики.</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Local party: {localCharacters.length}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Cloud owned: {ownedCloudTotal}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Shared with me: {sharedTotal}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Pending sync: {pendingSyncCount}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>Conflicts: {conflictCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Shared Sheet Management</Text>
        <Text style={styles.hint}>Lane для керування shared листами і review workflow.</Text>
        <View style={styles.laneGrid}>
          <Pressable
            style={styles.laneButton}
            onPress={() => navigation.navigate('DMSharedUpdates')}
            android_ripple={{ color: '#999' }}
          >
            <Ionicons name='git-compare-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Shared Updates Queue</Text>
          </Pressable>
          <Pressable
            style={styles.laneButton}
            onPress={() => navigation.navigate('DMNotes')}
            android_ripple={{ color: '#999' }}
          >
            <Ionicons name='document-text-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Review Notes</Text>
          </Pressable>
        </View>
        {!isSignedIn && (
          <Pressable style={styles.authButton} onPress={onLogin} disabled={isSigningIn} android_ripple={{ color: '#999' }}>
            <Text style={styles.authButtonText}>{isSigningIn ? 'Авторизація…' : 'Увійти через Google для shared sync'}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Session Tools Lane</Text>
        <View style={styles.laneGrid}>
          <Pressable style={styles.laneButton} onPress={() => navigation.navigate('EncounterCalculator')} android_ripple={{ color: '#999' }}>
            <Ionicons name='calculator-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Encounter Calculator</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={() => navigation.navigate('LootGenerator')} android_ripple={{ color: '#999' }}>
            <Ionicons name='diamond-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Loot Generator</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={() => openRootTab('Initiative')} android_ripple={{ color: '#999' }}>
            <Ionicons name='flame-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Initiative Board</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={() => navigation.navigate('DMNotes')} android_ripple={{ color: '#999' }}>
            <Ionicons name='clipboard-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Session Notes</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Campaign Tools Lane</Text>
        <View style={styles.laneGrid}>
          <Pressable style={styles.laneButton} onPress={() => openRootTab('Bestiary')} android_ripple={{ color: '#999' }}>
            <Ionicons name='skull-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Bestiary</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={() => openHeroesNested('Spellbook')} android_ripple={{ color: '#999' }}>
            <Ionicons name='book-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Spellbook</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={() => openHeroesNested('Home')} android_ripple={{ color: '#999' }}>
            <Ionicons name='people-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Party Home</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={() => navigation.navigate('DMSharedUpdates')} android_ripple={{ color: '#999' }}>
            <Ionicons name='time-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Recent Shared Updates</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Recent Shared Updates Workflow</Text>
        <Text style={styles.hint}>Останні cloud оновлення для швидкого review у DM queue.</Text>
        {!recentSharedUpdates.length ? (
          <Text style={styles.hint}>Поки немає shared оновлень.</Text>
        ) : (
          recentSharedUpdates.map((item) => {
            const id = String(item.id || '');
            const updatedAt = toMillis(item.updatedAt as TimestampLike);
            const timeLabel = updatedAt ? new Date(updatedAt).toLocaleString() : '—';
            return (
              <View key={`recent-${id}`} style={styles.updateRow}>
                <Text style={styles.updateTitle}>{String(item.name || 'Character')}</Text>
                <Text style={styles.updateMeta}>Sheet ID: {id || '—'}</Text>
                <Text style={styles.updateMeta}>Updated: {timeLabel}</Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

export default DM;
