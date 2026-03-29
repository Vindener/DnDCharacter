import React, { JSX, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Alert, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { uuid } from 'expo-modules-core';
import { getStyles } from '@/screens/CreateCharacter/style';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import useSyncStore from '@/context/Sync-store';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import { CLASS_OPTIONS, CLASS_TRANSLATIONS } from '@/shared/const/CharacterClass';
import { SUBCLASSES } from '@/shared/const/Subclasses';
import { RACES, RACE_OPTIONS, SUBRACE_OPTIONS, AbilityKey, RaceDefinition } from '@/shared/const/Races';
import { CLASS_PRESETS } from '@/shared/const/ClassPresets';
import { BACKGROUNDS } from '@/shared/const/Backgrounds';
import { SUBCLASS_DETAILS } from '@/shared/const/SubclassDetails';
import { CLASS_GEAR } from '@/shared/const/ClassStartingGear';
import type { CharacterDto, CharacterTemplateId } from '@/types/Character';
import skillToStat, { AbilityStatsKey, SkillKey } from '@/types/skillToStat';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { fbAuth } from '@/services/firebase';
import { onGoogleButtonPress } from '@/shared/services/auth';
import { addEditorByEmail, upsertCharacterSheetFromLocal } from '@/services/characterSheets';
import { buildTemplatePatch, CHARACTER_TEMPLATE_PRESETS } from '@/shared/const/CharacterTemplates';

type StartMethod = 'guided' | 'quick';
type StatMethod = 'array' | 'pointbuy';
type StorageMode = 'local-only' | 'local-cloud';

const TOTAL_STEPS = 7;
const ABILITY_KEYS: AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const STANDARD_ARRAY: Record<AbilityKey, number> = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8,
};

const POINT_BUY_MIN = 8;
const POINT_BUY_MAX = 15;
const POINT_BUY_BUDGET = 27;

const COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

const ABILITY_NAMES_UA: Record<AbilityKey, string> = {
  strength: 'Сила',
  dexterity: 'Спритність',
  constitution: 'Статура',
  intelligence: 'Інтелект',
  wisdom: 'Мудрість',
  charisma: 'Харизма',
};

const BG_COINS: Record<string, number> = {
  acolyte: 15,
  criminal: 15,
  soldier: 10,
  entertainer: 15,
  folkhero: 10,
  guildartisan: 15,
  hermit: 5,
  noble: 25,
  outlander: 10,
  sage: 10,
  sailor: 10,
  urchin: 10,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function autoFillSkills(stats: CharacterDto['stats']): CharacterDto['skills'] {
  const base: CharacterDto['skills'] = {
    acrobatics: 0,
    animalHandling: 0,
    arcana: 0,
    athletics: 0,
    deception: 0,
    history: 0,
    insight: 0,
    intimidation: 0,
    investigation: 0,
    medicine: 0,
    nature: 0,
    perception: 0,
    performance: 0,
    persuasion: 0,
    religion: 0,
    sleightOfHand: 0,
    stealth: 0,
    survival: 0,
  };

  (Object.entries(skillToStat) as [SkillKey, AbilityStatsKey][]).forEach(([skill, ability]) => {
    base[skill] = abilityModifier(stats[ability]);
  });

  return base;
}

const CreateCharacter = (): JSX.Element => {
  const navigation = useNavigation<StackNavigationProp<TabStackParamList, 'CreateCharacter'>>();
  const c = useThemeStore((s) => s.colors);
  const styles = getStyles(c);

  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);

  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const markCloudUploaded = useSyncStore((s) => s.markCloudUploaded);
  const removeCharacterSync = useSyncStore((s) => s.removeCharacterSync);
  const setCloudAvailability = useSyncStore((s) => s.setCloudAvailability);

  const [step, setStep] = useState<number>(1);
  const [startMethod, setStartMethod] = useState<StartMethod>('guided');
  const [characterTemplateId, setCharacterTemplateId] = useState<CharacterTemplateId>('standard-5e');

  const [name, setName] = useState('');
  const [level, setLevel] = useState('1');

  const [raceKey, setRaceKey] = useState<string>(RACE_OPTIONS[0]);
  const [subraceKey, setSubraceKey] = useState<string>('');
  const [customRace, setCustomRace] = useState<string>('');
  const [customSubrace, setCustomSubrace] = useState<string>('');
  const [useCustomRace, setUseCustomRace] = useState<boolean>(false);

  const [selectedClass, setSelectedClass] = useState(CLASS_OPTIONS[0]);
  const [customClassName, setCustomClassName] = useState('');
  const [subclass, setSubclass] = useState<string>('');
  const [customSubclass, setCustomSubclass] = useState<string>('');

  const gearDef = selectedClass !== 'custom' ? CLASS_GEAR[selectedClass] : undefined;
  const [gearSelections, setGearSelections] = useState<number[]>([]);

  const [backgroundKey, setBackgroundKey] = useState<string>(BACKGROUNDS[0]?.key || 'custom');
  const [customBackground, setCustomBackground] = useState<string>('');

  const [statMethod, setStatMethod] = useState<StatMethod>('array');
  const [stats, setStats] = useState<Record<AbilityKey, number>>({ ...STANDARD_ARRAY });
  const [pbStats, setPbStats] = useState<Record<AbilityKey, number>>({
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8,
  });

  const [flexPick1, setFlexPick1] = useState<AbilityKey>('strength');
  const [flexPick2, setFlexPick2] = useState<AbilityKey>('dexterity');

  const [storageMode, setStorageMode] = useState<StorageMode>('local-only');
  const [inviteEmail, setInviteEmail] = useState('');
  const [authVersion, setAuthVersion] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const isSignedIn = useMemo(() => Boolean(fbAuth.currentUser), [authVersion]);

  useEffect(() => {
    if (!gearDef) return;
    setGearSelections((prev) => {
      if (prev.length === gearDef.choices.length) return prev;
      return gearDef.choices.map((_, i) => prev[i] ?? 0);
    });
  }, [gearDef]);

  useEffect(() => {
    if (selectedClass === 'custom') setGearSelections([]);
  }, [selectedClass]);

  useEffect(() => {
    if (startMethod === 'quick') {
      setStatMethod('array');
      setStats({ ...STANDARD_ARRAY });
    }
  }, [startMethod]);

  const isCustomRace = useCustomRace;
  const raceDef: RaceDefinition | undefined = !isCustomRace ? RACES[raceKey] : undefined;
  const subraceDef = !isCustomRace && subraceKey ? raceDef?.subraces?.[subraceKey] : undefined;
  const availableSubclasses = selectedClass === 'custom' ? [] : SUBCLASSES[selectedClass] || [];

  const localizedClassName = useMemo(() => {
    if (selectedClass === 'custom') return customClassName || 'Custom';
    return CLASS_TRANSLATIONS[selectedClass] || selectedClass;
  }, [selectedClass, customClassName]);

  const classPreset = selectedClass === 'custom' ? undefined : CLASS_PRESETS[selectedClass];
  const subDesc = subclass && selectedClass !== 'custom' ? SUBCLASS_DETAILS[selectedClass]?.[subclass] : undefined;

  const baseStats = useMemo(() => (statMethod === 'array' ? stats : pbStats), [stats, pbStats, statMethod]);

  const racialBonus = useMemo(() => {
    const bonus: Record<AbilityKey, number> = {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    };

    ABILITY_KEYS.forEach((ability) => {
      const raceValue = raceDef?.asi?.[ability];
      const subraceValue = subraceDef?.asi?.[ability];
      if (typeof raceValue === 'number') bonus[ability] += raceValue;
      if (typeof subraceValue === 'number') bonus[ability] += subraceValue;
    });

    const flex = subraceDef?.flexible || raceDef?.flexible;
    if (flex?.count === 2) {
      const excluded = new Set(flex.exclude || []);
      if (!excluded.has(flexPick1)) bonus[flexPick1] += 1;
      if (flexPick2 !== flexPick1 && !excluded.has(flexPick2)) bonus[flexPick2] += 1;
    }

    return bonus;
  }, [raceDef, subraceDef, flexPick1, flexPick2]);

  const finalStats = useMemo(() => {
    const result: Record<AbilityKey, number> = {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    };
    ABILITY_KEYS.forEach((ability) => {
      result[ability] = baseStats[ability] + racialBonus[ability];
    });
    return result;
  }, [baseStats, racialBonus]);

  const pointBuySpent = useMemo(() => (Object.values(pbStats) as number[]).reduce((sum, v) => sum + COST[v], 0), [pbStats]);
  const pointBuyValid = pointBuySpent <= POINT_BUY_BUDGET;

  const finalCoins = useMemo(() => {
    const gp = BG_COINS[backgroundKey] || 0;
    return { gold: gp, silver: 0, copper: 0 };
  }, [backgroundKey]);

  const chosenInventory: string[] = useMemo(() => {
    if (selectedClass === 'custom') return ['Проста зброя', 'Рюкзак мандрівника'];
    if (!gearDef) return [];
    const picks = gearDef.choices.map((choice, index) => choice.options[gearSelections[index] ?? 0] || choice.options[0]);
    return [...gearDef.base, ...picks];
  }, [selectedClass, gearDef, gearSelections]);

  const backgroundDef = BACKGROUNDS.find((b) => b.key === backgroundKey);
  const resolvedBackground = backgroundKey === 'custom' ? customBackground.trim() : backgroundDef?.name || backgroundKey;
  const resolvedRace = isCustomRace ? customRace.trim() : raceDef?.name || raceKey;
  const resolvedSubrace = isCustomRace ? customSubrace.trim() || undefined : subraceKey || undefined;
  const resolvedSubclass = selectedClass === 'custom' ? customSubclass.trim() || undefined : subclass || undefined;
  const resolvedClassName = selectedClass === 'custom' ? customClassName.trim() : selectedClass;

  const validateStep2 = (showAlert: boolean = true): boolean => {
    if (!name.trim()) {
      if (showAlert) Alert.alert('Помилка', 'Введіть ім’я персонажа.');
      return false;
    }

    const lvl = Number(level);
    if (!Number.isFinite(lvl) || lvl < 1 || lvl > 20) {
      if (showAlert) Alert.alert('Помилка', 'Рівень має бути від 1 до 20.');
      return false;
    }

    if (isCustomRace && !customRace.trim()) {
      if (showAlert) Alert.alert('Помилка', 'Для власної раси вкажіть назву.');
      return false;
    }

    return true;
  };

  const validateStep3 = (showAlert: boolean = true): boolean => {
    if (selectedClass === 'custom' && !customClassName.trim()) {
      if (showAlert) Alert.alert('Помилка', 'Для власного класу введіть назву.');
      return false;
    }
    return true;
  };

  const validateStep5 = (showAlert: boolean = true): boolean => {
    if (backgroundKey === 'custom' && !customBackground.trim()) {
      if (showAlert) Alert.alert('Помилка', 'Для власної предісторії введіть назву.');
      return false;
    }
    return true;
  };

  const validateStep6 = (showAlert: boolean = true): boolean => {
    const email = inviteEmail.trim();
    if (!email) return true;
    if (!EMAIL_REGEX.test(email)) {
      if (showAlert) Alert.alert('Помилка', 'Email для шерінгу має некоректний формат.');
      return false;
    }
    if (storageMode === 'local-only') {
      if (showAlert) Alert.alert('Помилка', 'Шерінг доступний тільки у режимі Local + Cloud.');
      return false;
    }
    return true;
  };

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return 'Крок 1. Start Method';
      case 2:
        return 'Крок 2. Basics';
      case 3:
        return 'Крок 3. Class';
      case 4:
        return 'Крок 4. Stats';
      case 5:
        return 'Крок 5. Background & Gear';
      case 6:
        return 'Крок 6. Storage & Share';
      case 7:
        return 'Крок 7. Review';
      default:
        return 'Create Character';
    }
  }, [step]);

  const reviewHints = useMemo(() => {
    const lines: string[] = [];
    if (storageMode === 'local-only') {
      lines.push('Лист збережеться локально на пристрої.');
      lines.push('Cloud-sync можна підключити пізніше з меню персонажа.');
    } else if (isSignedIn) {
      lines.push('Лист буде збережено локально і в cloud.');
      lines.push('Sync-статус стане visible на Home/Character після створення.');
      if (inviteEmail.trim()) lines.push(`Після cloud save буде надіслано доступ редактору: ${inviteEmail.trim()}`);
    } else {
      lines.push('Обрано Local + Cloud, але ви ще не авторизовані.');
      lines.push('Увійдіть через Google на кроці Storage, інакше лист залишиться лише локально.');
    }
    return lines;
  }, [storageMode, isSignedIn, inviteEmail]);

  const goNextFromStep = (): void => {
    if (step === 2 && !validateStep2(true)) return;
    if (step === 3 && !validateStep3(true)) return;
    if (step === 4 && statMethod === 'pointbuy' && !pointBuyValid) {
      Alert.alert('Помилка', 'Point Buy перевищує ліміт 27.');
      return;
    }
    if (step === 5 && !validateStep5(true)) return;
    if (step === 6 && !validateStep6(true)) return;
    if (step < TOTAL_STEPS) setStep((prev) => prev + 1);
  };

  const onLogin = async () => {
    try {
      setIsSigningIn(true);
      await onGoogleButtonPress();
      setAuthVersion((prev) => prev + 1);
    } catch {}
    setIsSigningIn(false);
  };

  const onCreate = async () => {
    if (isCreating) return;

    if (!validateStep2(true)) {
      setStep(2);
      return;
    }
    if (!validateStep3(true)) {
      setStep(3);
      return;
    }
    if (statMethod === 'pointbuy' && !pointBuyValid) {
      setStep(4);
      Alert.alert('Помилка', 'Point Buy перевищує ліміт 27.');
      return;
    }
    if (!validateStep5(true)) {
      setStep(5);
      return;
    }
    if (!validateStep6(true)) {
      setStep(6);
      return;
    }

    const cloudRequested = storageMode === 'local-cloud';
    if (cloudRequested && !isSignedIn) {
      setStep(6);
      Alert.alert('Cloud недоступний', 'Для режиму Local + Cloud потрібно увійти через Google.');
      return;
    }

    try {
      setIsCreating(true);

      const lvl = Number(level);
      const localId = uuid.v4();
      const templatePatch = buildTemplatePatch(characterTemplateId);

      const character = createEmptyCharacter({
        id: localId,
        name: name.trim(),
        class: resolvedClassName,
        subclass: resolvedSubclass,
        race: resolvedRace,
        subrace: resolvedSubrace,
        background: resolvedBackground || undefined,
        level: lvl,
        stats: finalStats,
        skills: autoFillSkills(finalStats),
        characterTemplateId,
        customResources: templatePatch.customResources,
        customSections: templatePatch.customSections,
        homebrewEntries: templatePatch.homebrewEntries,
      });

      character.inventory = chosenInventory;
      character.coins = finalCoins;

      await addCharacter(character);
      await ensureCharacterSync(character.id, cloudRequested);

      let createdCharacter = character;
      let cloudSaved = false;
      let shareError: string | null = null;
      let targetSheetId = character.id;

      if (cloudRequested) {
        try {
          const result = await upsertCharacterSheetFromLocal(character);
          if (result?.id && result.id !== character.id) {
            const remappedCharacter = { ...character, id: result.id };
            await updateCharacter(character.id, remappedCharacter);
            await removeCharacterSync(character.id);
            await ensureCharacterSync(remappedCharacter.id, true);
            createdCharacter = remappedCharacter;
            targetSheetId = remappedCharacter.id;
          }

          await markCloudUploaded(targetSheetId);
          cloudSaved = true;

          const email = inviteEmail.trim().toLowerCase();
          if (email) {
            try {
              await addEditorByEmail(targetSheetId, email);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Не вдалося додати редактора.';
              shareError = message;
            }
          }
        } catch {
          await setCloudAvailability(targetSheetId, false);
          cloudSaved = false;
        }
      }

      setCurrentCharacterId(createdCharacter.id);

      if (!cloudRequested) {
        Alert.alert('Готово', 'Персонажа створено у режимі Local only.');
      } else if (cloudSaved && !shareError) {
        Alert.alert('Готово', 'Персонажа створено і синхронізовано з cloud.');
      } else if (cloudSaved && shareError) {
        Alert.alert('Частково готово', `Лист синхронізовано, але шерінг не виконано: ${shareError}`);
      } else {
        Alert.alert('Частково готово', 'Персонажа створено локально, але cloud-sync не спрацював.');
      }

      navigation.navigate('Character', { character: createdCharacter });
    } catch {
      Alert.alert('Помилка', 'Не вдалося створити персонажа. Спробуйте ще раз.');
    } finally {
      setIsCreating(false);
    }
  };

  const Header = ({ title }: { title: string }) => <Text style={styles.sectionTitle}>{title}</Text>;

  const StepNav = ({
    showBack,
    onNext,
    nextLabel = 'Далі',
    nextDisabled = false,
  }: {
    showBack?: boolean;
    onNext: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
  }) => (
    <View style={styles.navRow}>
      {showBack ? (
        <Pressable style={styles.navButton} onPress={() => setStep((prev) => Math.max(prev - 1, 1))} android_ripple={{ color: '#999' }}>
          <Text style={styles.navButtonText}>Назад</Text>
        </Pressable>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <Pressable
        style={[styles.navButton, styles.navButtonPrimary, nextDisabled ? styles.navButtonDisabled : null]}
        onPress={onNext}
        disabled={nextDisabled}
        android_ripple={{ color: '#777' }}
      >
        <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>{nextLabel}</Text>
      </Pressable>
    </View>
  );

  const RacePicker = () => (
    <>
      <Text style={styles.label}>Раса</Text>
      <Picker
        selectedValue={isCustomRace ? 'custom' : raceKey}
        style={styles.picker}
        onValueChange={(value: string) => {
          if (value === 'custom') {
            setUseCustomRace(true);
            return;
          }
          setUseCustomRace(false);
          setRaceKey(value);
          setSubraceKey('');
        }}
      >
        {RACE_OPTIONS.map((rk) => (
          <Picker.Item key={rk} label={RACES[rk].name} value={rk} />
        ))}
        <Picker.Item label='Своя раса…' value='custom' />
      </Picker>

      {isCustomRace ? (
        <>
          <Text style={styles.label}>Назва власної раси</Text>
          <TextInput style={styles.input} value={customRace} onChangeText={setCustomRace} />
          <Text style={styles.label}>Підраса (необов’язково)</Text>
          <TextInput style={styles.input} value={customSubrace} onChangeText={setCustomSubrace} />
        </>
      ) : (
        <>
          {!!SUBRACE_OPTIONS(raceKey).length && (
            <>
              <Text style={styles.label}>Підраса</Text>
              <Picker selectedValue={subraceKey} style={styles.picker} onValueChange={(value: string) => setSubraceKey(value)}>
                <Picker.Item label='(без підраси)' value='' />
                {SUBRACE_OPTIONS(raceKey).map((sr) => (
                  <Picker.Item key={sr} label={sr} value={sr} />
                ))}
              </Picker>
            </>
          )}
          {!!(raceDef?.description || subraceDef?.description) && (
            <View style={styles.infoBox}>
              <Text style={styles.sectionHint}>{subraceDef?.description || raceDef?.description}</Text>
            </View>
          )}
        </>
      )}

      {!isCustomRace && (subraceDef?.flexible || raceDef?.flexible) && (
        <View style={styles.infoBox}>
          <Text style={styles.label}>Гнучкі бонуси (+1/+1)</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.helperText}>Перший бонус</Text>
              <Picker selectedValue={flexPick1} style={styles.picker} onValueChange={(value: AbilityKey) => setFlexPick1(value)}>
                {ABILITY_KEYS.map((ability) => (
                  <Picker.Item key={ability} label={ABILITY_NAMES_UA[ability]} value={ability} />
                ))}
              </Picker>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.helperText}>Другий бонус</Text>
              <Picker selectedValue={flexPick2} style={styles.picker} onValueChange={(value: AbilityKey) => setFlexPick2(value)}>
                {ABILITY_KEYS.map((ability) => (
                  <Picker.Item key={ability} label={ABILITY_NAMES_UA[ability]} value={ability} />
                ))}
              </Picker>
            </View>
          </View>
          {!!raceDef?.flexible?.exclude?.length && (
            <Text style={styles.helperText}>
              Обмеження: {raceDef.flexible.exclude.map((key) => ABILITY_NAMES_UA[key]).join(', ')}
            </Text>
          )}
        </View>
      )}
    </>
  );
  const ClassPicker = () => (
    <>
      <Text style={styles.label}>Клас</Text>
      <Picker
        selectedValue={selectedClass}
        style={styles.picker}
        onValueChange={(value: string) => {
          setSelectedClass(value);
          setSubclass('');
          setCustomSubclass('');
          setGearSelections([]);
        }}
      >
        {CLASS_OPTIONS.map((option) => (
          <Picker.Item key={option} label={CLASS_TRANSLATIONS[option] || option} value={option} />
        ))}
      </Picker>

      {selectedClass === 'custom' ? (
        <>
          <Text style={styles.label}>Назва власного класу</Text>
          <TextInput style={styles.input} value={customClassName} onChangeText={setCustomClassName} />
          <Text style={styles.label}>Підклас (необов’язково)</Text>
          <TextInput style={styles.input} value={customSubclass} onChangeText={setCustomSubclass} placeholder='Наприклад: Shadow Dancer' />
        </>
      ) : (
        <>
          <Text style={styles.label}>Підклас</Text>
          <Picker selectedValue={subclass} style={styles.picker} onValueChange={(value: string) => setSubclass(value)}>
            <Picker.Item label='(без підкласу)' value='' />
            {availableSubclasses.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>

          {!!classPreset && (
            <View style={styles.infoBox}>
              <Text style={styles.sectionHint}>Хіт-дайс: d{classPreset.hitDie}</Text>
              <Text style={styles.sectionHint}>
                Сейви: {classPreset.savingThrows.map((ability) => ABILITY_NAMES_UA[ability as AbilityKey]).join(', ')}
              </Text>
              <Text style={styles.sectionHint}>
                Основні: {classPreset.primaryAbilities.map((ability) => ABILITY_NAMES_UA[ability as AbilityKey]).join(', ')}
              </Text>
              {!!classPreset.spellcastingAbility && (
                <Text style={styles.sectionHint}>Маг. характеристика: {ABILITY_NAMES_UA[classPreset.spellcastingAbility as AbilityKey]}</Text>
              )}
              <Text style={styles.sectionHint}>Профіцієнсії: {classPreset.proficiencies.join(', ')}</Text>
            </View>
          )}

          {!!subDesc && (
            <View style={styles.infoBox}>
              <Text style={styles.sectionHint}>{subDesc}</Text>
            </View>
          )}
        </>
      )}
    </>
  );
  const BackgroundPicker = () => (
    <>
      <Text style={styles.label}>Предісторія</Text>
      <Picker selectedValue={backgroundKey} style={styles.picker} onValueChange={(value: string) => setBackgroundKey(value)}>
        {BACKGROUNDS.map((item) => (
          <Picker.Item key={item.key} label={item.name} value={item.key} />
        ))}
        <Picker.Item label='Своя історія…' value='custom' />
      </Picker>

      {backgroundKey === 'custom' ? (
        <>
          <Text style={styles.label}>Назва власної історії</Text>
          <TextInput style={styles.input} value={customBackground} onChangeText={setCustomBackground} />
        </>
      ) : (
        !!backgroundDef && (
          <View style={styles.infoBox}>
            <Text style={styles.sectionHint}>Навички: {backgroundDef.skills.join(', ')}</Text>
            {!!backgroundDef.tools?.length && <Text style={styles.sectionHint}>Інструменти: {backgroundDef.tools.join(', ')}</Text>}
            {!!backgroundDef.languages && <Text style={styles.sectionHint}>Мови: +{backgroundDef.languages}</Text>}
            <Text style={styles.sectionHint}>
              {backgroundDef.featureName}: {backgroundDef.featureDescription}
            </Text>
          </View>
        )
      )}
    </>
  );

  const GearPicker = () => {
    if (selectedClass === 'custom') {
      return (
        <View style={styles.infoBox}>
          <Text style={styles.label}>Стартове спорядження</Text>
          <Text style={styles.sectionHint}>Проста зброя, Рюкзак мандрівника</Text>
        </View>
      );
    }

    if (!gearDef) return null;

    return (
      <View style={styles.infoBox}>
        <Text style={styles.label}>Стартове спорядження</Text>
        {!!gearDef.base.length && <Text style={styles.sectionHint}>Базово: {gearDef.base.join(', ')}</Text>}

        {gearDef.choices.map((choice, index) => {
          const selectedIndex = gearSelections[index] ?? 0;
          return (
            <View key={`${choice.label}-${index}`}>
              <Text style={styles.helperText}>{choice.label}</Text>
              <Picker
                selectedValue={String(selectedIndex)}
                style={styles.picker}
                onValueChange={(value: string) => {
                  const parsed = Number.parseInt(value, 10) || 0;
                  setGearSelections((prev) => {
                    const next = prev.length ? [...prev] : gearDef.choices.map(() => 0);
                    next[index] = parsed;
                    return next;
                  });
                }}
              >
                {choice.options.map((option, optionIndex) => (
                  <Picker.Item key={`${choice.label}-${optionIndex}`} label={option} value={String(optionIndex)} />
                ))}
              </Picker>
            </View>
          );
        })}
      </View>
    );
  };

  const pointBuyEditor = (
    <View style={styles.infoBox}>
      {ABILITY_KEYS.map((ability) => {
        const value = pbStats[ability];
        const spent = pointBuySpent;
        const remaining = POINT_BUY_BUDGET - spent;
        const nextCost = COST[Math.min(value + 1, POINT_BUY_MAX)] - COST[value];
        const canIncrease = value < POINT_BUY_MAX && remaining >= nextCost;
        const canDecrease = value > POINT_BUY_MIN;

        return (
          <View key={ability} style={styles.statRow}>
            <Text style={styles.statLabel}>{ABILITY_NAMES_UA[ability]}</Text>
            <Pressable
              style={[styles.statControl, !canDecrease ? styles.navButtonDisabled : null]}
              onPress={() => canDecrease && setPbStats((prev) => ({ ...prev, [ability]: prev[ability] - 1 }))}
              disabled={!canDecrease}
              android_ripple={{ color: '#999' }}
            >
              <Text style={styles.statControlText}>-</Text>
            </Pressable>
            <Text style={styles.statValue}>{value}</Text>
            <Pressable
              style={[styles.statControl, !canIncrease ? styles.navButtonDisabled : null]}
              onPress={() => canIncrease && setPbStats((prev) => ({ ...prev, [ability]: prev[ability] + 1 }))}
              disabled={!canIncrease}
              android_ripple={{ color: '#999' }}
            >
              <Text style={styles.statControlText}>+</Text>
            </Pressable>
          </View>
        );
      })}
      <Text style={pointBuyValid ? styles.helperText : styles.warningText}>
        Використано: {pointBuySpent}/{POINT_BUY_BUDGET}
      </Text>
    </View>
  );

  const arrayEditor = (
    <View style={styles.infoBox}>
      {ABILITY_KEYS.map((ability) => (
        <View key={ability}>
          <Text style={styles.helperText}>{ABILITY_NAMES_UA[ability]}</Text>
          <TextInput
            style={styles.input}
            value={String(stats[ability])}
            keyboardType='numeric'
            onChangeText={(text) => {
              const parsed = Number.parseInt(text || '0', 10);
              setStats((prev) => ({ ...prev, [ability]: Number.isFinite(parsed) ? parsed : 8 }));
            }}
          />
        </View>
      ))}
    </View>
  );
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Step {step}/{TOTAL_STEPS}
        </Text>
        <Text style={styles.progressText}>{startMethod === 'guided' ? 'Guided Flow' : 'Quick Start Flow'}</Text>
      </View>
      <Text style={styles.title}>{stepTitle}</Text>

      {step === 1 && (
        <View style={styles.card}>
          <Header title='Оберіть стартовий метод' />
          <Text style={styles.sectionHint}>Guided дає повний контроль по кроках. Quick оптимізує старт і зберігає 7-step структуру.</Text>

          <Pressable
            style={[styles.methodCard, startMethod === 'guided' ? styles.methodCardActive : null]}
            onPress={() => setStartMethod('guided')}
            android_ripple={{ color: '#999' }}
          >
            <Text style={styles.methodTitle}>Guided (повний контроль)</Text>
            <Text style={styles.methodMeta}>Повні підказки на кожному кроці, з ручним контролем параметрів.</Text>
          </Pressable>

          <Pressable
            style={[styles.methodCard, startMethod === 'quick' ? styles.methodCardActive : null]}
            onPress={() => setStartMethod('quick')}
            android_ripple={{ color: '#999' }}
          >
            <Text style={styles.methodTitle}>Quick (швидкий старт)</Text>
            <Text style={styles.methodMeta}>Рекомендовані дефолти для швидкого проходження кроків.</Text>
          </Pressable>

          <Header title='Character Template' />
          <Text style={styles.sectionHint}>Template застосовується тільки під час створення і залишається повністю редагованим.</Text>
          {CHARACTER_TEMPLATE_PRESETS.map((template) => (
            <Pressable
              key={template.id}
              style={[styles.methodCard, characterTemplateId === template.id ? styles.methodCardActive : null]}
              onPress={() => setCharacterTemplateId(template.id)}
              android_ripple={{ color: '#999' }}
            >
              <Text style={styles.methodTitle}>{template.title}</Text>
              <Text style={styles.methodMeta}>{template.description}</Text>
            </Pressable>
          ))}

          <StepNav onNext={goNextFromStep} nextLabel='До Basics' />
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Header title='Ім’я, рівень, раса' />
          <Text style={styles.label}>Ім’я персонажа</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Рівень</Text>
          <TextInput style={styles.input} value={level} onChangeText={setLevel} keyboardType='numeric' />

          <RacePicker />

          <StepNav showBack onNext={goNextFromStep} nextLabel='До Class' nextDisabled={!validateStep2(false)} />
        </View>
      )}

      {step === 3 && (
        <View style={styles.card}>
          <Header title='Клас і підклас' />
          <ClassPicker />
          <StepNav showBack onNext={goNextFromStep} nextLabel='До Stats' nextDisabled={!validateStep3(false)} />
        </View>
      )}

      {step === 4 && (
        <View style={styles.card}>
          <Header title='Характеристики' />
          <Text style={styles.sectionHint}>
            {startMethod === 'quick'
              ? 'Quick Start: рекомендовано стандартний масив. За потреби переключіть на Point Buy.'
              : 'Оберіть спосіб розподілу характеристик.'}
          </Text>

          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, statMethod === 'array' ? styles.toggleButtonActive : null]}
              onPress={() => setStatMethod('array')}
              android_ripple={{ color: '#999' }}
            >
              <Text style={[styles.toggleButtonText, statMethod === 'array' ? styles.toggleButtonTextActive : null]}>Стандартний масив</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, statMethod === 'pointbuy' ? styles.toggleButtonActive : null]}
              onPress={() => setStatMethod('pointbuy')}
              android_ripple={{ color: '#999' }}
            >
              <Text style={[styles.toggleButtonText, statMethod === 'pointbuy' ? styles.toggleButtonTextActive : null]}>Point Buy (27)</Text>
            </Pressable>
          </View>

          {statMethod === 'array' ? arrayEditor : pointBuyEditor}

          <View style={styles.infoBox}>
            <Text style={styles.label}>Фінальні характеристики (з расовими бонусами)</Text>
            {ABILITY_KEYS.map((ability) => (
              <Text key={ability} style={styles.sectionHint}>
                {ABILITY_NAMES_UA[ability]}: {finalStats[ability]}
              </Text>
            ))}
          </View>

          <StepNav showBack onNext={goNextFromStep} nextLabel='До Background' nextDisabled={statMethod === 'pointbuy' && !pointBuyValid} />
        </View>
      )}

      {step === 5 && (
        <View style={styles.card}>
          <Header title='Предісторія та стартовий інвентар' />
          <BackgroundPicker />
          <GearPicker />
          <StepNav showBack onNext={goNextFromStep} nextLabel='До Storage' nextDisabled={!validateStep5(false)} />
        </View>
      )}

      {step === 6 && (
        <View style={styles.card}>
          <Header title='Storage та Share' />
          <Text style={styles.sectionHint}>Оберіть, як зберігати персонажа після створення.</Text>

          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, storageMode === 'local-only' ? styles.toggleButtonActive : null]}
              onPress={() => setStorageMode('local-only')}
              android_ripple={{ color: '#999' }}
            >
              <Text style={[styles.toggleButtonText, storageMode === 'local-only' ? styles.toggleButtonTextActive : null]}>Local only</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, storageMode === 'local-cloud' ? styles.toggleButtonActive : null]}
              onPress={() => setStorageMode('local-cloud')}
              android_ripple={{ color: '#999' }}
            >
              <Text style={[styles.toggleButtonText, storageMode === 'local-cloud' ? styles.toggleButtonTextActive : null]}>Local + Cloud</Text>
            </Pressable>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.sectionHint}>Cloud auth: {isSignedIn ? 'Підключено' : 'Не підключено'}</Text>
            {!isSignedIn && storageMode === 'local-cloud' && <Text style={styles.warningText}>Для cloud-sync потрібно увійти через Google.</Text>}
            {!isSignedIn && storageMode === 'local-cloud' && (
              <Pressable
                style={[styles.navButton, styles.navButtonPrimary, isSigningIn ? styles.navButtonDisabled : null]}
                onPress={onLogin}
                disabled={isSigningIn}
                android_ripple={{ color: '#777' }}
              >
                {isSigningIn ? (
                  <ActivityIndicator color={c.background} />
                ) : (
                  <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>Увійти через Google</Text>
                )}
              </Pressable>
            )}
          </View>

          <Text style={styles.label}>Запросити редактора (email, optional)</Text>
          <TextInput
            style={styles.input}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            autoCapitalize='none'
            keyboardType='email-address'
            placeholder='name@example.com'
            placeholderTextColor={c.textSecondary}
            editable={storageMode === 'local-cloud'}
          />
          {storageMode === 'local-only' && <Text style={styles.helperText}>Шерінг доступний лише у режимі Local + Cloud.</Text>}

          <StepNav showBack onNext={goNextFromStep} nextLabel='До Review' nextDisabled={!validateStep6(false)} />
        </View>
      )}

      {step === 7 && (
        <View style={styles.card}>
          <Header title='Review перед створенням' />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ім’я</Text>
            <Text style={styles.summaryValue}>{name.trim() || '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Рівень</Text>
            <Text style={styles.summaryValue}>{level}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Раса</Text>
            <Text style={styles.summaryValue}>{resolvedRace || '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Клас</Text>
            <Text style={styles.summaryValue}>{localizedClassName || '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Предісторія</Text>
            <Text style={styles.summaryValue}>{resolvedBackground || '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Storage</Text>
            <Text style={styles.summaryValue}>{storageMode === 'local-only' ? 'Local only' : 'Local + Cloud'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Template</Text>
            <Text style={styles.summaryValue}>{characterTemplateId}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Share invite</Text>
            <Text style={styles.summaryValue}>{inviteEmail.trim() || '—'}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Sync onboarding hints</Text>
            {reviewHints.map((line) => (
              <Text key={line} style={styles.sectionHint}>
                • {line}
              </Text>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Підсумок характеристик</Text>
            <View style={styles.chipsWrap}>
              {ABILITY_KEYS.map((ability) => (
                <View key={ability} style={styles.chip}>
                  <Text style={styles.chipText}>
                    {ABILITY_NAMES_UA[ability]} {finalStats[ability]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <StepNav
            showBack
            onNext={onCreate}
            nextLabel={isCreating ? 'Створення…' : 'Створити персонажа'}
            nextDisabled={isCreating}
          />
        </View>
      )}
    </ScrollView>
  );
};

export default CreateCharacter;
