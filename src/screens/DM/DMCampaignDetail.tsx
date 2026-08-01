import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import useCharacterStore from '@/context/Character-store';
import useSyncStore from '@/context/Sync-store';
import { subscribeMySheets, subscribeSharedWithMe } from '@/repositories/characterCloudRepository';
import { fbAuth } from '@/services/firebase';
import type { DMCampaign, DMCampaignEncounter } from '@/dm/domain/types';
import { subscribeAccessibleCampaigns, updateCampaignSummary } from '@/dm/repositories/campaignRepository';
import { subscribeCampaignEncounters, upsertCampaignEncounter } from '@/dm/repositories/campaignEncountersRepository';
import { buildUnifiedPartyList, isCharacterInCampaign, type UnifiedPartyItem } from '@/screens/DM/adapters';
import type { CharacterViewModel } from '@/types/Character';

type Props = StackScreenProps<DMStackParamList, 'DMCampaignDetail'>;

const DMCampaignDetail: React.FC<Props> = ({ route, navigation }) => {
  const { campaignId } = route.params;
  const { t } = useTranslation(['dm', 'common']);
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const localCharacters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const markLocalDraftPaths = useSyncStore((s) => s.markLocalDraftPaths);

  const [mySheets, setMySheets] = useState<Record<string, unknown>[]>([]);
  const [sharedSheets, setSharedSheets] = useState<Record<string, unknown>[]>([]);
  const [campaigns, setCampaigns] = useState<DMCampaign[]>([]);

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryInput, setSummaryInput] = useState('');
  const [partyLevelInput, setPartyLevelInput] = useState('');
  const [encounters, setEncounters] = useState<DMCampaignEncounter[]>([]);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;

    const run = async () => {
      unsub = await subscribeAccessibleCampaigns((next) => {
        if (!cancelled) setCampaigns(next);
      });
    };

    void run();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
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
    let unsub = () => {};
    let cancelled = false;

    const run = async () => {
      unsub = await subscribeCampaignEncounters(campaignId, (next) => {
        if (!cancelled) setEncounters(next);
      });
    };

    void run();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, [campaignId]);

  const campaign = useMemo(() => campaigns.find((item) => item.id === campaignId) || null, [campaigns, campaignId]);

  const unifiedParty = useMemo(
    () => buildUnifiedPartyList(localCharacters, mySheets, sharedSheets),
    [localCharacters, mySheets, sharedSheets],
  );

  const members = useMemo<UnifiedPartyItem[]>(
    () => unifiedParty.filter((item) => isCharacterInCampaign(item.payload, campaign)),
    [campaign, unifiedParty],
  );

  const addableCharacters = useMemo<UnifiedPartyItem[]>(
    () => unifiedParty.filter((item) => !isCharacterInCampaign(item.payload, campaign)),
    [campaign, unifiedParty],
  );

  const formatSource = (source: UnifiedPartyItem['source']) => t(`dm:partyOverview.sources.${source}`);

  const ensureLocalCharacter = async (character: CharacterViewModel) => {
    const existing = useCharacterStore.getState().characters.find((item) => item.id === character.id);
    if (existing) {
      await updateCharacter(existing.id, character);
      return existing;
    }
    await addCharacter(character);
    return character;
  };

  const attachCharacter = async (character: CharacterViewModel) => {
    if (!campaign) return;
    const local = await ensureLocalCharacter(character);
    await updateCharacter(local.id, { ...local, campaignId: campaign.id });
    await markLocalDraftPaths(local.id, ['overview.identity']);
  };

  const detachCharacter = async (character: CharacterViewModel) => {
    const local = await ensureLocalCharacter(character);
    // Product decision (docs/campaign-management-prompts.md, C3): detach clears both
    // campaignId and the legacy free-text `campaign` field. Clearing only campaignId would
    // leave resolveCampaignForLink's legacy name match active (buildLegacyCampaignFallbackId),
    // so the character would immediately snap back into this same campaign on next read.
    await updateCharacter(local.id, { ...local, campaignId: undefined, campaign: '' });
    await markLocalDraftPaths(local.id, ['overview.identity']);
  };

  const startEditingSummary = () => {
    if (!campaign) return;
    setSummaryInput(campaign.summary || '');
    setPartyLevelInput(campaign.partyLevelEstimate != null ? String(campaign.partyLevelEstimate) : '');
    setIsEditingSummary(true);
  };

  const cancelEditingSummary = () => setIsEditingSummary(false);

  const saveSummary = async () => {
    if (!campaign) return;
    const trimmedLevel = partyLevelInput.trim();
    await updateCampaignSummary(campaign.id, {
      summary: summaryInput.trim() || undefined,
      partyLevelEstimate: trimmedLevel ? Number(trimmedLevel) : undefined,
    });
    setIsEditingSummary(false);
  };

  const openEncounter = (encounter: DMCampaignEncounter) => {
    navigation.navigate('DMEncounterPrep', {
      campaignId,
      initialMonsters: encounter.monsters.map(({ id: _id, selected: _selected, ...monster }) => monster),
      initialSelectedCharacterIds: encounter.players.map((player) => player.characterId),
    });
  };

  const markEncounterAsRun = async (encounter: DMCampaignEncounter) => {
    await upsertCampaignEncounter({ ...encounter, status: 'run' });
  };

  const formatEncounterStatus = (status: DMCampaignEncounter['status']) => t(`dm:campaignDetail.encounterHistory.statuses.${status}`);

  if (!campaign) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.hint}>{t('dm:campaignDetail.notFound')}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID='dmCampaignDetail.screen'>
      <View style={styles.card}>
        <Text style={styles.title}>{campaign.name}</Text>

        {isEditingSummary ? (
          <>
            <Text style={styles.modalLabel}>{t('dm:campaignsList.summaryPlaceholder')}</Text>
            <TextInput
              value={summaryInput}
              onChangeText={setSummaryInput}
              placeholder={t('dm:campaignsList.summaryPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
              testID='dmCampaignDetail.summaryInput'
            />
            <Text style={styles.modalLabel}>{t('dm:campaignDetail.partyLevelPlaceholder')}</Text>
            <TextInput
              value={partyLevelInput}
              onChangeText={setPartyLevelInput}
              placeholder={t('dm:campaignDetail.partyLevelPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              keyboardType='number-pad'
              style={styles.modalInput}
              testID='dmCampaignDetail.partyLevelInput'
            />
            <View style={styles.laneGrid}>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  void saveSummary();
                }}
                android_ripple={{ color: colors.ripple }}
              >
                <Ionicons name='checkmark-outline' size={18} color={colors.text} />
                <Text style={styles.laneButtonText}>{t('dm:campaignDetail.saveSummary')}</Text>
              </Pressable>
              <Pressable style={styles.laneButton} onPress={cancelEditingSummary} android_ripple={{ color: colors.ripple }}>
                <Ionicons name='close-outline' size={18} color={colors.text} />
                <Text style={styles.laneButtonText}>{t('dm:campaignDetail.cancelEditSummary')}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.hint}>{campaign.summary || t('dm:campaignsList.noSummary')}</Text>
            {typeof campaign.partyLevelEstimate === 'number' && (
              <Text style={styles.hint}>{t('dm:campaignsList.partyLevel', { level: campaign.partyLevelEstimate })}</Text>
            )}
            <Pressable
              style={styles.authButton}
              onPress={startEditingSummary}
              android_ripple={{ color: colors.ripple }}
              testID='dmCampaignDetail.editSummaryButton'
            >
              <Text style={styles.authButtonText}>{t('dm:campaignDetail.editSummary')}</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:campaignDetail.membersTitle')}</Text>
        <Text style={styles.hint}>{t('dm:campaignsList.members', { count: members.length })}</Text>

        {members.map((item) => (
          <View key={item.id} style={styles.updateRow}>
            <Text style={styles.updateTitle}>{item.payload.name || t('common:fallbacks.character')}</Text>
            <Text style={styles.updateMeta}>{t('dm:partyOverview.source', { source: formatSource(item.source) })}</Text>
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
                  void detachCharacter(item.payload);
                }}
                android_ripple={{ color: colors.ripple }}
                testID={`dmCampaignDetail.detach.${item.id}`}
              >
                <Ionicons name='remove-circle-outline' size={18} color={colors.text} />
                <Text style={styles.laneButtonText}>{t('dm:campaignDetail.detach')}</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {!members.length && <Text style={styles.hint}>{t('dm:campaignDetail.emptyMembers')}</Text>}

        {isAddingMember ? (
          <>
            {addableCharacters.map((item) => (
              <View key={item.id} style={styles.updateRow}>
                <Text style={styles.updateTitle}>{item.payload.name || t('common:fallbacks.character')}</Text>
                <Text style={styles.updateMeta}>{t('dm:partyOverview.source', { source: formatSource(item.source) })}</Text>
                <View style={styles.laneGrid}>
                  <Pressable
                    style={styles.laneButton}
                    onPress={() => {
                      void attachCharacter(item.payload);
                    }}
                    android_ripple={{ color: colors.ripple }}
                    testID={`dmCampaignDetail.attach.${item.id}`}
                  >
                    <Ionicons name='add-circle-outline' size={18} color={colors.text} />
                    <Text style={styles.laneButtonText}>{t('dm:campaignDetail.attach')}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {!addableCharacters.length && <Text style={styles.hint}>{t('dm:campaignDetail.noAddableCharacters')}</Text>}
            <Pressable style={styles.authButton} onPress={() => setIsAddingMember(false)} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.authButtonText}>{t('dm:campaignDetail.cancelAddMember')}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={styles.authButton}
            onPress={() => setIsAddingMember(true)}
            android_ripple={{ color: colors.ripple }}
            testID='dmCampaignDetail.addMemberButton'
          >
            <Text style={styles.authButtonText}>{t('dm:campaignDetail.addMemberButton')}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:campaignDetail.encounterHistory.title')}</Text>
        {!encounters.length && <Text style={styles.hint}>{t('dm:campaignDetail.encounterHistory.empty')}</Text>}
        {encounters.map((encounter) => (
          <View key={encounter.id} style={styles.updateRow}>
            <Text style={styles.updateTitle}>{encounter.label}</Text>
            <Text style={styles.updateMeta}>
              {t('dm:campaignDetail.encounterHistory.status', { status: formatEncounterStatus(encounter.status) })}
            </Text>
            <Text style={styles.updateMeta}>
              {t('dm:campaignDetail.encounterHistory.counts', { players: encounter.players.length, monsters: encounter.monsters.length })}
            </Text>
            <View style={styles.laneGrid}>
              <Pressable
                style={styles.laneButton}
                onPress={() => openEncounter(encounter)}
                android_ripple={{ color: colors.ripple }}
                testID={`dmCampaignDetail.openEncounter.${encounter.id}`}
              >
                <Ionicons name='folder-open-outline' size={18} color={colors.text} />
                <Text style={styles.laneButtonText}>{t('dm:campaignDetail.encounterHistory.open')}</Text>
              </Pressable>
              {encounter.status !== 'run' && (
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void markEncounterAsRun(encounter);
                  }}
                  android_ripple={{ color: colors.ripple }}
                  testID={`dmCampaignDetail.markEncounterRun.${encounter.id}`}
                >
                  <Ionicons name='checkmark-done-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:campaignDetail.encounterHistory.markRun')}</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:campaignDetail.quickActionsTitle')}</Text>
        <View style={styles.laneGrid}>
          <Pressable
            style={styles.laneButton}
            onPress={() => navigation.navigate('DMCampaignNotes', { campaignId: campaign.id })}
            android_ripple={{ color: colors.ripple }}
            testID='dmCampaignDetail.openNotesButton'
          >
            <Ionicons name='document-text-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('dm:campaignDetail.openNotes')}</Text>
          </Pressable>
          <Pressable
            style={styles.laneButton}
            onPress={() => navigation.navigate('DMEncounterPrep', { campaignId: campaign.id })}
            android_ripple={{ color: colors.ripple }}
            testID='dmCampaignDetail.openEncounterPrepButton'
          >
            <Ionicons name='rocket-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('dm:campaignDetail.openEncounterPrep')}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

export default DMCampaignDetail;
