import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import useCharacterStore from '@/context/Character-store';
import useSyncStore from '@/context/Sync-store';
import useMonsterStore from '@/context/Monster-store';
import useSpellbookStore from '@/context/Spellbook-store';
import { subscribeMySheets, subscribeSharedWithMe } from '@/repositories/characterCloudRepository';
import { fbAuth } from '@/services/firebase';
import type { DMCampaign, DMCampaignEncounter } from '@/dm/domain/types';
import { addCampaignEditorByEmail, subscribeAccessibleCampaigns, updateCampaignSummary } from '@/dm/repositories/campaignRepository';
import { subscribeCampaignEncounters, upsertCampaignEncounter } from '@/dm/repositories/campaignEncountersRepository';
import { buildUnifiedPartyList, isCharacterInCampaign, type UnifiedPartyItem } from '@/screens/DM/adapters';
import { PinnedReferencesList } from '@/screens/DM/PinnedReferencesList';
import { Modal } from '@/shared/components/Modal/Modal';
import { createCampaignInvite } from '@/services/campaignInvite';
import { syncToCloud } from '@/services/characterSyncCoordinator';
import { trackProductEvent } from '@/shared/services/telemetry/productTelemetry';
import type { CharacterViewModel } from '@/types/Character';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

type Props = StackScreenProps<DMStackParamList, 'DMCampaignDetail'>;

const DMCampaignDetail: React.FC<Props> = ({ route, navigation }) => {
  const { campaignId } = route.params;
  const { i18n, t } = useTranslation(['dm', 'common']);
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const localCharacters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);
  const markLocalDraftPaths = useSyncStore((s) => s.markLocalDraftPaths);
  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const setCloudAvailability = useSyncStore((s) => s.setCloudAvailability);
  const markCloudUploaded = useSyncStore((s) => s.markCloudUploaded);
  const setSyncTransport = useSyncStore((s) => s.setSyncTransport);
  const markSyncError = useSyncStore((s) => s.markSyncError);
  const monsters = useMonsterStore((s) => s.monsters);
  const loadMonsters = useMonsterStore((s) => s.loadMonsters);
  const spells = useSpellbookStore((s) => s.spells);
  const loadSpellbook = useSpellbookStore((s) => s.loadSpellbook);

  const [mySheets, setMySheets] = useState<Record<string, unknown>[]>([]);
  const [sharedSheets, setSharedSheets] = useState<Record<string, unknown>[]>([]);
  const [campaigns, setCampaigns] = useState<DMCampaign[]>([]);

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [pendingMembershipId, setPendingMembershipId] = useState<string | null>(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryInput, setSummaryInput] = useState('');
  const [partyLevelInput, setPartyLevelInput] = useState('');
  const [encounters, setEncounters] = useState<DMCampaignEncounter[]>([]);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isEmailInviteModalVisible, setIsEmailInviteModalVisible] = useState(false);
  const [emailInviteInput, setEmailInviteInput] = useState('');
  const [isSubmittingEmailInvite, setIsSubmittingEmailInvite] = useState(false);
  const [emailInviteError, setEmailInviteError] = useState('');
  const [emailInviteSuccess, setEmailInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

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
    void loadMonsters();
    void loadSpellbook();
  }, [loadMonsters, loadSpellbook]);

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

  const campaignPinnedMonsters = useMemo(() => {
    const ids = campaign?.pinnedMonsterIds || [];
    return monsters.filter((monster) => ids.includes(monster.id));
  }, [campaign, monsters]);

  const campaignPinnedSpells = useMemo(() => {
    const ids = campaign?.pinnedSpellIds || [];
    return spells.filter((spell) => ids.includes(spell.id));
  }, [campaign, spells]);

  const openRootTab = (routeName: string, params?: Record<string, unknown>) => {
    const parent = navigation.getParent();
    if (!parent) return;
    parent.dispatch(CommonActions.navigate({ name: routeName, params }));
  };

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

  const myUid = fbAuth.currentUser?.uid || '';
  const isOwner = Boolean(campaign && campaign.owners.includes(myUid));

  const openInviteModal = async () => {
    if (!campaign) return;
    setInviteError('');
    setInviteCode(null);
    setIsInviteModalVisible(true);
    setIsCreatingInvite(true);
    try {
      const result = await createCampaignInvite(campaign.id);
      setInviteCode(result.code);
    } catch (err) {
      if (isDev) console.error('[DMCampaignDetail] createCampaignInvite FAILED (is it deployed on this Firebase project?):', err);
      // Cloud Functions error codes (e.g. raw "NOT_FOUND" when the function isn't
      // deployed yet) are not user-facing text — always show the generic copy here.
      setInviteError(t('dm:campaignDetail.inviteGenericError'));
    }
    setIsCreatingInvite(false);
  };

  const closeInviteModal = () => setIsInviteModalVisible(false);

  const shareInviteCode = () => {
    if (!inviteCode) return;
    void Share.share({ message: t('dm:campaignDetail.inviteShareMessage', { code: inviteCode }) });
  };

  const openEmailInviteModal = () => {
    setEmailInviteInput('');
    setEmailInviteError('');
    setEmailInviteSuccess('');
    setIsEmailInviteModalVisible(true);
  };

  const closeEmailInviteModal = () => setIsEmailInviteModalVisible(false);

  const submitEmailInvite = async () => {
    if (!campaign) return;
    const cleanEmail = emailInviteInput.trim();
    if (!cleanEmail) return;

    setIsSubmittingEmailInvite(true);
    setEmailInviteError('');
    setEmailInviteSuccess('');
    try {
      await addCampaignEditorByEmail(campaign.id, cleanEmail);
      trackProductEvent('campaign_editor_added');
      setEmailInviteSuccess(t('dm:campaignDetail.emailInviteSuccess'));
      setEmailInviteInput('');
    } catch (err) {
      if (isDev) console.error('[DMCampaignDetail] addCampaignEditorByEmail FAILED:', err);
      const message = err instanceof Error ? err.message : '';
      const key =
        message === 'User not found by email'
          ? 'dm:campaignDetail.emailInviteErrors.notFound'
          : message === 'Not signed in'
            ? 'dm:campaignDetail.emailInviteErrors.notSignedIn'
            : 'dm:campaignDetail.emailInviteErrors.generic';
      setEmailInviteError(t(key));
    }
    setIsSubmittingEmailInvite(false);
  };

  const ensureLocalCharacter = async (character: CharacterViewModel) => {
    const existing = useCharacterStore.getState().characters.find((item) => item.id === character.id);
    if (existing) {
      await updateCharacter(existing.id, character);
      return existing;
    }
    await addCharacter(character);
    return character;
  };

  // Pushes a campaign-assignment change to the character's cloud doc, mirroring
  // DMQuickEdit.tsx's commitPatch: mark the narrow draft path, then call syncToCloud
  // directly (not the debounced Character-screen effect, which never mounts for a
  // character opened from a DM screen). Without this, attach/detach only updated the
  // local store, and buildUnifiedPartyList lets the stale cloud copy win by id — the
  // character always looked unattached again on next render.
  const syncCampaignAssignment = async (next: CharacterViewModel) => {
    await markLocalDraftPaths(next.id, ['overview.campaign']);

    const isSignedIn = Boolean(fbAuth.currentUser);
    await ensureCharacterSync(next.id, isSignedIn);
    if (!isSignedIn) return;

    await syncToCloud({
      character: next,
      syncState: useSyncStore.getState().syncByCharacter[next.id],
      actorRole: 'DM',
      syncPort: { ensureCharacterSync, setCloudAvailability, markCloudUploaded, setSyncTransport, markSyncError },
      isOnline: true,
      historyPaths: ['overview.campaign'],
      conflictFallbackPath: 'overview.campaign',
    });
  };

  const attachCharacter = async (character: CharacterViewModel) => {
    if (!campaign) return;
    setPendingMembershipId(character.id);
    try {
      const local = await ensureLocalCharacter(character);
      const next = { ...local, campaignId: campaign.id };
      await updateCharacter(local.id, next);
      await syncCampaignAssignment(next);
    } finally {
      setPendingMembershipId(null);
    }
  };

  const detachCharacter = async (character: CharacterViewModel) => {
    setPendingMembershipId(character.id);
    try {
      const local = await ensureLocalCharacter(character);
      // Product decision (docs/campaign-management-prompts.md, C3): detach clears both
      // campaignId and the legacy free-text `campaign` field. Clearing only campaignId would
      // leave resolveCampaignForLink's legacy name match active (buildLegacyCampaignFallbackId),
      // so the character would immediately snap back into this same campaign on next read.
      const next = { ...local, campaignId: undefined, campaign: '' };
      await updateCharacter(local.id, next);
      await syncCampaignAssignment(next);
    } finally {
      setPendingMembershipId(null);
    }
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

        {isOwner && (
          <>
            {/* Code-based invite: functional once createCampaignInvite/redeemCampaignInvite
                are deployed on a Blaze-plan Firebase project — disabled until then. */}
            <Pressable
              style={[styles.authButton, { opacity: 0.45 }]}
              disabled
              onPress={() => {
                void openInviteModal();
              }}
              android_ripple={{ color: colors.ripple }}
              testID='dmCampaignDetail.inviteButton'
            >
              <Text style={styles.authButtonText}>{t('dm:campaignDetail.inviteButton')}</Text>
            </Pressable>
            <Text style={styles.hint}>{t('dm:campaignDetail.inviteCodeDisabledHint')}</Text>
            <Pressable
              style={styles.authButton}
              onPress={openEmailInviteModal}
              android_ripple={{ color: colors.ripple }}
              testID='dmCampaignDetail.emailInviteButton'
            >
              <Text style={styles.authButtonText}>{t('dm:campaignDetail.emailInviteButton')}</Text>
            </Pressable>
          </>
        )}

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
                  void openCharacter(item.payload);
                }}
                android_ripple={{ color: colors.ripple }}
                testID={`dmCampaignDetail.openCharacter.${item.id}`}
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
                testID={`dmCampaignDetail.quickEdit.${item.id}`}
              >
                <Ionicons name='create-outline' size={18} color={colors.text} />
                <Text style={styles.laneButtonText}>{t('dm:partyOverview.quickEdit')}</Text>
              </Pressable>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  void detachCharacter(item.payload);
                }}
                disabled={pendingMembershipId === item.id}
                android_ripple={{ color: colors.ripple }}
                testID={`dmCampaignDetail.detach.${item.id}`}
              >
                {pendingMembershipId === item.id ? (
                  <ActivityIndicator color={colors.text} testID={`dmCampaignDetail.detach.${item.id}.loading`} />
                ) : (
                  <>
                    <Ionicons name='remove-circle-outline' size={18} color={colors.text} />
                    <Text style={styles.laneButtonText}>{t('dm:campaignDetail.detach')}</Text>
                  </>
                )}
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
                    disabled={pendingMembershipId === item.id}
                    android_ripple={{ color: colors.ripple }}
                    testID={`dmCampaignDetail.attach.${item.id}`}
                  >
                    {pendingMembershipId === item.id ? (
                      <ActivityIndicator color={colors.text} testID={`dmCampaignDetail.attach.${item.id}.loading`} />
                    ) : (
                      <>
                        <Ionicons name='add-circle-outline' size={18} color={colors.text} />
                        <Text style={styles.laneButtonText}>{t('dm:campaignDetail.attach')}</Text>
                      </>
                    )}
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
        <Text style={styles.title}>{t('dm:campaignDetail.pinnedTitle')}</Text>
        <Text style={styles.hint}>{t('dm:campaignDetail.pinnedHint')}</Text>
        <PinnedReferencesList
          pinnedMonsters={campaignPinnedMonsters}
          pinnedSpells={campaignPinnedSpells}
          language={i18n.language}
          t={t}
          styles={styles}
        />
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
          <Pressable
            style={styles.laneButton}
            onPress={() => openRootTab('References', { screen: 'List', params: { campaignId: campaign.id } })}
            android_ripple={{ color: colors.ripple }}
            testID='dmCampaignDetail.openBestiaryButton'
          >
            <Ionicons name='skull-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('dm:campaignDetail.openBestiaryForCampaign')}</Text>
          </Pressable>
          <Pressable
            style={styles.laneButton}
            onPress={() => openRootTab('References', { screen: 'Spellbook', params: { mode: 'dm', campaignId: campaign.id } })}
            android_ripple={{ color: colors.ripple }}
            testID='dmCampaignDetail.openSpellbookButton'
          >
            <Ionicons name='book-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('dm:campaignDetail.openSpellbookForCampaign')}</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        isVisible={isInviteModalVisible}
        onClose={closeInviteModal}
        title={t('dm:campaignDetail.inviteModalTitle')}
        subtitle={t('dm:campaignDetail.inviteModalHint')}
      >
        {isCreatingInvite ? <ActivityIndicator color={colors.text} testID='dmCampaignDetail.inviteLoading' /> : null}
        {!!inviteCode && (
          <>
            <Text style={styles.title} testID='dmCampaignDetail.inviteCodeText'>
              {inviteCode}
            </Text>
            <Pressable
              style={styles.authButton}
              onPress={shareInviteCode}
              android_ripple={{ color: colors.ripple }}
              testID='dmCampaignDetail.shareInviteButton'
            >
              <Text style={styles.authButtonText}>{t('dm:campaignDetail.shareInvite')}</Text>
            </Pressable>
          </>
        )}
        {!!inviteError && <Text style={styles.hint}>{inviteError}</Text>}
      </Modal>

      <Modal
        isVisible={isEmailInviteModalVisible}
        onClose={closeEmailInviteModal}
        onSubmit={() => {
          void submitEmailInvite();
        }}
        title={t('dm:campaignDetail.emailInviteModalTitle')}
        subtitle={t('dm:campaignDetail.emailInviteModalHint')}
      >
        <Text style={styles.modalLabel}>{t('dm:campaignDetail.emailInvitePlaceholder')}</Text>
        <TextInput
          value={emailInviteInput}
          onChangeText={setEmailInviteInput}
          placeholder={t('dm:campaignDetail.emailInvitePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize='none'
          keyboardType='email-address'
          style={styles.modalInput}
          testID='dmCampaignDetail.emailInviteInput'
        />
        {isSubmittingEmailInvite ? <ActivityIndicator color={colors.text} testID='dmCampaignDetail.emailInviteLoading' /> : null}
        {!!emailInviteSuccess && <Text style={styles.hint}>{emailInviteSuccess}</Text>}
        {!!emailInviteError && <Text style={styles.hint}>{emailInviteError}</Text>}
      </Modal>
    </ScrollView>
  );
};

export default DMCampaignDetail;
