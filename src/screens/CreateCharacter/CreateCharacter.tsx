import React, { JSX, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNetInfo } from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
import { uuid } from 'expo-modules-core';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import useSyncStore from '@/context/Sync-store';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { addEditorByEmail } from '@/repositories/characterCloudRepository';
import { createCharacterDraftRepository } from '@/repositories/createCharacterDraftRepository';
import { fbAuth } from '@/services/firebase';
import { syncToCloud } from '@/services/characterSyncCoordinator';
import { BACKGROUNDS } from '@/shared/const/Backgrounds';
import { CLASS_OPTIONS, CLASS_TRANSLATIONS } from '@/shared/const/CharacterClass';
import { CLASS_GEAR } from '@/shared/const/ClassStartingGear';
import { CLASS_PRESETS } from '@/shared/const/ClassPresets';
import { CHARACTER_TEMPLATE_PRESETS } from '@/shared/const/CharacterTemplates';
import { RACES, RACE_OPTIONS, SUBRACE_OPTIONS, type AbilityKey } from '@/shared/const/Races';
import { SUBCLASSES } from '@/shared/const/Subclasses';
import { onGoogleButtonPress } from '@/shared/services/auth';
import FileService from '@/shared/services/fileSerice';
import { formatSchemaErrors, safeParseCreateCharacterWizardStep } from '@/domain/schemas';
import { getStyles } from '@/screens/CreateCharacter/style';
import {
  ABILITY_KEYS,
  ABILITY_NAMES_UA,
  ABILITY_SHORT,
  POINT_BUY_BUDGET,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  STANDARD_ARRAY,
  TOTAL_CREATE_CHARACTER_STEPS,
  applyDerivedDefaults,
  applyStartMethod,
  buildCharacterFromDraft,
  createInitialDraft,
  createSavingThrowDefaults,
  deriveDraftDefaults,
  formatAbilityModifier,
  mergeDraftWithDefaults,
  rollAbilityScore,
  rollAllAbilityScores,
  shouldShowMagicStep,
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

const STEP_TITLES: Record<number, string> = {
  1: 'Старт',
  2: 'Дані персонажа',
  3: 'Раса / Клас / Передісторія',
  4: 'Характеристики',
  5: 'Бойова база',
  6: 'Спорядження',
  7: 'Магія',
  8: 'Особистість',
  9: 'Хоумбрю',
  10: 'Збереження і доступ',
  11: 'Перевірка',
};

const START_OPTIONS: Array<{ id: StartMethod; title: string; description: string }> = [
  { id: 'standard-5e', title: 'Стандартний 5e', description: 'Повний покроковий персонаж за базовою логікою 5e.' },
  { id: 'quick', title: 'Швидкий персонаж', description: 'Швидкі дефолти для старту, все можна відредагувати.' },
  { id: 'homebrew-blank', title: 'Порожній хоумбрю', description: 'Порожні власні раса, клас, механіки і поля.' },
  { id: 'import', title: 'Імпорт', description: 'Імпорт JSON персонажа з файлу.' },
];

const STAT_METHOD_LABELS = {
  array: 'Стандартний масив',
  pointbuy: 'Купівля балів',
  manual: 'Вручну',
  roll: 'Куби',
  random: 'Випадково',
} as const;

const CreateCharacter = (): JSX.Element => {
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

  const isSignedIn = Boolean(fbAuth.currentUser);
  const derived = useMemo(() => deriveDraftDefaults(draft), [draft]);
  const step = draft.step;

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
      Alert.alert('Помилка', formatSchemaErrors(result.issues)[0] || 'Невалідні дані форми.');
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
    } catch (_error) { /* intentionally ignored */ }
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
      Alert.alert('Помилка', 'Не вдалося імпортувати персонажа.');
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
      Alert.alert('Потрібен вхід', 'Увійдіть через Google перед створенням хмарного персонажа.');
      return;
    }

    try {
      setIsCreating(true);
      const localId = uuid.v4();
      const character = buildCharacterFromDraft(draft, localId);
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
              shareError = error instanceof Error ? error.message : 'Не вдалося додати редактора.';
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

      let alertTitle = 'Готово';
      let alertMessage = 'Персонажа створено локально.';
      if (cloudRequested && cloudSaved && !shareError) {
        alertMessage = 'Персонажа створено і синхронізовано з хмарою.';
      } else if (cloudRequested && cloudSaved && shareError) {
        alertTitle = 'Частково готово';
        alertMessage = `Лист синхронізовано, але шерінг не виконано: ${shareError}`;
      } else if (cloudRequested) {
        alertTitle = 'Частково готово';
        alertMessage = 'Персонажа створено локально, але синхронізація з хмарою не спрацювала.';
      }

      Alert.alert(alertTitle, alertMessage, [
        {
          text: 'Ок',
          onPress: () => navigation.navigate('Character', { character: createdCharacter }),
        },
      ]);
    } catch {
      Alert.alert('Помилка', 'Не вдалося створити персонажа. Спробуйте ще раз.');
    } finally {
      setIsCreating(false);
    }
  };

  const footerLabel = step === TOTAL_CREATE_CHARACTER_STEPS ? (isCreating ? 'Створення...' : 'Створити персонажа') : 'Далі';
  const footerAction = step === TOTAL_CREATE_CHARACTER_STEPS ? onCreate : goNext;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Крок {step}/{TOTAL_CREATE_CHARACTER_STEPS}
        </Text>
        <Text style={styles.progressText}>{displayStartModeLabel()}</Text>
      </View>
      <Text style={styles.title}>{STEP_TITLES[step]}</Text>
      {hasRestoredDraft && (
        <View style={styles.draftBanner}>
          <Text style={styles.helperText}>Чернетку відновлено автоматично.</Text>
          <Pressable onPress={clearDraft} android_ripple={{ color: colors.ripple }} style={styles.inlineAction}>
            <Text style={styles.inlineActionText}>Очистити</Text>
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
        <Text style={styles.navButtonText}>Назад</Text>
      </Pressable>
      <Pressable
        style={[styles.navButton, styles.navButtonPrimary, isCreating ? styles.navButtonDisabled : null]}
        onPress={footerAction}
        disabled={isCreating}
        android_ripple={{ color: colors.ripple }}
        testID={step === TOTAL_CREATE_CHARACTER_STEPS ? 'createCharacter.submitButton' : 'createCharacter.nextButton'}
      >
        {isCreating ? <ActivityIndicator color={colors.background} /> : <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>{footerLabel}</Text>}
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
      <Text style={styles.sectionTitle}>Як створити персонажа?</Text>
      {START_OPTIONS.map((option) => (
        <Pressable
          key={option.id}
          style={[styles.methodCard, draft.startMethod === option.id ? styles.methodCardActive : null]}
          onPress={() => (option.id === 'import' ? onImport() : setDraft((prev) => applyStartMethod(prev, option.id)))}
          disabled={isImporting && option.id === 'import'}
          android_ripple={{ color: colors.ripple }}
          testID={`createCharacter.start.${option.id}`}
        >
          <Text style={styles.methodTitle}>{option.title}</Text>
          <Text style={styles.methodMeta}>{option.id === 'import' && isImporting ? 'Імпорт...' : option.description}</Text>
        </Pressable>
      ))}
    </View>
  );

  const renderIdentityStep = () => (
    <View style={styles.card}>
      <Text style={styles.label}>Ім’я</Text>
      <TextInput style={styles.input} value={draft.name} onChangeText={(value) => setTextField('name', value)} testID='createCharacter.nameInput' />

      <Text style={styles.label}>Рівень</Text>
      <TextInput style={styles.input} value={draft.level} onChangeText={(value) => setTextField('level', value)} keyboardType='numeric' />

      <Text style={styles.label}>Портрет</Text>
      <View style={styles.portraitRow}>
        {draft.photoUri ? <Image source={{ uri: draft.photoUri }} style={styles.portrait} /> : <View style={styles.portraitPlaceholder} />}
        <View style={styles.portraitActions}>
          <Pressable style={styles.smallButton} onPress={pickPortrait} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.smallButtonText}>{draft.photoUri ? 'Змінити' : 'Додати'}</Text>
          </Pressable>
          {draft.photoUri && (
            <Pressable style={styles.smallButton} onPress={() => updateDraft({ photoUri: undefined })} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.smallButtonText}>Прибрати</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Text style={styles.label}>Кампанія</Text>
      <TextInput style={styles.input} value={draft.campaign} onChangeText={(value) => setTextField('campaign', value)} />

      <Text style={styles.label}>Ім’я гравця</Text>
      <TextInput style={styles.input} value={draft.playerName} onChangeText={(value) => setTextField('playerName', value)} />

      <Text style={styles.label}>Нотатки</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.notes} onChangeText={(value) => setTextField('notes', value)} multiline />
    </View>
  );

  const renderRaceClassBackgroundStep = () => {
    const availableSubraces = draft.useCustomRace ? [] : SUBRACE_OPTIONS(draft.raceKey);
    const availableSubclasses = draft.selectedClass === 'custom' ? [] : SUBCLASSES[draft.selectedClass] || [];
    const backgroundDef = BACKGROUNDS.find((item) => item.key === draft.backgroundKey);

    return (
      <View style={styles.card}>
        <Text style={styles.label}>Раса</Text>
        <Picker
          selectedValue={draft.useCustomRace ? 'custom' : draft.raceKey}
          style={styles.picker}
          onValueChange={(value: string) => {
            if (value === 'custom') {
              updateDraft({ useCustomRace: true, customRace: draft.customRace || 'Власна раса' });
              return;
            }
            setDraft((prev) => applyDerivedDefaults({ ...prev, useCustomRace: false, raceKey: value, subraceKey: '', speed: '' }, { forceCombat: true }));
          }}
        >
          {RACE_OPTIONS.map((key) => (
            <Picker.Item key={key} label={RACES[key].name} value={key} />
          ))}
          <Picker.Item label='Власна раса...' value='custom' />
        </Picker>
        {draft.useCustomRace ? (
          <>
            <Text style={styles.label}>Власна раса</Text>
            <TextInput style={styles.input} value={draft.customRace} onChangeText={(value) => setTextField('customRace', value)} />
            <Text style={styles.label}>Власна підраса</Text>
            <TextInput style={styles.input} value={draft.customSubrace} onChangeText={(value) => setTextField('customSubrace', value)} />
          </>
        ) : (
          <>
            {!!availableSubraces.length && (
              <>
                <Text style={styles.label}>Підраса</Text>
                <Picker selectedValue={draft.subraceKey} style={styles.picker} onValueChange={(value: string) => updateDraft({ subraceKey: value })}>
                <Picker.Item label='Без підраси' value='' />
                  {availableSubraces.map((item) => (
                    <Picker.Item key={item} label={item} value={item} />
                  ))}
                </Picker>
              </>
            )}
          </>
        )}

        <Text style={styles.label}>Клас</Text>
        <Picker
          selectedValue={draft.selectedClass}
          style={styles.picker}
          onValueChange={(value: string) => {
            const spellcastingAbility = CLASS_PRESETS[value]?.spellcastingAbility as AbilityKey | undefined;
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
          {CLASS_OPTIONS.map((key) => (
            <Picker.Item key={key} label={CLASS_TRANSLATIONS[key] || key} value={key} />
          ))}
          <Picker.Item label='Власний клас...' value='custom' />
        </Picker>
        {draft.selectedClass === 'custom' ? (
          <>
            <Text style={styles.label}>Власний клас</Text>
            <TextInput style={styles.input} value={draft.customClassName} onChangeText={(value) => setTextField('customClassName', value)} />
            <Text style={styles.label}>Власний підклас</Text>
            <TextInput style={styles.input} value={draft.customSubclass} onChangeText={(value) => setTextField('customSubclass', value)} />
          </>
        ) : (
          <>
            {!!availableSubclasses.length && (
              <>
                <Text style={styles.label}>Підклас</Text>
                <Picker selectedValue={draft.subclass} style={styles.picker} onValueChange={(value: string) => updateDraft({ subclass: value })}>
                  <Picker.Item label='Ще не обрано' value='' />
                  {availableSubclasses.map((item) => (
                    <Picker.Item key={item} label={item} value={item} />
                  ))}
                </Picker>
              </>
            )}
          </>
        )}

        <Text style={styles.label}>Передісторія</Text>
        <Picker
          selectedValue={draft.backgroundKey}
          style={styles.picker}
          onValueChange={(value: string) => updateDraft({ backgroundKey: value })}
        >
          {BACKGROUNDS.map((item) => (
            <Picker.Item key={item.key} label={item.name} value={item.key} />
          ))}
          <Picker.Item label='Власна предісторія...' value='custom' />
        </Picker>
        {draft.backgroundKey === 'custom' ? (
          <>
            <Text style={styles.label}>Власна передісторія</Text>
            <TextInput style={styles.input} value={draft.customBackground} onChangeText={(value) => setTextField('customBackground', value)} />
          </>
        ) : (
          backgroundDef && (
            <View style={styles.infoBox}>
              <Text style={styles.sectionHint}>Навички: {backgroundDef.skills.join(', ')}</Text>
              {!!backgroundDef.tools?.length && <Text style={styles.sectionHint}>Інструменти: {backgroundDef.tools.join(', ')}</Text>}
              {!!backgroundDef.languages && <Text style={styles.sectionHint}>Мови: +{backgroundDef.languages}</Text>}
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
        {(['array', 'pointbuy', 'manual', 'roll', 'random'] as const).map((method) => (
          <Pressable
            key={method}
            style={[styles.toggleButton, draft.statMethod === method ? styles.toggleButtonActive : null]}
            onPress={() => selectStatMethod(method)}
            android_ripple={{ color: colors.ripple }}
            testID={`createCharacter.statMethod.${method}`}
          >
            <Text style={[styles.toggleButtonText, draft.statMethod === method ? styles.toggleButtonTextActive : null]}>{STAT_METHOD_LABELS[method]}</Text>
          </Pressable>
        ))}
      </View>

      {draft.statMethod === 'pointbuy' && (
        <Text style={derived.pointBuyValid ? styles.helperText : styles.warningText}>
          Купівля балів: {derived.pointBuySpent}/{POINT_BUY_BUDGET}
        </Text>
      )}
      {draft.statMethod === 'roll' && (
        <Text style={styles.helperText}>Для кожної характеристики киньте 4d6 через DiceRoller. Найменший куб відкидається, три інші додаються.</Text>
      )}
      {draft.statMethod === 'random' && (
        <View style={styles.infoBox}>
          <Text style={styles.sectionHint}>Випадковий набір генерує всі шість характеристик за правилом 4d6 з відкиданням найменшого куба.</Text>
          <Pressable style={styles.smallButton} onPress={generateRandomStats} android_ripple={{ color: colors.ripple }} testID='createCharacter.randomStatsButton'>
            <Text style={styles.smallButtonText}>Згенерувати заново</Text>
          </Pressable>
        </View>
      )}

      {ABILITY_KEYS.map((ability) => (
        <View key={ability} style={styles.statRow}>
          <View style={styles.statLabelBlock}>
            <Text style={styles.statLabel}>{ABILITY_NAMES_UA[ability]}</Text>
            <Text style={styles.helperText}>
              {derived.finalStats[ability]} ({formatAbilityModifier(derived.finalStats[ability])})
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
              <Pressable style={styles.smallButton} onPress={() => rollSingleStat(ability)} android_ripple={{ color: colors.ripple }} testID={`createCharacter.rollStat.${ability}`}>
                <Text style={styles.smallButtonText}>Кинути куби</Text>
              </Pressable>
            </View>
          ) : draft.statMethod === 'random' ? (
            <View style={styles.rollControl}>
              <Text style={styles.statValue}>{draft.rollStats[ability] || '—'}</Text>
              {!!draft.rollDetails[ability] && <Text style={styles.helperText}>{draft.rollDetails[ability]}</Text>}
            </View>
          ) : (
            <Text style={styles.statValue}>{STANDARD_ARRAY[ability]}</Text>
          )}
          {draft.statMethod === 'roll' && !!draft.rollDetails[ability] && <Text style={styles.helperText}>{draft.rollDetails[ability]}</Text>}
        </View>
      ))}
    </View>
  );

  const selectStatMethod = (method: CreateCharacterDraft['statMethod']): void => {
    if (method === 'random') {
      const result = rollAllAbilityScores();
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
      rollDetails: { ...draft.rollDetails, [ability]: result.detail },
    });
  };

  const generateRandomStats = (): void => {
    const result = rollAllAbilityScores();
    updateDraft({ statMethod: 'random', rollStats: result.stats, rollDetails: result.details });
  };

  const adjustPointBuy = (ability: AbilityKey, delta: number): void => {
    const current = draft.pointBuyStats[ability];
    updateDraft({ pointBuyStats: { ...draft.pointBuyStats, [ability]: Math.max(POINT_BUY_MIN, Math.min(POINT_BUY_MAX, current + delta)) } });
  };

  const renderCombatStep = () => (
    <View style={styles.card}>
      <View style={styles.infoBox}>
        <Text style={styles.sectionHint}>Рекомендоване здоров’я: {derived.defaultHp}</Text>
        <Text style={styles.sectionHint}>Рекомендовані кістки здоров’я: {derived.defaultHitDice}</Text>
        <Text style={styles.sectionHint}>Рекомендована швидкість: {derived.defaultSpeed}</Text>
        <Text style={styles.sectionHint}>Рекомендований бонус майстерності: +{derived.defaultProficiencyBonus}</Text>
      </View>

      <Text style={styles.label}>Максимум здоров’я</Text>
      <TextInput style={styles.input} value={draft.hpMax} onChangeText={(value) => setTextField('hpMax', value)} keyboardType='numeric' />
      <Text style={styles.label}>Поточне здоров’я</Text>
      <TextInput style={styles.input} value={draft.hpCurrent} onChangeText={(value) => setTextField('hpCurrent', value)} keyboardType='numeric' />
      <Text style={styles.label}>Кістки здоров’я</Text>
      <TextInput style={styles.input} value={draft.hitDice} onChangeText={(value) => setTextField('hitDice', value)} />
      <Text style={styles.label}>Клас броні</Text>
      <TextInput style={styles.input} value={draft.ac} onChangeText={(value) => setTextField('ac', value)} keyboardType='numeric' />
      <Text style={styles.label}>Швидкість</Text>
      <TextInput style={styles.input} value={draft.speed} onChangeText={(value) => setTextField('speed', value)} keyboardType='numeric' />
      <Text style={styles.label}>Ініціатива</Text>
      <TextInput style={styles.input} value={draft.initiative} onChangeText={(value) => setTextField('initiative', value)} keyboardType='numbers-and-punctuation' />
      <Text style={styles.label}>Бонус майстерності</Text>
      <TextInput style={styles.input} value={draft.proficiencyBonus} onChangeText={(value) => setTextField('proficiencyBonus', value)} keyboardType='numeric' />

      <Text style={styles.label}>Володіння рятівними кидками</Text>
      <View style={styles.chipsWrap}>
        {ABILITY_KEYS.map((ability) => (
          <Pressable
            key={ability}
            style={[styles.chip, draft.savingThrows[ability] ? styles.chipActive : null]}
            onPress={() => updateDraft({ savingThrows: { ...draft.savingThrows, [ability]: !draft.savingThrows[ability] } })}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={[styles.chipText, draft.savingThrows[ability] ? styles.chipTextActive : null]}>{ABILITY_SHORT[ability]}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={styles.smallButton}
        onPress={() => updateDraft({ savingThrows: createSavingThrowDefaults(draft.selectedClass) })}
        android_ripple={{ color: colors.ripple }}
      >
        <Text style={styles.smallButtonText}>Взяти з класу</Text>
      </Pressable>
    </View>
  );

  const renderEquipmentStep = () => {
    const gearDef = draft.selectedClass !== 'custom' ? CLASS_GEAR[draft.selectedClass] : undefined;
    return (
      <View style={styles.card}>
        {!!gearDef && (
          <>
            <Text style={styles.sectionTitle}>Стартовий набір</Text>
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
                <Text key={item} style={styles.sectionHint}>{item}</Text>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Зброя</Text>
        <TextInput style={[styles.input, styles.multilineInput]} value={draft.weaponsText} onChangeText={(value) => setTextField('weaponsText', value)} multiline />
        <Text style={styles.label}>Броня</Text>
        <TextInput style={styles.input} value={draft.armor} onChangeText={(value) => setTextField('armor', value)} />
        <Pressable style={[styles.toggleButton, draft.shield ? styles.toggleButtonActive : null]} onPress={() => updateDraft({ shield: !draft.shield })} android_ripple={{ color: colors.ripple }}>
          <Text style={[styles.toggleButtonText, draft.shield ? styles.toggleButtonTextActive : null]}>Щит</Text>
        </Pressable>
        <Text style={styles.label}>Інструменти</Text>
        <TextInput style={[styles.input, styles.multilineInput]} value={draft.toolsText} onChangeText={(value) => setTextField('toolsText', value)} multiline />
        <View style={styles.threeColumnRow}>
          <View style={styles.column}>
            <Text style={styles.label}>Золото</Text>
            <TextInput style={styles.input} value={draft.currencyGold} onChangeText={(value) => setTextField('currencyGold', value)} keyboardType='numeric' />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Срібло</Text>
            <TextInput style={styles.input} value={draft.currencySilver} onChangeText={(value) => setTextField('currencySilver', value)} keyboardType='numeric' />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Мідь</Text>
            <TextInput style={styles.input} value={draft.currencyCopper} onChangeText={(value) => setTextField('currencyCopper', value)} keyboardType='numeric' />
          </View>
        </View>
        <Text style={styles.label}>Додатковий стартовий набір</Text>
        <TextInput style={[styles.input, styles.multilineInput]} value={draft.startingPack} onChangeText={(value) => setTextField('startingPack', value)} multiline />
      </View>
    );
  };

  const renderMagicStep = () => (
    <View style={styles.card}>
      <Pressable style={[styles.toggleButton, draft.magicEnabled ? styles.toggleButtonActive : null]} onPress={() => updateDraft({ magicEnabled: !draft.magicEnabled })} android_ripple={{ color: colors.ripple }}>
        <Text style={[styles.toggleButtonText, draft.magicEnabled ? styles.toggleButtonTextActive : null]}>Магію увімкнено</Text>
      </Pressable>
      <Text style={styles.label}>Характеристика заклять</Text>
      <Picker selectedValue={draft.spellcastingAbility} style={styles.picker} onValueChange={(value: AbilityKey) => updateDraft({ spellcastingAbility: value, spellSaveDC: '', spellAttackBonus: '' })}>
        {ABILITY_KEYS.map((ability) => (
          <Picker.Item key={ability} label={ABILITY_NAMES_UA[ability]} value={ability} />
        ))}
      </Picker>
      <Text style={styles.label}>Складність рятівного кидка</Text>
      <TextInput style={styles.input} value={draft.spellSaveDC} onChangeText={(value) => setTextField('spellSaveDC', value)} keyboardType='numeric' />
      <Text style={styles.label}>Бонус атаки закляттям</Text>
      <TextInput style={styles.input} value={draft.spellAttackBonus} onChangeText={(value) => setTextField('spellAttackBonus', value)} keyboardType='numbers-and-punctuation' />
      <Text style={styles.label}>Замовляння</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.cantripsText} onChangeText={(value) => setTextField('cantripsText', value)} multiline />
      <Text style={styles.label}>Відомі закляття</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.knownSpellsText} onChangeText={(value) => setTextField('knownSpellsText', value)} multiline />
      <Text style={styles.label}>Підготовлені закляття</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.preparedSpellsText} onChangeText={(value) => setTextField('preparedSpellsText', value)} multiline />
      <Text style={styles.label}>Комірки заклять</Text>
      <TextInput style={styles.input} value={draft.spellSlotsText} onChangeText={(value) => setTextField('spellSlotsText', value)} placeholder='1:2, 2:1' placeholderTextColor={colors.textSecondary} />
    </View>
  );

  const renderPersonalityStep = () => (
    <View style={styles.card}>
      <Text style={styles.label}>Світогляд</Text>
      <TextInput style={styles.input} value={draft.alignment} onChangeText={(value) => setTextField('alignment', value)} />
      <Text style={styles.label}>Ідеали</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.ideals} onChangeText={(value) => setTextField('ideals', value)} multiline />
      <Text style={styles.label}>Прив’язаності</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.bonds} onChangeText={(value) => setTextField('bonds', value)} multiline />
      <Text style={styles.label}>Вади</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.flaws} onChangeText={(value) => setTextField('flaws', value)} multiline />
      <Text style={styles.label}>Передісторія</Text>
      <TextInput style={[styles.input, styles.largeInput]} value={draft.backstory} onChangeText={(value) => setTextField('backstory', value)} multiline />
    </View>
  );

  const renderHomebrewStep = () => (
    <View style={styles.card}>
      <Text style={styles.label}>Шаблон</Text>
      <Picker selectedValue={draft.characterTemplateId} style={styles.picker} onValueChange={(value) => updateDraft({ characterTemplateId: value })}>
        {CHARACTER_TEMPLATE_PRESETS.map((preset) => (
          <Picker.Item key={preset.id} label={displayTemplateTitle(preset.id)} value={preset.id} />
        ))}
      </Picker>
      <Text style={styles.label}>Власні поля</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.customFieldsText} onChangeText={(value) => setTextField('customFieldsText', value)} multiline />
      <Text style={styles.label}>Власні ресурси</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.customResourcesText} onChangeText={(value) => setTextField('customResourcesText', value)} multiline />
      <Text style={styles.label}>Власні секції</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.customSectionsText} onChangeText={(value) => setTextField('customSectionsText', value)} multiline />
      <Text style={styles.label}>Власні трекери</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.customTrackersText} onChangeText={(value) => setTextField('customTrackersText', value)} multiline />
      <Text style={styles.label}>Власні здібності</Text>
      <TextInput style={[styles.input, styles.multilineInput]} value={draft.customAbilitiesText} onChangeText={(value) => setTextField('customAbilitiesText', value)} multiline />
    </View>
  );

  const renderStorageStep = () => (
    <View style={styles.card}>
      <Text style={styles.sectionHint}>Локальне створення працює завжди. Хмарна синхронізація додає доступ між пристроями та шерінг електронною поштою.</Text>
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, draft.storageMode === 'local-only' ? styles.toggleButtonActive : null]}
          onPress={() => updateDraft({ storageMode: 'local-only', shareTarget: 'none', inviteEmail: '' })}
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={[styles.toggleButtonText, draft.storageMode === 'local-only' ? styles.toggleButtonTextActive : null]}>Тільки локально</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, draft.storageMode === 'local-cloud' ? styles.toggleButtonActive : null, !isOnline ? styles.navButtonDisabled : null]}
          onPress={() => {
            if (isOnline) updateDraft({ storageMode: 'local-cloud' });
          }}
          disabled={!isOnline}
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={[styles.toggleButtonText, draft.storageMode === 'local-cloud' ? styles.toggleButtonTextActive : null]}>Локально + Хмара</Text>
        </Pressable>
      </View>
      {!isOnline && <Text style={styles.warningText}>Офлайн: хмарне створення тимчасово недоступне.</Text>}
      {draft.storageMode === 'local-cloud' && !isSignedIn && (
        <Pressable style={styles.smallButton} onPress={onLogin} disabled={isSigningIn} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.smallButtonText}>{isSigningIn ? 'Вхід...' : 'Увійти через Google'}</Text>
        </Pressable>
      )}
      <Text style={styles.label}>Доступ</Text>
      <View style={styles.toggleRow}>
        {(['none', 'dm', 'player'] as const).map((target) => (
          <Pressable
            key={target}
            style={[styles.toggleButton, draft.shareTarget === target ? styles.toggleButtonActive : null, draft.storageMode === 'local-only' && target !== 'none' ? styles.navButtonDisabled : null]}
            onPress={() => {
              if (draft.storageMode === 'local-only' && target !== 'none') return;
              updateDraft({ shareTarget: target, inviteEmail: target === 'none' ? '' : draft.inviteEmail });
            }}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={[styles.toggleButtonText, draft.shareTarget === target ? styles.toggleButtonTextActive : null]}>{target === 'none' ? 'Ні' : target === 'dm' ? 'Майстер' : 'Гравець'}</Text>
          </Pressable>
        ))}
      </View>
      {draft.shareTarget !== 'none' && (
        <>
          <Text style={styles.label}>Електронна пошта для доступу</Text>
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
        {derived.resolvedRace || '—'} {displayClassName()} · Рівень {draft.level || '1'}
      </Text>
      <SummaryRow label='Здоров’я' value={draft.hpMax || String(derived.defaultHp)} />
      <SummaryRow label='КБ' value={draft.ac || '10'} />
      <SummaryRow label='СИЛ' value={formatAbilityModifier(derived.finalStats.strength)} />
      <SummaryRow label='ХАР' value={formatAbilityModifier(derived.finalStats.charisma)} />
      <SummaryRow label='Збереження' value={draft.storageMode === 'local-only' ? 'Локально' : 'Хмара'} />
      <SummaryRow label='Доступ' value={draft.shareTarget === 'none' ? 'Ні' : `${draft.shareTarget === 'dm' ? 'Майстер' : 'Гравець'} ${draft.inviteEmail.trim() || ''}`.trim()} />
      {derived.showMagic && <SummaryRow label='Складність заклять' value={draft.spellSaveDC || '—'} />}
    </View>
  );

  const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  const displayClassName = (): string => {
    if (draft.selectedClass === 'custom') return draft.customClassName.trim() || 'Власний клас';
    return CLASS_TRANSLATIONS[draft.selectedClass] || draft.selectedClass;
  };

  const displayStartModeLabel = (): string => {
    const option = START_OPTIONS.find((item) => item.id === draft.startMethod);
    if (option) return option.title;
    return displayTemplateTitle(draft.characterTemplateId);
  };

  const displayTemplateTitle = (templateId: string): string => {
    switch (templateId) {
      case 'standard-5e':
        return 'Стандартний 5e';
      case 'homebrew-light':
        return 'Легкий хоумбрю';
      case 'homebrew-heavy':
        return 'Розширений хоумбрю';
      case 'caster':
        return 'Заклинач';
      case 'martial':
        return 'Воїн';
      case 'custom-blank':
        return 'Порожній шаблон';
      default:
        return 'Створення персонажа';
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
      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.shell}>
          {renderHeader()}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps='handled'
            keyboardDismissMode='on-drag'
            testID='createCharacter.screen'
          >
            {renderStep()}
          </ScrollView>
          {renderFooter()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateCharacter;
