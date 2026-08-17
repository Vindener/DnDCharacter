import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import useCharacterStore from '@/context/Character-store';
import useSyncStore from '@/context/Sync-store';
import useAppRoleStore from '@/context/AppRole-store';
import { subscribeMySheets, subscribeSharedWithMe } from '@/repositories/characterCloudRepository';
import { fbAuth } from '@/services/firebase';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import { getShareDisplayStatus, getSyncDisplayStatus } from '@/shared/helpers/collaboration/status';
import type { CharacterViewModel } from '@/types/Character';
import { ensureCampaignForName, getCampaignForLink, subscribeAccessibleCampaigns } from '@/dm/repositories/campaignRepository';
import type { DMCampaign } from '@/dm/domain/types';
import { buildCampaignFallbackIdForCharacter, toCampaignLinkInput } from '@/screens/DM/adapters';

type PartyItem = {
  id: string;
  source: 'local' | 'mine' | 'shared';
  payload: CharacterViewModel;
  syncStatus: string;
  shareStatus: string | null;
  campaignId: string;
  campaignName: string;
};

const DMPartyOverview = () => {
  const { t, i18n } = useTranslation(['dm', 'common']);
  const navigation = useNavigation<StackNavigationProp<DMStackParamList, 'DMPartyOverview'>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const localCharacters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);
  const syncByCharacter = useSyncStore((s) => s.syncByCharacter);
  const markLocalDraftPaths = useSyncStore((s) => s.markLocalDraftPaths);
  const roleMode = useAppRoleStore((s) => s.role);
  const netInfo = useNetInfo();

  const [mySheets, setMySheets] = useState<Record<string, unknown>[]>([]);
  const [sharedSheets, setSharedSheets] = useState<Record<string, unknown>[]>([]);
  const [campaigns, setCampaigns] = useState<DMCampaign[]>([]);

  useEffect(() => {
    let unsubCampaigns = () => {};
    let cancelled = false;

    const run = async () => {
      unsubCampaigns = await subscribeAccessibleCampaigns((next) => {
        if (!cancelled) setCampaigns(next);
      });
    };

    void run();

    return () => {
      cancelled = true;
      if (typeof unsubCampaigns === 'function') unsubCampaigns();
    };
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
  }, []);

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

  const party = useMemo<PartyItem[]>(() => {
    const byId = new Map<string, PartyItem>();

    const pushItem = (payload: CharacterViewModel, source: 'local' | 'mine' | 'shared', rawDoc?: Record<string, unknown>) => {
      const syncStatus = getSyncDisplayStatus(syncByCharacter[payload.id], netInfo.isConnected);
      const shareStatus = getShareDisplayStatus({
        isSharedSheet: source === 'shared' || Boolean(rawDoc && Array.isArray(rawDoc.editors) && rawDoc.editors.length > 0),
        role: roleMode,
        source,
      });

      const campaign = getCampaignForLink(toCampaignLinkInput(payload), campaigns);
      const campaignId = campaign?.id || payload.campaignId || buildCampaignFallbackIdForCharacter(payload);
      const campaignName = campaign?.name || String(payload.campaign || t('dm:partyOverview.unassignedCampaign'));

      byId.set(payload.id, {
        id: payload.id,
        source,
        payload,
        syncStatus,
        shareStatus,
        campaignId,
        campaignName,
      });
    };

    localCharacters.forEach((character) => pushItem(character, 'local'));
    mySheets.forEach((doc) => pushItem(mapCloudCharacterToLocalDto(doc), 'mine', doc));
    sharedSheets.forEach((doc) => pushItem(mapCloudCharacterToLocalDto(doc), 'shared', doc));

    return Array.from(byId.values()).sort(
      (a, b) => a.campaignName.localeCompare(b.campaignName, i18n.language) || a.payload.name.localeCompare(b.payload.name, i18n.language),
    );
  }, [campaigns, i18n.language, localCharacters, mySheets, netInfo.isConnected, roleMode, sharedSheets, syncByCharacter, t]);

  const grouped = useMemo(() => {
    const map = new Map<string, { id: string; name: string; items: PartyItem[] }>();
    for (const item of party) {
      const existing = map.get(item.campaignId);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.campaignId, {
          id: item.campaignId,
          name: item.campaignName,
          items: [item],
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, i18n.language));
  }, [i18n.language, party]);

  const ensureLocalCharacter = async (character: CharacterViewModel) => {
    const existing = useCharacterStore.getState().characters.find((item) => item.id === character.id);
    if (existing) {
      await updateCharacter(existing.id, character);
    } else {
      await addCharacter(character);
    }
    return character;
  };

  const openCharacter = async (character: CharacterViewModel) => {
    const local = await ensureLocalCharacter(character);
    setCurrentCharacterId(local.id);
    const root = navigation.getParent();
    if (!root) return;
    root.dispatch(
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

  const formatSource = (source: PartyItem['source']) => t(`dm:partyOverview.sources.${source}`);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:partyOverview.title')}</Text>
        <Text style={styles.hint}>{t('dm:partyOverview.hint')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>{t('dm:partyOverview.campaigns', { count: grouped.length })}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipText}>{t('dm:partyOverview.characters', { count: party.length })}</Text>
          </View>
        </View>
      </View>

      {grouped.map((group) => (
        <View key={group.id} style={styles.card}>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.hint}>{t('dm:partyOverview.campaignId', { id: group.id })}</Text>

          {group.items.map((item) => (
            <View key={item.id} style={styles.updateRow}>
              <Text style={styles.updateTitle}>{item.payload.name || 'Character'}</Text>
              <Text style={styles.updateMeta}>{t('dm:partyOverview.source', { source: formatSource(item.source) })}</Text>
              <Text style={styles.updateMeta}>{t('dm:partyOverview.syncStatus', { status: formatSyncStatus(item.syncStatus) })}</Text>
              {!!item.shareStatus && (
                <Text style={styles.updateMeta}>{t('dm:partyOverview.shareStatus', { status: formatShareStatus(item.shareStatus) })}</Text>
              )}
              <Text style={styles.updateMeta}>
                {t('dm:partyOverview.classRace', {
                  className: item.payload.class || t('common:fallbacks.class'),
                  race: item.payload.race || t('common:fallbacks.race'),
                })}
              </Text>

              <View style={styles.laneGrid}>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void openCharacter(item.payload);
                  }}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Ionicons name='link-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:partyOverview.openLiveCopy')}</Text>
                </Pressable>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void openQuickEdit(item.payload);
                  }}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Ionicons name='create-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:partyOverview.quickEdit')}</Text>
                </Pressable>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void openCharacter(item.payload);
                  }}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Ionicons name='document-text-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:partyOverview.openFullSheet')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ))}

      {!grouped.length && (
        <View style={styles.card}>
          <Text style={styles.hint}>{t('dm:partyOverview.empty')}</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default DMPartyOverview;
