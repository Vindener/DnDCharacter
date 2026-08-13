import React, { JSX, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Picker } from '@react-native-picker/picker';
import { useNetInfo } from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
import { uuid } from 'expo-modules-core';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import useSyncStore from '@/context/Sync-store';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { addEditorByEmail } from '@/repositories/characterCloudRepository';
import { createCharacterDraftRepository } from '@/repositories/createCharacterDraftRepository';
import { ensureCampaignForName, subscribeAccessibleCampaigns } from '@/dm/repositories/campaignRepository';
import type { DMCampaign } from '@/dm/domain/types';
import { fbAuth } from '@/services/firebase';
import { syncToCloud } from '@/services/characterSyncCoordinator';
import { CHARACTER_TEMPLATE_PRESETS } from '@/shared/const/CharacterTemplates';
import { getSrdBackgroundById, getSrdBackgrounds, getSrdRaces, getSrdSubraces } from '@/domain/srd';
import type { SrdAbilityId as AbilityKey } from '@/domain/srd';
import { SUBCLASSES } from '@/shared/const/Subclasses';
import { onGoogleButtonPress } from '@/shared/services/auth';
import FileService from '@/shared/services/fileSerice';
import { formatSchemaErrors, safeParseCreateCharacterWizardStep } from '@/domain/schemas';
import { getStyles } from '@/screens/CreateCharacter/style';
import {
  ABILITY_KEYS,
  POINT_BUY_BUDGET,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  STANDARD_ARRAY_VALUES,
  TOTAL_CREATE_CHARACTER_STEPS,
  getCreateClassOptions,
  applyDerivedDefaults,
  applyStartMethod,
  buildCharacterFromDraft,
  createInitialDraft,
  createSavingThrowDefaults,
  deriveDraftDefaults,
  formatAbilityModifier,
  getCreateClassById,
  getCreateStartingEquipmentForClass,
  isStandardArrayValueTakenByOther,
  mergeDraftWithDefaults,
  rollAbilityScore,
  shouldShowMagicStep,
  type AbilityRollResult,
  type CreateCharacterDraft,
  type StartMethod,
} from '@/screens/CreateCharacter/createCharacterWizard';

type DraftTextField =
  | 'name'
  | 'level'
  | 'campaign'
  | 'playerName'
  | 'notes'
  | 'customRace'
  | 'customSubrace'
  | 'customClassName'
  | 'customSubclass'
  | 'customBackground'
  | 'hpMax'
  | 'hpCurrent'
  | 'hitDice'
  | 'ac'
  | 'speed'
  | 'initiative'
  | 'proficiencyBonus'
  | 'weaponsText'
  | 'armor'
  | 'toolsText'
  | 'currencyGold'
  | 'currencySilver'
  | 'currencyCopper'
  | 'startingPack'
  | 'spellSaveDC'
  | 'spellAttackBonus'
  | 'cantripsText'
  | 'knownSpellsText'
  | 'preparedSpellsText'
  | 'spellSlotsText'
  | 'alignment'
  | 'ideals'
  | 'bonds'
  | 'flaws'
  | 'backstory'
  | 'customFieldsText'
  | 'customResourcesText'
  | 'customSectionsText'
  | 'customTrackersText'
  | 'customAbilitiesText'
  | 'inviteEmail';

const START_OPTIONS: StartMethod[] = ['standard-5e', 'quick', 'homebrew-blank', 'import'];
const STAT_METHODS: CreateCharacterDraft['statMethod'][] = ['array', 'pointbuy', 'manual', 'roll', 'random'];

const CreateCharacter = (): JSX.Element => {
  const { t } = useTranslation(['createCharacter', 'dnd']);
  const navigation = useNavigation<StackNavigationProp<TabStackParamList, 'CreateCharacter'>>();
  const colors = useThemeStore((s) => s.colors);
  const styles = getStyles(colors);
  const netInfo = useNetInfo();
  const isOnline = netInfo.isConnected !== false && netInfo.isInternetReachable !== false;

  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);
  const setLastSessionCharacterId = useCharacterStore((s) => s.setLastSessionCharacterId);

  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const markCloudUploaded = useSyncStore((s) => s.markCloudUploaded);
  const removeCharacterSync = useSyncStore((s) => s.removeCharacterSync);
  const setCloudAvailability = useSyncStore((s) => s.setCloudAvailability);
  const setSyncTransport = useSyncStore((s) => s.setSyncTransport);
  const markSyncError = useSyncStore((s) => s.markSyncError);

  const [draft, setDraft] = useState<CreateCharacterDraft>(() => createInitialDraft());
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [, setAuthVersion] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [campaigns, setCampaigns] = useState<DMCampaign[]>([]);
  const [isAddingNewCampaign, setIsAddingNewCampaign] = useState(false);

  const isSignedIn = Boolean(fbAuth.currentUser);
  const derived = useMemo(() => deriveDraftDefaults(draft), [draft]);
  const step = draft.step;
  const selectedCampaignId = useMemo(
    () => campaigns.find((campaign) => campaign.name === draft.campaign)?.id || null,
    [campaigns, draft.campaign],
  );
  const showNewCampaignInput = isAddingNewCampaign || (Boolean(draft.campaign.trim()) && !selectedCampaignId);

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
    let mounted = true;
    void createCharacterDraftRepository.loadDraft().then((stored) => {
      if (!mounted) return;
      if (stored) {
        setDraft(mergeDraftWithDefaults(stored));
        setHasRestoredDraft(true);
      }
      setIsDraftLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isDraftLoaded) return;
    void createCharacterDraftRepository.saveDraft(draft);
  }, [draft, isDraftLoaded]);

  useEffect(() => {
    if (draft.storageMode === 'local-cloud' && !isOnline) {
      updateDraft({ storageMode: 'local-only', shareTarget: 'none', inviteEmail: '' });
    }
  }, [draft.storageMode, isOnline]);

  const updateDraft = (patch: Partial<CreateCharacterDraft>): void => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const setTextField = (field: DraftTextField, value: string): void => {
    updateDraft({ [field]: value } as Partial<CreateCharacterDraft>);
  };

  const setStep = (nextStep: number): void => {
    updateDraft({ step: Math.max(1, Math.min(TOTAL_CREATE_CHARACTER_STEPS, nextStep)) });
  };

  const buildValidationInput = (targetStep: number) => ({
    ...draft,
    step: targetStep,
    isCustomRace: draft.useCustomRace,
    level: draft.level,
    hpMax: draft.hpMax,
    hpCurrent: draft.hpCurrent,
    ac: draft.ac,
    speed: draft.speed,
    proficiencyBonus: draft.proficiencyBonus,
    isOnline,
  });

  const validateStep = (targetStep: number, showAlert = true): boolean => {
    const result = safeParseCreateCharacterWizardStep(buildValidationInput(targetStep), targetStep);
    if (result.ok) return true;
    if (showAlert) {
      Alert.alert(t('alerts.errorTitle'), formatSchemaErrors(result.issues)[0] || t('alerts.invalidForm'));
    }
    return false;
  };

  const nextStepFrom = (current: number): number => {
    if (current === 6 && !shouldShowMagicStep(draft)) return 8;
    return Math.min(TOTAL_CREATE_CHARACTER_STEPS, current + 1);
  };

  const previousStepFrom = (current: number): number => {
    if (current === 8 && !shouldShowMagicStep(draft)) return 6;
    return Math.max(1, current - 1);
  };

  const goNext = (): void => {
    if (!validateStep(step, true)) return;
    setStep(nextStepFrom(step));
  };

  const goBack = (): void => {
    setStep(previousStepFrom(step));
  };

  const pickPortrait = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      updateDraft({ photoUri: result.assets[0].uri });
    }
  };

  const clearDraft = async (): Promise<void> => {
    await createCharacterDraftRepository.clearDraft();
    setDraft(createInitialDraft());
    setHasRestoredDraft(false);
  };

  const onLogin = async (): Promise<void> => {
    try {
      setIsSigningIn(true);
      await onGoogleButtonPress();
      setAuthVersion((prev) => prev + 1);
    } catch (_error) {
      /* intentionally ignored */
    }
    setIsSigningIn(false);
  };

  const onImport = async (): Promise<void> => {
    if (isImporting) return;
    try {
      setIsImporting(true);
      const imported = await FileService.importCharacterFromFile();
      if (!imported) return;
      await addCharacter(imported);
      await ensureCharacterSync(imported.id, false);
      await setLastSessionCharacterId(imported.id);
      setCurrentCharacterId(imported.id);
      await createCharacterDraftRepository.clearDraft();
      navigation.navigate('Character', { character: imported });
    } catch {
      Alert.alert(t('alerts.errorTitle'), t('alerts.importFailed'));
    } finally {
      setIsImporting(false);
    }
  };

  const onCreate = async (): Promise<void> => {
    if (isCreating) return;

    const validationSteps = [2, 3, 4, 5, 10, 11];
    const invalidStep = validationSteps.find((item) => !validateStep(item, false));
    if (invalidStep) {
      setStep(invalidStep);
      validateStep(invalidStep, true);
      return;
    }

    const cloudRequested = draft.storageMode === 'local-cloud';
    if (cloudRequested && !isSignedIn) {
      setStep(10);
      Alert.alert(t('alerts.signInRequiredTitle'), t('alerts.signInRequiredMessage'));
      return;
    }

    try {
      setIsCreating(true);
      const localId = uuid.v4();
      const campaignName = draft.campaign.trim();
      const campaignRecord = campaignName ? await ensureCampaignForName(campaignName) : null;
      const draftWithCampaign = campaignRecord ? { ...draft, campaignId: campaignRecord.id } : draft;
      const character = buildCharacterFromDraft(draftWithCampaign, localId);
      await addCharacter(character);
      await ensureCharacterSync(character.id, cloudRequested);

      let createdCharacter = character;
      let targetSheetId = character.id;
      let cloudSaved = false;
      let shareError: string | null = null;

      if (cloudRequested) {
        try {
          const syncResult = await syncToCloud({
            character,
            syncState: useSyncStore.getState().syncByCharacter[character.id],
            actorRole: 'Player',
            isOnline,
            syncPort: {
              ensureCharacterSync,
              setCloudAvailability,
              markCloudUploaded,
              setSyncTransport,
              markSyncError,
            },
          });

          if (syncResult.status !== 'synced') {
            throw new Error(syncResult.message || 'Cloud sync failed');
          }

          if (syncResult.targetCharacter.id !== character.id) {
            createdCharacter = syncResult.targetCharacter;
            targetSheetId = createdCharacter.id;
            await updateCharacter(character.id, createdCharacter);
            await removeCharacterSync(character.id);
            await ensureCharacterSync(createdCharacter.id, true);
          }

          cloudSaved = true;

          const email = draft.inviteEmail.trim().toLowerCase();
          if (email && draft.shareTarget !== 'none') {
            try {
              await addEditorByEmail(targetSheetId, email);
            } catch (error) {
              shareError = error instanceof Error ? error.message : t('alerts.shareFailed');
            }
          }
        } catch {
          await setCloudAvailability(targetSheetId, false);
          cloudSaved = false;
        }
      }

      await setLastSessionCharacterId(createdCharacter.id);
      setCurrentCharacterId(createdCharacter.id);
      await createCharacterDraftRepository.clearDraft();

      let alertTitle = t('alerts.doneTitle');
      let alertMessage = t('alerts.createdLocal');
      if (cloudRequested && cloudSaved && !shareError) {
        alertMessage = t('alerts.createdCloud');
      } else if (cloudRequested && cloudSaved && shareError) {
        alertTitle = t('alerts.partialTitle');
        alertMessage = t('alerts.createdCloudShareFailed', { error: shareError });
      } else if (cloudRequested) {
        alertTitle = t('alerts.partialTitle');
        alertMessage = t('alerts.createdLocalCloudFailed');
      }

      Alert.alert(alertTitle, alertMessage, [
        {
          text: t('actions.ok'),
          onPress: () => navigation.navigate('Character', { character: createdCharacter }),
        },
      ]);
    } catch {
      Alert.alert(t('alerts.errorTitle'), t('alerts.createFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  const footerLabel =
    step === TOTAL_CREATE_CHARACTER_STEPS ? (isCreating ? t('actions.creating') : t('actions.create')) : t('actions.next');
  const footerAction = step === TOTAL_CREATE_CHARACTER_STEPS ? onCreate : goNext;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{t('progress', { step, total: TOTAL_CREATE_CHARACTER_STEPS })}</Text>
        <Text style={styles.progressText}>{displayStartModeLabel()}</Text>
      </View>
      <Text style={styles.title}>{t(`steps.${step}`)}</Text>
      {hasRestoredDraft && (
        <View style={styles.draftBanner}>
          <Text style={styles.helperText}>{t('draft.restored')}</Text>
          <Pressable onPress={clearDraft} android_ripple={{ color: colors.ripple }} style={styles.inlineAction}>
            <Text style={styles.inlineActionText}>{t('actions.clear')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Pressable
        style={[styles.navButton, step === 1 ? styles.navButtonDisabled : null]}
        onPress={goBack}
        disabled={step === 1 || isCreating}
        android_ripple={{ color: colors.ripple }}
        testID='createCharacter.backButton'
      >
        <Text style={styles.navButtonText}>{t('actions.back')}</Text>
      </Pressable>
      <Pressable
        style={[styles.navButton, styles.navButtonPrimary, isCreating ? styles.navButtonDisabled : null]}
        onPress={footerAction}
        disabled={isCreating}
        android_ripple={{ color: colors.ripple }}
        testID={step === TOTAL_CREATE_CHARACTER_STEPS ? 'createCharacter.submitButton' : 'createCharacter.nextButton'}
      >
        {isCreating ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>{footerLabel}</Text>
        )}
      </Pressable>
    </View>
  );

  const renderStep = () => {
    if (step === 1) return renderStartStep();
    if (step === 2) return renderIdentityStep();
    if (step === 3) return renderRaceClassBackgroundStep();
    if (step === 4) return renderStatsStep();
    if (step === 5) return renderCombatStep();
    if (step === 6) return renderEquipmentStep();
    if (step === 7) return renderMagicStep();
    if (step === 8) return renderPersonalityStep();
    if (step === 9) return renderHomebrewStep();
    if (step === 10) return renderStorageStep();
    return renderReviewStep();
  };

  const renderStartStep = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t('start.title')}</Text>
      {START_OPTIONS.map((option) => (
        <Pressable
          key={option}
          style={[styles.methodCard, draft.startMethod === option ? styles.methodCardActive : null]}
          onPress={() =>
            option === 'import' ? onImport() : setDraft((prev) => localizeStartMethodDefaults(applyStartMethod(prev, option), option))
          }
          disabled={isImporting && option === 'import'}
          android_ripple={{ color: colors.ripple }}
          testID={`createCharacter.start.${option}`}
        >
          <Text style={styles.methodTitle}>{t(`start.options.${option}.title`)}</Text>
          <Text style={styles.methodMeta}>
            {option === 'import' && isImporting ? t('actions.importing') : t(`start.options.${option}.description`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderIdentityStep = () => (
    <View style={styles.card}>
      <Text style={styles.label}>{t('identity.name')}</Text>
      <TextInput
        style={styles.input}
        value={draft.name}
        onChangeText={(value) => setTextField('name', value)}
        testID='createCharacter.nameInput'
      />

      <Text style={styles.label}>{t('identity.level')}</Text>
      <TextInput style={styles.input} value={draft.level} onChangeText={(value) => setTextField('level', value)} keyboardType='numeric' />

      <Text style={styles.label}>{t('identity.portrait')}</Text>
      <View style={styles.portraitRow}>
        {draft.photoUri ? <Image source={{ uri: draft.photoUri }} style={styles.portrait} /> : <View style={styles.portraitPlaceholder} />}
        <View style={styles.portraitActions}>
          <Pressable style={styles.smallButton} onPress={pickPortrait} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.smallButtonText}>{draft.photoUri ? t('actions.change') : t('actions.add')}</Text>
          </Pressable>
          {draft.photoUri && (
            <Pressable
              style={styles.smallButton}
              onPress={() => updateDraft({ photoUri: undefined })}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={styles.smallButtonText}>{t('actions.remove')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Text style={styles.label}>{t('identity.campaign')}</Text>
      <View style={styles.chipsWrap}>
        {campaigns.map((campaign) => {
          const active = campaign.id === selectedCampaignId;
          return (
            <Pressable
              key={campaign.id}
              style={[styles.chip, active ? styles.chipActive : null]}
              onPress={() => {
                setIsAddingNewCampaign(false);
                updateDraft({ campaign: campaign.name });
              }}
              android_ripple={{ color: colors.ripple }}
              testID={`createCharacter.campaignChip.${campaign.id}`}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{campaign.name}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[styles.chip, showNewCampaignInput ? styles.chipActive : null]}
          onPress={() => {
            setIsAddingNewCampaign(true);
            if (selectedCampaignId) updateDraft({ campaign: '' });
          }}
          android_ripple={{ color: colors.ripple }}
          testID='createCharacter.newCampaignChip'
        >
          <Text style={[styles.chipText, showNewCampaignInput ? styles.chipTextActive : null]}>{t('identity.newCampaignChip')}</Text>
        </Pressable>
      </View>
      {showNewCampaignInput && (
        <TextInput
          style={styles.input}
          value={draft.campaign}
          onChangeText={(value) => setTextField('campaign', value)}
          placeholder={t('identity.newCampaignPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          testID='createCharacter.newCampaignInput'
        />
      )}

      <Text style={styles.label}>{t('identity.playerName')}</Text>
      <TextInput style={styles.input} value={draft.playerName} onChangeText={(value) => setTextField('playerName', value)} />

      <Text style={styles.label}>{t('identity.notes')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.notes}
        onChangeText={(value) => setTextField('notes', value)}
        multiline
      />
    </View>
  );

  const renderRaceClassBackgroundStep = () => {
    const availableSubraces = draft.useCustomRace ? [] : getSrdSubraces(draft.raceKey);
    const availableSubclasses = draft.selectedClass === 'custom' ? [] : SUBCLASSES[draft.selectedClass] || [];
    const backgroundDef = getSrdBackgroundById(draft.backgroundKey);

    return (
      <View style={styles.card}>
        <Text style={styles.label}>{t('raceClass.race')}</Text>
        <Picker
          selectedValue={draft.useCustomRace ? 'custom' : draft.raceKey}
          style={styles.picker}
          onValueChange={(value: string) => {
            if (value === 'custom') {
              updateDraft({ useCustomRace: true, customRace: draft.customRace || t('defaults.customRace') });
              return;
            }
            setDraft((prev) =>
              applyDerivedDefaults({ ...prev, useCustomRace: false, raceKey: value, subraceKey: '', speed: '' }, { forceCombat: true }),
            );
          }}
        >
          {getSrdRaces().map((race) => (
            <Picker.Item key={race.id} label={t(`dnd:races.${race.id}`, { defaultValue: race.name })} value={race.id} />
          ))}
          <Picker.Item label={t('raceClass.customRaceOption')} value='custom' />
        </Picker>
        {draft.useCustomRace ? (
          <>
            <Text style={styles.label}>{t('raceClass.customRace')}</Text>
            <TextInput style={styles.input} value={draft.customRace} onChangeText={(value) => setTextField('customRace', value)} />
            <Text style={styles.label}>{t('raceClass.customSubrace')}</Text>
            <TextInput style={styles.input} value={draft.customSubrace} onChangeText={(value) => setTextField('customSubrace', value)} />
          </>
        ) : (
          <>
            {!!availableSubraces.length && (
              <>
                <Text style={styles.label}>{t('raceClass.subrace')}</Text>
                <Picker
                  selectedValue={draft.subraceKey}
                  style={styles.picker}
                  onValueChange={(value: string) => updateDraft({ subraceKey: value })}
                >
                  <Picker.Item label={t('raceClass.noSubrace')} value='' />
                  {availableSubraces.map((item) => (
                    <Picker.Item key={item.id} label={t(`dnd:subraces.${item.id}`, { defaultValue: item.name })} value={item.id} />
                  ))}
                </Picker>
              </>
            )}
          </>
        )}

        <Text style={styles.label}>{t('raceClass.class')}</Text>
        <Picker
          selectedValue={draft.selectedClass}
          style={styles.picker}
          onValueChange={(value: string) => {
            const spellcastingAbility = getCreateClassById(value)?.spellcastingAbility;
            setDraft((prev) =>
              applyDerivedDefaults(
                {
                  ...prev,
                  selectedClass: value,
                  subclass: '',
                  customSubclass: '',
                  customClassName: value === 'custom' ? prev.customClassName : '',
                  gearSelections: [],
                  magicEnabled: Boolean(spellcastingAbility) || prev.magicEnabled,
                  spellcastingAbility: spellcastingAbility || prev.spellcastingAbility,
                },
                { forceCombat: true, forceEquipment: true },
              ),
            );
          }}
        >
          {getCreateClassOptions().map((key) => (
            <Picker.Item
              key={key}
              label={
                key === 'artificer'
                  ? t('raceClass.homebrewClassLabel', { name: t('dnd:classes.artificer', { defaultValue: 'Artificer' }) })
                  : t(`dnd:classes.${key}`, { defaultValue: getCreateClassById(key)?.name || key })
              }
              value={key}
            />
          ))}
          <Picker.Item label={t('raceClass.customClassOption')} value='custom' />
        </Picker>
        {draft.selectedClass === 'custom' ? (
          <>
            <Text style={styles.label}>{t('raceClass.customClass')}</Text>
            <TextInput
              style={styles.input}
              value={draft.customClassName}
              onChangeText={(value) => setTextField('customClassName', value)}
            />
            <Text style={styles.label}>{t('raceClass.customSubclass')}</Text>
            <TextInput style={styles.input} value={draft.customSubclass} onChangeText={(value) => setTextField('customSubclass', value)} />
          </>
        ) : (
          <>
            {!!availableSubclasses.length && (
              <>
                <Text style={styles.label}>{t('raceClass.subclass')}</Text>
                <Picker
                  selectedValue={draft.subclass}
                  style={styles.picker}
                  onValueChange={(value: string) => updateDraft({ subclass: value })}
                >
                  <Picker.Item label={t('raceClass.noSubclass')} value='' />
                  {availableSubclasses.map((item) => (
                    <Picker.Item key={item} label={item} value={item} />
                  ))}
                </Picker>
              </>
            )}
          </>
        )}

        <Text style={styles.label}>{t('raceClass.background')}</Text>
        <Picker
          selectedValue={draft.backgroundKey}
          style={styles.picker}
          onValueChange={(value: string) => updateDraft({ backgroundKey: value })}
        >
          {getSrdBackgrounds().map((item) => (
            <Picker.Item key={item.id} label={t(`dnd:backgrounds.${item.id}`, { defaultValue: item.name })} value={item.id} />
          ))}
          <Picker.Item label={t('raceClass.customBackgroundOption')} value='custom' />
        </Picker>
        {draft.backgroundKey === 'custom' ? (
          <>
            <Text style={styles.label}>{t('raceClass.customBackground')}</Text>
            <TextInput
              style={styles.input}
              value={draft.customBackground}
              onChangeText={(value) => setTextField('customBackground', value)}
            />
          </>
        ) : (
          backgroundDef && (
            <View style={styles.infoBox}>
              <Text style={styles.sectionHint}>{t('raceClass.backgroundSkills', { value: backgroundDef.skills.join(', ') })}</Text>
              {!!backgroundDef.tools?.length && (
                <Text style={styles.sectionHint}>{t('raceClass.backgroundTools', { value: backgroundDef.tools.join(', ') })}</Text>
              )}
              {!!backgroundDef.languages && (
                <Text style={styles.sectionHint}>{t('raceClass.backgroundLanguages', { value: backgroundDef.languages })}</Text>
              )}
              <Text style={styles.sectionHint}>{derived.backgroundMechanics.featureText}</Text>
            </View>
          )
        )}
      </View>
    );
  };

  const renderStatsStep = () => (
    <View style={styles.card}>
      <View style={styles.toggleRow}>
        {STAT_METHODS.map((method) => (
          <Pressable
            key={method}
            style={[styles.toggleButton, draft.statMethod === method ? styles.toggleButtonActive : null]}
            onPress={() => selectStatMethod(method)}
            android_ripple={{ color: colors.ripple }}
            testID={`createCharacter.statMethod.${method}`}
          >
            <Text style={[styles.toggleButtonText, draft.statMethod === method ? styles.toggleButtonTextActive : null]}>
              {t(`stats.methods.${method}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {draft.statMethod === 'pointbuy' && (
        <Text style={derived.pointBuyValid ? styles.helperText : styles.warningText}>
          {t('stats.pointBuySpent', { spent: derived.pointBuySpent, budget: POINT_BUY_BUDGET })}
        </Text>
      )}
      {draft.statMethod === 'roll' && <Text style={styles.helperText}>{t('stats.rollHint')}</Text>}
      {draft.statMethod === 'random' && (
        <View style={styles.infoBox}>
          <Text style={styles.sectionHint}>{t('stats.randomHint')}</Text>
          <Pressable
            style={styles.smallButton}
            onPress={generateRandomStats}
            android_ripple={{ color: colors.ripple }}
            testID='createCharacter.randomStatsButton'
          >
            <Text style={styles.smallButtonText}>{t('stats.regenerate')}</Text>
          </Pressable>
        </View>
      )}

      {ABILITY_KEYS.map((ability) => (
        <View key={ability} style={styles.statRow}>
          <View style={styles.statLabelBlock}>
            <Text style={styles.statLabel}>{t(`dnd:abilities.${ability}`)}</Text>
            <Text style={styles.helperText}>
              {draft.statMethod === 'array' && !draft.stats[ability]
                ? '—'
                : `${derived.finalStats[ability]} (${formatAbilityModifier(derived.finalStats[ability])})`}
            </Text>
          </View>
          {draft.statMethod === 'pointbuy' ? (
            <View style={styles.stepper}>
              <Pressable style={styles.statControl} onPress={() => adjustPointBuy(ability, -1)} android_ripple={{ color: colors.ripple }}>
                <Text style={styles.statControlText}>-</Text>
              </Pressable>
              <Text style={styles.statValue}>{draft.pointBuyStats[ability]}</Text>
              <Pressable style={styles.statControl} onPress={() => adjustPointBuy(ability, 1)} android_ripple={{ color: colors.ripple }}>
                <Text style={styles.statControlText}>+</Text>
              </Pressable>
            </View>
          ) : draft.statMethod === 'manual' ? (
            <TextInput
              style={[styles.input, styles.statInput]}
              value={draft.manualStats[ability]}
              onChangeText={(value) => updateDraft({ manualStats: { ...draft.manualStats, [ability]: value } })}
              keyboardType='numeric'
            />
          ) : draft.statMethod === 'roll' ? (
            <View style={styles.rollControl}>
              <Text style={styles.statValue}>{draft.rollStats[ability] || '—'}</Text>
              <Pressable
                style={styles.smallButton}
                onPress={() => rollSingleStat(ability)}
                android_ripple={{ color: colors.ripple }}
                testID={`createCharacter.rollStat.${ability}`}
              >
                <Text style={styles.smallButtonText}>{t('stats.rollDice')}</Text>
              </Pressable>
            </View>
          ) : draft.statMethod === 'random' ? (
            <View style={styles.rollControl}>
              <Text style={styles.statValue}>{draft.rollStats[ability] || '—'}</Text>
              {!!draft.rollDetails[ability] && <Text style={styles.helperText}>{draft.rollDetails[ability]}</Text>}
            </View>
          ) : (
            <Text style={styles.statValue}>{draft.stats[ability] || '—'}</Text>
          )}
          {draft.statMethod === 'roll' && !!draft.rollDetails[ability] && (
            <Text style={styles.helperText}>{draft.rollDetails[ability]}</Text>
          )}
          {draft.statMethod === 'pointbuy' && draft.pointBuyStats[ability] >= POINT_BUY_MAX && (
            <Text style={[styles.helperText, styles.statRowFullWidthHint]}>{t('stats.pointBuyMaxHint')}</Text>
          )}
          {draft.statMethod === 'array' && (
            <View style={[styles.arrayChipRow, styles.statRowFullWidthHint]}>
              {STANDARD_ARRAY_VALUES.map((value) => {
                const taken = isStandardArrayValueTakenByOther(draft.stats, ability, value);
                const active = draft.stats[ability] === value;
                return (
                  <Pressable
                    key={value}
                    disabled={taken}
                    onPress={() => selectArrayValue(ability, value)}
                    style={[styles.arrayChip, active ? styles.arrayChipActive : null, taken ? styles.navButtonDisabled : null]}
                    android_ripple={{ color: colors.ripple }}
                    testID={`createCharacter.arrayValue.${ability}.${value}`}
                  >
                    <Text style={[styles.arrayChipText, active ? styles.arrayChipTextActive : null]}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const selectStatMethod = (method: CreateCharacterDraft['statMethod']): void => {
    if (method === 'random') {
      const result = rollLocalizedAbilityScores();
      updateDraft({ statMethod: method, rollStats: result.stats, rollDetails: result.details });
      return;
    }
    updateDraft({ statMethod: method });
  };

  const rollSingleStat = (ability: AbilityKey): void => {
    const result = rollAbilityScore();
    updateDraft({
      statMethod: 'roll',
      rollStats: { ...draft.rollStats, [ability]: String(result.total) },
      rollDetails: { ...draft.rollDetails, [ability]: formatRollDetail(result) },
    });
  };

  const generateRandomStats = (): void => {
    const result = rollLocalizedAbilityScores();
    updateDraft({ statMethod: 'random', rollStats: result.stats, rollDetails: result.details });
  };

  const selectArrayValue = (ability: AbilityKey, value: number): void => {
    if (isStandardArrayValueTakenByOther(draft.stats, ability, value)) return;
    const next = draft.stats[ability] === value ? 0 : value;
    updateDraft({ stats: { ...draft.stats, [ability]: next } });
  };

  const adjustPointBuy = (ability: AbilityKey, delta: number): void => {
    const current = draft.pointBuyStats[ability];
    updateDraft({
      pointBuyStats: { ...draft.pointBuyStats, [ability]: Math.max(POINT_BUY_MIN, Math.min(POINT_BUY_MAX, current + delta)) },
    });
  };

  const renderCombatStep = () => (
    <View style={styles.card}>
      <View style={styles.infoBox}>
        <Text style={styles.sectionHint}>{t('combat.recommendedHp', { value: derived.defaultHp })}</Text>
        <Text style={styles.sectionHint}>{t('combat.recommendedHitDice', { value: derived.defaultHitDice })}</Text>
        <Text style={styles.sectionHint}>{t('combat.recommendedSpeed', { value: derived.defaultSpeed })}</Text>
        <Text style={styles.sectionHint}>{t('combat.recommendedProficiency', { value: derived.defaultProficiencyBonus })}</Text>
      </View>

      <Text style={styles.label}>{t('combat.hpMax')}</Text>
      <TextInput style={styles.input} value={draft.hpMax} onChangeText={(value) => setTextField('hpMax', value)} keyboardType='numeric' />
      <Text style={styles.label}>{t('combat.hpCurrent')}</Text>
      <TextInput
        style={styles.input}
        value={draft.hpCurrent}
        onChangeText={(value) => setTextField('hpCurrent', value)}
        keyboardType='numeric'
      />
      <Text style={styles.label}>{t('combat.hitDice')}</Text>
      <TextInput style={styles.input} value={draft.hitDice} onChangeText={(value) => setTextField('hitDice', value)} />
      <Text style={styles.label}>{t('combat.armorClass')}</Text>
      <TextInput style={styles.input} value={draft.ac} onChangeText={(value) => setTextField('ac', value)} keyboardType='numeric' />
      <Text style={styles.label}>{t('combat.speed')}</Text>
      <TextInput style={styles.input} value={draft.speed} onChangeText={(value) => setTextField('speed', value)} keyboardType='numeric' />
      <Text style={styles.label}>{t('combat.initiative')}</Text>
      <TextInput
        style={styles.input}
        value={draft.initiative}
        onChangeText={(value) => setTextField('initiative', value)}
        keyboardType='numbers-and-punctuation'
      />
      <Text style={styles.label}>{t('combat.proficiencyBonus')}</Text>
      <TextInput
        style={styles.input}
        value={draft.proficiencyBonus}
        onChangeText={(value) => setTextField('proficiencyBonus', value)}
        keyboardType='numeric'
      />

      <Text style={styles.label}>{t('combat.savingThrowProficiencies')}</Text>
      <View style={styles.chipsWrap}>
        {ABILITY_KEYS.map((ability) => (
          <Pressable
            key={ability}
            style={[styles.chip, draft.savingThrows[ability] ? styles.chipActive : null]}
            onPress={() => updateDraft({ savingThrows: { ...draft.savingThrows, [ability]: !draft.savingThrows[ability] } })}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={[styles.chipText, draft.savingThrows[ability] ? styles.chipTextActive : null]}>
              {t(`dnd:abilityShort.${ability}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={[
          styles.toggleButton,
          ABILITY_KEYS.every((ability) => draft.savingThrows[ability] === createSavingThrowDefaults(draft.selectedClass)[ability])
            ? styles.toggleButtonActive
            : null,
        ]}
        onPress={() => updateDraft({ savingThrows: createSavingThrowDefaults(draft.selectedClass) })}
        android_ripple={{ color: colors.ripple }}
      >
        <Text
          style={[
            styles.toggleButtonText,
            ABILITY_KEYS.every((ability) => draft.savingThrows[ability] === createSavingThrowDefaults(draft.selectedClass)[ability])
              ? styles.toggleButtonTextActive
              : null,
          ]}
        >
          {t('combat.takeFromClass')}
        </Text>
      </Pressable>
    </View>
  );

  const renderEquipmentStep = () => {
    const gearDef = draft.selectedClass !== 'custom' ? getCreateStartingEquipmentForClass(draft.selectedClass) : undefined;
    return (
      <View style={styles.card}>
        {!!gearDef && (
          <>
            <Text style={styles.sectionTitle}>{t('equipment.startingGear')}</Text>
            {gearDef.choices.map((choice, index) => (
              <View key={choice.label}>
                <Text style={styles.label}>{choice.label}</Text>
                <Picker
                  selectedValue={draft.gearSelections[index] ?? 0}
                  style={styles.picker}
                  onValueChange={(value: number) => {
                    const next = [...draft.gearSelections];
                    next[index] = value;
                    setDraft((prev) => applyDerivedDefaults({ ...prev, gearSelections: next }, { forceEquipment: true }));
                  }}
                >
                  {choice.options.map((option, optionIndex) => (
                    <Picker.Item key={option} label={option} value={optionIndex} />
                  ))}
                </Picker>
              </View>
            ))}
            <View style={styles.infoBox}>
              {derived.selectedGear.map((item) => (
                <Text key={item} style={styles.sectionHint}>
                  {item}
                </Text>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>{t('equipment.weapons')}</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={draft.weaponsText}
          onChangeText={(value) => setTextField('weaponsText', value)}
          multiline
        />
        <Text style={styles.label}>{t('equipment.armor')}</Text>
        <TextInput style={styles.input} value={draft.armor} onChangeText={(value) => setTextField('armor', value)} />
        <Pressable
          style={[styles.toggleButton, draft.shield ? styles.toggleButtonActive : null]}
          onPress={() => updateDraft({ shield: !draft.shield })}
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={[styles.toggleButtonText, draft.shield ? styles.toggleButtonTextActive : null]}>{t('equipment.shield')}</Text>
        </Pressable>
        <Text style={styles.label}>{t('equipment.tools')}</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={draft.toolsText}
          onChangeText={(value) => setTextField('toolsText', value)}
          multiline
        />
        <View style={styles.threeColumnRow}>
          <View style={styles.column}>
            <Text style={styles.label}>{t('equipment.gold')}</Text>
            <TextInput
              style={styles.input}
              value={draft.currencyGold}
              onChangeText={(value) => setTextField('currencyGold', value)}
              keyboardType='numeric'
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>{t('equipment.silver')}</Text>
            <TextInput
              style={styles.input}
              value={draft.currencySilver}
              onChangeText={(value) => setTextField('currencySilver', value)}
              keyboardType='numeric'
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>{t('equipment.copper')}</Text>
            <TextInput
              style={styles.input}
              value={draft.currencyCopper}
              onChangeText={(value) => setTextField('currencyCopper', value)}
              keyboardType='numeric'
            />
          </View>
        </View>
        <Text style={styles.label}>{t('equipment.extraStartingPack')}</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={draft.startingPack}
          onChangeText={(value) => setTextField('startingPack', value)}
          multiline
        />
      </View>
    );
  };

  const renderMagicStep = () => (
    <View style={styles.card}>
      <Pressable
        style={[styles.toggleButton, draft.magicEnabled ? styles.toggleButtonActive : null]}
        onPress={() => updateDraft({ magicEnabled: !draft.magicEnabled })}
        android_ripple={{ color: colors.ripple }}
      >
        <Text style={[styles.toggleButtonText, draft.magicEnabled ? styles.toggleButtonTextActive : null]}>{t('magic.enabled')}</Text>
      </Pressable>
      <Text style={styles.label}>{t('magic.spellcastingAbility')}</Text>
      <Picker
        selectedValue={draft.spellcastingAbility}
        style={styles.picker}
        onValueChange={(value: AbilityKey) => updateDraft({ spellcastingAbility: value, spellSaveDC: '', spellAttackBonus: '' })}
      >
        {ABILITY_KEYS.map((ability) => (
          <Picker.Item key={ability} label={t(`dnd:abilities.${ability}`)} value={ability} />
        ))}
      </Picker>
      <Text style={styles.label}>{t('magic.spellSaveDC')}</Text>
      <TextInput
        style={styles.input}
        value={draft.spellSaveDC}
        onChangeText={(value) => setTextField('spellSaveDC', value)}
        keyboardType='numeric'
      />
      <Text style={styles.label}>{t('magic.spellAttackBonus')}</Text>
      <TextInput
        style={styles.input}
        value={draft.spellAttackBonus}
        onChangeText={(value) => setTextField('spellAttackBonus', value)}
        keyboardType='numbers-and-punctuation'
      />
      <Text style={styles.label}>{t('magic.cantrips')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.cantripsText}
        onChangeText={(value) => setTextField('cantripsText', value)}
        multiline
      />
      <Text style={styles.label}>{t('magic.knownSpells')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.knownSpellsText}
        onChangeText={(value) => setTextField('knownSpellsText', value)}
        multiline
      />
      <Text style={styles.label}>{t('magic.preparedSpells')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.preparedSpellsText}
        onChangeText={(value) => setTextField('preparedSpellsText', value)}
        multiline
      />
      <Text style={styles.label}>{t('magic.spellSlots')}</Text>
      <TextInput
        style={styles.input}
        value={draft.spellSlotsText}
        onChangeText={(value) => setTextField('spellSlotsText', value)}
        placeholder='1:2, 2:1'
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  );

  const renderPersonalityStep = () => (
    <View style={styles.card}>
      <Text style={styles.label}>{t('personality.alignment')}</Text>
      <TextInput style={styles.input} value={draft.alignment} onChangeText={(value) => setTextField('alignment', value)} />
      <Text style={styles.label}>{t('personality.ideals')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.ideals}
        onChangeText={(value) => setTextField('ideals', value)}
        multiline
      />
      <Text style={styles.label}>{t('personality.bonds')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.bonds}
        onChangeText={(value) => setTextField('bonds', value)}
        multiline
      />
      <Text style={styles.label}>{t('personality.flaws')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.flaws}
        onChangeText={(value) => setTextField('flaws', value)}
        multiline
      />
      <Text style={styles.label}>{t('personality.backstory')}</Text>
      <TextInput
        style={[styles.input, styles.largeInput]}
        value={draft.backstory}
        onChangeText={(value) => setTextField('backstory', value)}
        multiline
      />
    </View>
  );

  const renderHomebrewStep = () => (
    <View style={styles.card}>
      <Text style={styles.label}>{t('homebrew.template')}</Text>
      <Picker
        selectedValue={draft.characterTemplateId}
        style={styles.picker}
        onValueChange={(value) => updateDraft({ characterTemplateId: value })}
      >
        {CHARACTER_TEMPLATE_PRESETS.map((preset) => (
          <Picker.Item key={preset.id} label={displayTemplateTitle(preset.id)} value={preset.id} />
        ))}
      </Picker>
      <Text style={styles.label}>{t('homebrew.customFields')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.customFieldsText}
        onChangeText={(value) => setTextField('customFieldsText', value)}
        multiline
      />
      <Text style={styles.label}>{t('homebrew.customResources')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.customResourcesText}
        onChangeText={(value) => setTextField('customResourcesText', value)}
        multiline
      />
      <Text style={styles.label}>{t('homebrew.customSections')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.customSectionsText}
        onChangeText={(value) => setTextField('customSectionsText', value)}
        multiline
      />
      <Text style={styles.label}>{t('homebrew.customTrackers')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.customTrackersText}
        onChangeText={(value) => setTextField('customTrackersText', value)}
        multiline
      />
      <Text style={styles.label}>{t('homebrew.customAbilities')}</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={draft.customAbilitiesText}
        onChangeText={(value) => setTextField('customAbilitiesText', value)}
        multiline
      />
    </View>
  );

  const renderStorageStep = () => (
    <View style={styles.card}>
      <Text style={styles.sectionHint}>{t('storage.hint')}</Text>
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, draft.storageMode === 'local-only' ? styles.toggleButtonActive : null]}
          onPress={() => updateDraft({ storageMode: 'local-only', shareTarget: 'none', inviteEmail: '' })}
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={[styles.toggleButtonText, draft.storageMode === 'local-only' ? styles.toggleButtonTextActive : null]}>
            {t('storage.localOnly')}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleButton,
            draft.storageMode === 'local-cloud' ? styles.toggleButtonActive : null,
            !isOnline ? styles.navButtonDisabled : null,
          ]}
          onPress={() => {
            if (isOnline) updateDraft({ storageMode: 'local-cloud' });
          }}
          disabled={!isOnline}
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={[styles.toggleButtonText, draft.storageMode === 'local-cloud' ? styles.toggleButtonTextActive : null]}>
            {t('storage.localCloud')}
          </Text>
        </Pressable>
      </View>
      {!isOnline && <Text style={styles.warningText}>{t('storage.offline')}</Text>}
      {draft.storageMode === 'local-cloud' && !isSignedIn && (
        <Pressable style={styles.smallButton} onPress={onLogin} disabled={isSigningIn} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.smallButtonText}>{isSigningIn ? t('actions.signingIn') : t('storage.signInWithGoogle')}</Text>
        </Pressable>
      )}
      <Text style={styles.label}>{t('storage.access')}</Text>
      <View style={styles.toggleRow}>
        {(['none', 'dm', 'player'] as const).map((target) => (
          <Pressable
            key={target}
            style={[
              styles.toggleButton,
              draft.shareTarget === target ? styles.toggleButtonActive : null,
              draft.storageMode === 'local-only' && target !== 'none' ? styles.navButtonDisabled : null,
            ]}
            onPress={() => {
              if (draft.storageMode === 'local-only' && target !== 'none') return;
              updateDraft({ shareTarget: target, inviteEmail: target === 'none' ? '' : draft.inviteEmail });
            }}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={[styles.toggleButtonText, draft.shareTarget === target ? styles.toggleButtonTextActive : null]}>
              {t(`storage.shareTargets.${target}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      {draft.shareTarget !== 'none' && (
        <>
          <Text style={styles.label}>{t('storage.inviteEmail')}</Text>
          <TextInput
            style={styles.input}
            value={draft.inviteEmail}
            onChangeText={(value) => setTextField('inviteEmail', value)}
            keyboardType='email-address'
            autoCapitalize='none'
            placeholder='name@example.com'
            placeholderTextColor={colors.textSecondary}
          />
        </>
      )}
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.card} testID='createCharacter.review'>
      <Text style={styles.reviewName}>{draft.name.trim() || '—'}</Text>
      <Text style={styles.sectionHint}>
        {derived.resolvedRace || '—'} {displayClassName()} · {t('review.level', { level: draft.level || '1' })}
      </Text>
      <SummaryRow label={t('review.hp')} value={draft.hpMax || String(derived.defaultHp)} />
      <SummaryRow label={t('review.ac')} value={draft.ac || '10'} />
      <SummaryRow label={t('dnd:abilityShort.strength')} value={formatAbilityModifier(derived.finalStats.strength)} />
      <SummaryRow label={t('dnd:abilityShort.charisma')} value={formatAbilityModifier(derived.finalStats.charisma)} />
      <SummaryRow label={t('review.storage')} value={draft.storageMode === 'local-only' ? t('storage.local') : t('storage.cloud')} />
      <SummaryRow
        label={t('review.access')}
        value={
          draft.shareTarget === 'none'
            ? t('storage.shareTargets.none')
            : `${t(`storage.shareTargets.${draft.shareTarget}`)} ${draft.inviteEmail.trim() || ''}`.trim()
        }
      />
      {derived.showMagic && <SummaryRow label={t('review.spellSaveDC')} value={draft.spellSaveDC || '—'} />}
    </View>
  );

  const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  const localizeStartMethodDefaults = (nextDraft: CreateCharacterDraft, method: StartMethod): CreateCharacterDraft => {
    if (method !== 'homebrew-blank') return nextDraft;
    return {
      ...nextDraft,
      customRace: nextDraft.customRace || t('defaults.customRace'),
      customClassName: nextDraft.customClassName || t('defaults.customClass'),
      customBackground: nextDraft.customBackground || t('defaults.customBackground'),
    };
  };

  const formatRollDetail = (result: AbilityRollResult): string =>
    t('stats.rollDetail', {
      rolls: result.rolls.join(', '),
      kept: result.kept.join(' + '),
      dropped: result.dropped,
    });

  const rollLocalizedAbilityScores = (): {
    stats: Record<AbilityKey, string>;
    details: Record<AbilityKey, string>;
  } => {
    const stats = Object.fromEntries(ABILITY_KEYS.map((ability) => [ability, ''])) as Record<AbilityKey, string>;
    const details = Object.fromEntries(ABILITY_KEYS.map((ability) => [ability, ''])) as Record<AbilityKey, string>;
    ABILITY_KEYS.forEach((ability) => {
      const result = rollAbilityScore();
      stats[ability] = String(result.total);
      details[ability] = formatRollDetail(result);
    });
    return { stats, details };
  };

  const displayClassName = (): string => {
    if (draft.selectedClass === 'custom') return draft.customClassName.trim() || t('defaults.customClass');
    return t(`dnd:classes.${draft.selectedClass}`, { defaultValue: draft.selectedClass });
  };

  const displayStartModeLabel = (): string => {
    const option = START_OPTIONS.find((item) => item === draft.startMethod);
    if (option) return t(`start.options.${option}.title`);
    return displayTemplateTitle(draft.characterTemplateId);
  };

  const displayTemplateTitle = (templateId: string): string => {
    switch (templateId) {
      case 'standard-5e':
        return t('templates.standard-5e');
      case 'homebrew-light':
        return t('templates.homebrew-light');
      case 'homebrew-heavy':
        return t('templates.homebrew-heavy');
      case 'caster':
        return t('templates.caster');
      case 'martial':
        return t('templates.martial');
      case 'custom-blank':
        return t('templates.custom-blank');
      default:
        return t('templates.default');
    }
  };

  if (!isDraftLoaded) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        {renderHeader()}
        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps='handled'
          keyboardDismissMode='on-drag'
          bottomOffset={16}
          testID='createCharacter.screen'
        >
          {renderStep()}
        </KeyboardAwareScrollView>
        {renderFooter()}
      </View>
    </SafeAreaView>
  );
};

export default CreateCharacter;
