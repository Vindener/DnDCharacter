import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import useCharacterStore from '@/context/Character-store';
import useSyncStore from '@/context/Sync-store';
import { subscribeMySheets, subscribeSharedWithMe } from '@/repositories/characterCloudRepository';
import { fbAuth } from '@/services/firebase';
import { onGoogleButtonPress } from '@/shared/services/auth';
import useAppRoleStore from '@/context/AppRole-store';
import { getShareDisplayStatus, getSyncDisplayStatus, isNetworkOnline } from '@/shared/helpers/collaboration/status';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import { ensureCampaignForName, subscribeAccessibleCampaigns } from '@/dm/repositories/campaignRepository';
import { loadLocalCampaignNotes } from '@/dm/repositories/campaignNotesRepository';
import type { DMCampaign } from '@/dm/domain/types';
import type { CharacterViewModel } from '@/types/Character';
import type { AppRole } from '@/types/Product';
import type { ShareDisplayStatus, SyncDisplayStatus } from '@/shared/helpers/collaboration/status';

type TimestampLike = { toMillis?: () => number; seconds?: number } | null | undefined;

type DashboardCharacter = {
  id: string;
  payload: CharacterViewModel;
  source: 'local' | 'mine' | 'shared';
};

const toMillis = (value: TimestampLike): number => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
};

const DM: React.FC = () => {
  const { t } = useTranslation(['dm', 'common']);
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

  const refreshNotesCount = React.useCallback(async () => {
    const notes = await loadLocalCampaignNotes();
    setNotesCount(notes.length);
  }, []);

  const isSignedIn = Boolean(fbAuth.currentUser);
  const isOnline = isNetworkOnline(netInfo.isConnected);

  const formatRole = React.useCallback((role: AppRole) => t(`common:roles.${role}`), [t]);
  const formatSyncStatus = React.useCallback(
    (status: SyncDisplayStatus) => {
      if (status === 'Synced') return t('common:status.synced');
      if (status === 'Pending sync') return t('common:status.pendingSync');
      if (status === 'Offline changes pending') return t('common:status.offlineChanges');
      if (status === 'Conflict detected') return t('common:status.conflictDetected');
      return t('common:status.localOnly');
    },
    [t],
  );
  const formatShareStatus = React.useCallback(
    (status: ShareDisplayStatus) => {
      if (status === 'Shared with DM') return t('common:status.sharedWithDm');
      if (status === 'Shared with Player') return t('common:status.sharedWithPlayer');
      return '';
    },
    [t],
  );
  const formatSource = React.useCallback(
    (source: DashboardCharacter['source']) => {
      if (source === 'local') return t('common:status.localOnly');
      if (source === 'mine') return t('common:status.cloud');
      return t('common:status.shared');
    },
    [t],
  );

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

  useFocusEffect(
    React.useCallback(() => {
      void refreshNotesCount();
    }, [refreshNotesCount]),
  );

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
    const parent = navigation.getParent();
    if (!parent) return;
    parent.dispatch(CommonActions.navigate({ name: routeName, params }));
  };

  const ensureLocalCharacter = async (character: CharacterViewModel) => {
    const existing = useCharacterStore.getState().characters.find((item) => item.id === character.id);
    if (existing) {
      await updateCharacter(existing.id, character);
    } else {
      await addCharacter(character);
    }
    return character;
  };

  const openFullSheet = async (character: CharacterViewModel) => {
    const local = await ensureLocalCharacter(character);
    setCurrentCharacterId(local.id);
    const parent = navigation.getParent();
    if (!parent) return;
    parent.dispatch(
      CommonActions.navigate({
        name: 'Heroes',
        params: { screen: 'Character', params: { character: local } },
      }),
    );
  };

  const openQuickEdit = async (character: CharacterViewModel) => {
    const local = await ensureLocalCharacter(character);
    navigation.navigate('DMQuickEdit', { characterId: local.id });
  };

  const onLogin = async () => {
    try {
      setIsSigningIn(true);
      await onGoogleButtonPress();
      setAuthVersion((prev) => prev + 1);
    } catch (_error) { /* intentionally ignored */ }
    setIsSigningIn(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID='dm.screen'>
      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:dashboard.partyOverviewTitle')}</Text>
        <Text style={styles.hint}>{t('dm:dashboard.partyOverviewHint')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>{t('dm:dashboard.campaigns', { count: campaigns.length })}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>{t('dm:dashboard.partySize', { count: unifiedParty.length })}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>
              {t('dm:dashboard.network', { status: isOnline ? t('common:status.online') : t('common:status.offline') })}
            </Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>{t('dm:dashboard.pendingSync', { count: pendingSyncCount })}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>{t('dm:dashboard.conflicts', { count: conflictCount })}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>{t('dm:dashboard.role', { role: formatRole(roleMode) })}</Text>
          </View>
        </View>
        <Pressable
          style={styles.authButton}
          onPress={() => navigation.navigate('DMPartyOverview')}
          android_ripple={{ color: colors.ripple }}
          testID='dm.partyOverviewButton'
        >
          <Text style={styles.authButtonText}>{t('dm:dashboard.openPartyOverview')}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:dashboard.encounterPrepTitle')}</Text>
        <Text style={styles.hint}>{t('dm:dashboard.encounterPrepHint')}</Text>
        <View style={styles.laneGrid}>
          <Pressable
            style={styles.laneButton}
            onPress={() => navigation.navigate('DMEncounterPrep', { campaignId: campaigns[0]?.id })}
            android_ripple={{ color: colors.ripple }}
            testID='dm.encounterPrepButton'
          >
            <Ionicons name='rocket-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('dm:dashboard.startEncounterPrep')}</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={() => openRootTab('Initiative')} android_ripple={{ color: colors.ripple }}>
            <Ionicons name='flame-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('dm:dashboard.openInitiative')}</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={() => openRootTab('References', { screen: 'List' })} android_ripple={{ color: colors.ripple }}>
            <Ionicons name='skull-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('dm:dashboard.quickBestiary')}</Text>
          </Pressable>
          <Pressable
            style={styles.laneButton}
            onPress={() => openRootTab('References', { screen: 'Spellbook', params: { mode: 'dm', quickView: true } })}
            android_ripple={{ color: colors.ripple }}
          >
            <Ionicons name='book-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('dm:dashboard.quickSpellbook')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:dashboard.sharedCharactersTitle')}</Text>
        <Text style={styles.hint}>{t('dm:dashboard.sharedCharactersHint')}</Text>
        {unifiedParty.slice(0, 4).map((item) => {
          const syncStatus = getSyncDisplayStatus(syncByCharacter[item.id], netInfo.isConnected);
          const shareStatus = getShareDisplayStatus({
            isSharedSheet: item.source === 'shared',
            role: roleMode,
            source: item.source,
          });

          return (
            <View key={item.id} style={styles.updateRow}>
              <Text style={styles.updateTitle}>{item.payload.name || t('common:fallbacks.character')}</Text>
              <Text style={styles.updateMeta}>{t('dm:dashboard.source', { source: formatSource(item.source) })}</Text>
              <Text style={styles.updateMeta}>{t('dm:dashboard.syncStatus', { status: formatSyncStatus(syncStatus) })}</Text>
              {!!shareStatus && <Text style={styles.updateMeta}>{t('dm:dashboard.shareStatus', { status: formatShareStatus(shareStatus) })}</Text>}
              <View style={styles.laneGrid}>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void openFullSheet(item.payload);
                  }}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Ionicons name='link-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:dashboard.openLiveCopy')}</Text>
                </Pressable>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void openQuickEdit(item.payload);
                  }}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Ionicons name='create-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:dashboard.quickEdit')}</Text>
                </Pressable>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void openFullSheet(item.payload);
                  }}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Ionicons name='document-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:dashboard.openFullSheet')}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:dashboard.campaignNotesTitle')}</Text>
        <Text style={styles.hint}>{t('dm:dashboard.campaignNotesHint')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>{t('dm:dashboard.campaignNotesCount', { count: notesCount })}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>{t('dm:dashboard.trackedCampaigns', { count: campaigns.length })}</Text>
          </View>
        </View>
        <Pressable
          style={styles.authButton}
          onPress={() => navigation.navigate('DMCampaignNotes', { campaignId: campaigns[0]?.id })}
          android_ripple={{ color: colors.ripple }}
          testID='dm.campaignNotesButton'
        >
          <Text style={styles.authButtonText}>{t('dm:dashboard.openCampaignNotes')}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:dashboard.recentSharedTitle')}</Text>
        <Text style={styles.hint}>{t('dm:dashboard.recentSharedHint')}</Text>
        {!recentSharedUpdates.length ? (
          <Text style={styles.hint}>{t('dm:dashboard.noSharedUpdates')}</Text>
        ) : (
          recentSharedUpdates.map((item) => {
            const id = String(item.id || '');
            const updatedAt = toMillis(item.updatedAt as TimestampLike);
            const timeLabel = updatedAt ? new Date(updatedAt).toLocaleString() : t('common:fallbacks.none');
            const syncState = syncByCharacter[id];
            const syncStatus = getSyncDisplayStatus(syncState, netInfo.isConnected);
            const shareStatus = getShareDisplayStatus({
              isSharedSheet: Array.isArray(item.editors) ? item.editors.length > 0 : false,
              role: roleMode,
              source: sharedSheets.some((sheet) => String(sheet.id || '') === id) ? 'shared' : 'mine',
            });
            return (
              <View key={`recent-${id}`} style={styles.updateRow}>
                <Text style={styles.updateTitle}>{String(item.name || t('common:fallbacks.character'))}</Text>
                <Text style={styles.updateMeta}>{t('dm:dashboard.updatedAt', { value: timeLabel })}</Text>
                <Text style={styles.updateMeta}>{t('dm:dashboard.syncStatus', { status: formatSyncStatus(syncStatus) })}</Text>
                {!!shareStatus && <Text style={styles.updateMeta}>{t('dm:dashboard.shareStatus', { status: formatShareStatus(shareStatus) })}</Text>}
              </View>
            );
          })
        )}

        <Pressable
          style={styles.authButton}
          onPress={() => navigation.navigate('DMSharedUpdates')}
          android_ripple={{ color: colors.ripple }}
          testID='dm.sharedUpdatesButton'
        >
          <Text style={styles.authButtonText}>{t('dm:dashboard.openSharedQueue')}</Text>
        </Pressable>

        {!isSignedIn && (
          <Pressable style={styles.authButton} onPress={onLogin} disabled={isSigningIn} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.authButtonText}>{isSigningIn ? t('dm:dashboard.signingIn') : t('dm:dashboard.signInForSharedSync')}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
};

export default DM;



