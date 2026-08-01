import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import useCharacterStore from '@/context/Character-store';
import { subscribeMySheets, subscribeSharedWithMe } from '@/repositories/characterCloudRepository';
import { fbAuth } from '@/services/firebase';
import type { DMCampaign } from '@/dm/domain/types';
import {
  deleteCampaign,
  ensureCampaignForName,
  renameCampaign,
  subscribeAccessibleCampaigns,
  updateCampaignSummary,
} from '@/dm/repositories/campaignRepository';
import { buildUnifiedPartyList, isCharacterInCampaign } from '@/screens/DM/adapters';
import { Modal } from '@/shared/components/Modal/Modal';
import { CampaignInviteError, redeemCampaignInvite } from '@/services/campaignInvite';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

const DMCampaigns: React.FC = () => {
  const { t } = useTranslation(['dm', 'common']);
  const navigation = useNavigation<StackNavigationProp<DMStackParamList, 'DMCampaigns'>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const localCharacters = useCharacterStore((s) => s.characters);
  const [mySheets, setMySheets] = useState<Record<string, unknown>[]>([]);
  const [sharedSheets, setSharedSheets] = useState<Record<string, unknown>[]>([]);
  const [campaigns, setCampaigns] = useState<DMCampaign[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSummary, setNewSummary] = useState('');

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const [isRedeemModalVisible, setIsRedeemModalVisible] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');

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

  const unifiedParty = useMemo(
    () => buildUnifiedPartyList(localCharacters, mySheets, sharedSheets),
    [localCharacters, mySheets, sharedSheets],
  );

  const memberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    campaigns.forEach((campaign) => {
      const count = unifiedParty.filter((item) => isCharacterInCampaign(item.payload, campaign)).length;
      counts.set(campaign.id, count);
    });
    return counts;
  }, [campaigns, unifiedParty]);

  const resetCreateForm = () => {
    setIsCreating(false);
    setNewName('');
    setNewSummary('');
  };

  const createCampaign = async () => {
    const cleanName = newName.trim();
    if (!cleanName) return;

    if (isDev) console.log('[DMCampaigns] createCampaign: pressed with name', cleanName);
    try {
      const created = await ensureCampaignForName(cleanName);
      if (isDev) console.log('[DMCampaigns] createCampaign: ensureCampaignForName returned', created?.id);
      if (created && newSummary.trim()) {
        await updateCampaignSummary(created.id, { summary: newSummary.trim() });
      }
    } catch (error) {
      if (isDev) console.error('[DMCampaigns] createCampaign FAILED:', error);
    }
    resetCreateForm();
  };

  const startRename = (campaign: DMCampaign) => {
    setRenamingId(campaign.id);
    setRenameInput(campaign.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameInput('');
  };

  const saveRename = async (campaignId: string) => {
    const cleanName = renameInput.trim();
    if (!cleanName) return;
    await renameCampaign(campaignId, cleanName);
    cancelRename();
  };

  const confirmDelete = (campaign: DMCampaign) => {
    Alert.alert(t('dm:campaignsList.deleteConfirmTitle'), t('dm:campaignsList.deleteConfirmMessage', { name: campaign.name }), [
      { text: t('dm:campaignsList.deleteConfirmCancel'), style: 'cancel' },
      {
        text: t('dm:campaignsList.deleteConfirmConfirm'),
        style: 'destructive',
        onPress: () => {
          void deleteCampaign(campaign.id);
        },
      },
    ]);
  };

  const openCampaign = (campaign: DMCampaign) => {
    navigation.navigate('DMCampaignDetail', { campaignId: campaign.id });
  };

  const mapRedeemErrorMessage = (code: string): string => {
    if (code === 'invite-expired') return t('dm:campaignsList.redeemErrors.expired');
    if (code === 'invite-exhausted') return t('dm:campaignsList.redeemErrors.exhausted');
    if (code === 'invite-not-found' || code === 'invite-campaign-missing') return t('dm:campaignsList.redeemErrors.notFound');
    return t('dm:campaignsList.redeemErrors.generic');
  };

  const openRedeemModal = () => {
    setRedeemCode('');
    setRedeemError('');
    setIsRedeemModalVisible(true);
  };

  const closeRedeemModal = () => setIsRedeemModalVisible(false);

  const submitRedeem = async () => {
    const cleanCode = redeemCode.trim().toUpperCase();
    if (!cleanCode) return;

    setIsRedeeming(true);
    setRedeemError('');
    try {
      await redeemCampaignInvite(cleanCode);
      setIsRedeeming(false);
      setIsRedeemModalVisible(false);
    } catch (err) {
      setIsRedeeming(false);
      setRedeemError(err instanceof CampaignInviteError ? mapRedeemErrorMessage(err.message) : t('dm:campaignsList.redeemErrors.generic'));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID='dmCampaigns.screen'>
      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:campaignsList.title')}</Text>
        <Text style={styles.hint}>{t('dm:campaignsList.hint')}</Text>

        {isCreating ? (
          <>
            <Text style={styles.modalLabel}>{t('dm:campaignsList.namePlaceholder')}</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder={t('dm:campaignsList.namePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
              testID='dmCampaigns.newNameInput'
            />
            <Text style={styles.modalLabel}>{t('dm:campaignsList.summaryPlaceholder')}</Text>
            <TextInput
              value={newSummary}
              onChangeText={setNewSummary}
              placeholder={t('dm:campaignsList.summaryPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
              testID='dmCampaigns.newSummaryInput'
            />
            <View style={styles.laneGrid}>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  void createCampaign();
                }}
                android_ripple={{ color: colors.ripple }}
                testID='dmCampaigns.createButton'
              >
                <Ionicons name='checkmark-outline' size={18} color={colors.text} />
                <Text style={styles.laneButtonText}>{t('dm:campaignsList.create')}</Text>
              </Pressable>
              <Pressable style={styles.laneButton} onPress={resetCreateForm} android_ripple={{ color: colors.ripple }}>
                <Ionicons name='close-outline' size={18} color={colors.text} />
                <Text style={styles.laneButtonText}>{t('dm:campaignsList.cancelCreate')}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Pressable
              style={styles.authButton}
              onPress={() => setIsCreating(true)}
              android_ripple={{ color: colors.ripple }}
              testID='dmCampaigns.newCampaignButton'
            >
              <Text style={styles.authButtonText}>{t('dm:campaignsList.newCampaignButton')}</Text>
            </Pressable>
            {/* Functional once createCampaignInvite/redeemCampaignInvite are deployed on
                a Blaze-plan Firebase project — disabled until then. */}
            <Pressable
              style={[styles.authButton, { opacity: 0.45 }]}
              disabled
              onPress={openRedeemModal}
              android_ripple={{ color: colors.ripple }}
              testID='dmCampaigns.redeemInviteButton'
            >
              <Text style={styles.authButtonText}>{t('dm:campaignsList.redeemInviteButton')}</Text>
            </Pressable>
            <Text style={styles.hint}>{t('dm:campaignsList.redeemInviteDisabledHint')}</Text>
          </>
        )}
      </View>

      {campaigns.map((campaign) => (
        <View key={campaign.id} style={styles.card} testID={`dmCampaigns.card.${campaign.id}`}>
          {renamingId === campaign.id ? (
            <>
              <Text style={styles.modalLabel}>{t('dm:campaignsList.renamePlaceholder')}</Text>
              <TextInput
                value={renameInput}
                onChangeText={setRenameInput}
                placeholder={t('dm:campaignsList.renamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={styles.modalInput}
                testID={`dmCampaigns.renameInput.${campaign.id}`}
              />
              <View style={styles.laneGrid}>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void saveRename(campaign.id);
                  }}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Ionicons name='checkmark-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:campaignsList.saveRename')}</Text>
                </Pressable>
                <Pressable style={styles.laneButton} onPress={cancelRename} android_ripple={{ color: colors.ripple }}>
                  <Ionicons name='close-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:campaignsList.cancelRename')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>{campaign.name}</Text>
              <Text style={styles.hint}>{campaign.summary || t('dm:campaignsList.noSummary')}</Text>
              <View style={styles.statsRow}>
                {typeof campaign.partyLevelEstimate === 'number' && (
                  <View style={styles.statChip}>
                    <Text style={styles.statChipText}>{t('dm:campaignsList.partyLevel', { level: campaign.partyLevelEstimate })}</Text>
                  </View>
                )}
                <View style={styles.statChip}>
                  <Text style={styles.statChipText}>{t('dm:campaignsList.members', { count: memberCounts.get(campaign.id) || 0 })}</Text>
                </View>
              </View>

              <View style={styles.laneGrid}>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => openCampaign(campaign)}
                  android_ripple={{ color: colors.ripple }}
                  testID={`dmCampaigns.open.${campaign.id}`}
                >
                  <Ionicons name='folder-open-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:campaignsList.open')}</Text>
                </Pressable>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => startRename(campaign)}
                  android_ripple={{ color: colors.ripple }}
                  testID={`dmCampaigns.rename.${campaign.id}`}
                >
                  <Ionicons name='create-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:campaignsList.rename')}</Text>
                </Pressable>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => confirmDelete(campaign)}
                  android_ripple={{ color: colors.ripple }}
                  testID={`dmCampaigns.delete.${campaign.id}`}
                >
                  <Ionicons name='trash-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:campaignsList.delete')}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      ))}

      {!campaigns.length && (
        <View style={styles.card}>
          <Text style={styles.hint}>{t('dm:campaignsList.empty')}</Text>
        </View>
      )}

      <Modal
        isVisible={isRedeemModalVisible}
        onClose={closeRedeemModal}
        onSubmit={() => {
          void submitRedeem();
        }}
        title={t('dm:campaignsList.redeemModalTitle')}
        subtitle={t('dm:campaignsList.redeemModalHint')}
      >
        <Text style={styles.modalLabel}>{t('dm:campaignsList.redeemCodePlaceholder')}</Text>
        <TextInput
          value={redeemCode}
          onChangeText={setRedeemCode}
          placeholder={t('dm:campaignsList.redeemCodePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize='characters'
          style={styles.modalInput}
          testID='dmCampaigns.redeemCodeInput'
        />
        {isRedeeming ? <ActivityIndicator color={colors.text} testID='dmCampaigns.redeemLoading' /> : null}
        {!!redeemError && <Text style={styles.hint}>{redeemError}</Text>}
      </Modal>
    </ScrollView>
  );
};

export default DMCampaigns;
