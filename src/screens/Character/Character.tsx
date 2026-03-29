import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Pressable, TextInput as RNTextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import type {
  CharacterCustomField,
  CharacterDto,
  CharacterTracker,
  CustomFieldType,
  TrackerResetRule,
} from '@/types/Character';
import CharacterMenu from '@/shared/components/CharacterMenu/CharacterMenu';
import useCharacterStore from '@/context/Character-store';
import { Modal } from '@/shared/components/Modal/Modal';
import DiceRoller from '@/screens/DiceRoller/DiceRoller';
import Dice from '@/screens/Dice/Dice';
import { calculateModifier } from '@/shared/helpers/calculateModifier';
import { parseDice } from '@/shared/helpers/dice';
import { fetchCharacterSheet, subscribeCharacterSheet, upsertCharacterSheetFromLocal } from '@/services/characterSheets';
import { fbAuth } from '@/services/firebase';
import useSyncStore from '@/context/Sync-store';

interface CharacterProps {
  route: {
    params: {
      character: CharacterDto;
    };
  };
}

type CharacterMode = 'play' | 'edit';
type CharacterTab = 'Overview' | 'Combat' | 'Magic' | 'Inventory' | 'Notes' | 'Homebrew';
type SyncStatus = 'Local' | 'Pending' | 'Synced';

const TAB_ORDER: CharacterTab[] = ['Overview', 'Combat', 'Magic', 'Inventory', 'Notes', 'Homebrew'];
const TRACKER_RULES: TrackerResetRule[] = ['none', 'short-rest', 'long-rest', 'session'];
const FIELD_TYPES: CustomFieldType[] = ['text', 'number', 'boolean', 'select'];

const STAT_LABELS: Array<{ key: keyof CharacterDto['stats']; label: string }> = [
  { key: 'strength', label: 'STR' },
  { key: 'dexterity', label: 'DEX' },
  { key: 'constitution', label: 'CON' },
  { key: 'intelligence', label: 'INT' },
  { key: 'wisdom', label: 'WIS' },
  { key: 'charisma', label: 'CHA' },
];

const SKILL_LABELS: Record<string, string> = {
  acrobatics: 'Акробатика',
  animalHandling: 'Догляд за тваринами',
  arcana: 'Аркана',
  athletics: 'Атлетика',
  deception: 'Обман',
  history: 'Історія',
  insight: 'Проникливість',
  intimidation: 'Залякування',
  investigation: 'Розслідування',
  medicine: 'Медицина',
  nature: 'Природа',
  perception: 'Сприйняття',
  performance: 'Виступ',
  persuasion: 'Переконання',
  religion: 'Релігія',
  sleightOfHand: 'Спритність рук',
  stealth: 'Прихованість',
  survival: 'Виживання',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildProficiencyByLevel(level: number): number {
  const safeLevel = clamp(level || 1, 1, 20);
  return 2 + Math.floor((safeLevel - 1) / 4);
}

function getTrackerResetValue(tracker: CharacterTracker): number {
  if (typeof tracker.max === 'number') return tracker.max;
  return 0;
}

function ensureCharacterDefaults(character: CharacterDto): CharacterDto {
  return {
    ...character,
    hp: {
      max: character.hp?.max ?? 10,
      current: character.hp?.current ?? 10,
      temp: character.hp?.temp ?? 0,
    },
    proficiencyBonus: character.proficiencyBonus ?? buildProficiencyByLevel(character.level),
    inventory: character.inventory ?? [],
    proficiencies: character.proficiencies ?? [],
    weapons: character.weapons ?? [],
    featuresAndTraits: character.featuresAndTraits ?? [],
    notes: character.notes ?? '',
    conditions: character.conditions ?? [],
    customFields: character.customFields ?? [],
    customTrackers: character.customTrackers ?? [],
    notesBlocks: {
      session: character.notesBlocks?.session ?? '',
      campaign: character.notesBlocks?.campaign ?? '',
      goals: character.notesBlocks?.goals ?? '',
      relationships: character.notesBlocks?.relationships ?? '',
      quests: character.notesBlocks?.quests ?? '',
    },
    spells: {
      spellcastingAbility: character.spells?.spellcastingAbility ?? '',
      spellSaveDC: character.spells?.spellSaveDC ?? 0,
      spellAttackBonus: character.spells?.spellAttackBonus ?? 0,
      spellSlots: character.spells?.spellSlots ?? {},
      knownSpells: character.spells?.knownSpells ?? [],
      preparedSpells: character.spells?.preparedSpells ?? [],
      cantrips: character.spells?.cantrips ?? [],
    },
  };
}

export default function Character({ route }: Partial<CharacterProps> & { route?: CharacterProps['route'] }) {
  const storeCharacters = useCharacterStore((s) => s.characters);
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);

  const routeCharacter = route?.params?.character;
  const fallbackFromStore = storeCharacters.find((c) => c.id === currentCharacterId) || storeCharacters[0];
  const baseCharacter = routeCharacter || fallbackFromStore;

  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  if (!baseCharacter) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Персонаж не знайдений</Text>
      </View>
    );
  }

  const [characterData, setCharacterData] = useState<CharacterDto>(ensureCharacterDefaults(baseCharacter));
  const [mode, setMode] = useState<CharacterMode>('play');
  const [selectedTab, setSelectedTab] = useState<CharacterTab>('Overview');
  const [isCloudDoc, setIsCloudDoc] = useState<boolean>(false);
  const [isSharedSheet, setIsSharedSheet] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('Local');
  const syncByCharacter = useSyncStore((s) => s.syncByCharacter);
  const loadSyncMeta = useSyncStore((s) => s.loadSyncMeta);
  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const setCloudAvailability = useSyncStore((s) => s.setCloudAvailability);
  const markLocalDraft = useSyncStore((s) => s.markLocalDraft);
  const markCloudUploaded = useSyncStore((s) => s.markCloudUploaded);
  const markConflict = useSyncStore((s) => s.markConflict);

  const [isHpModalVisible, setIsHpModalVisible] = useState(false);
  const [tempCurrentHp, setTempCurrentHp] = useState('0');
  const [tempMaxHp, setTempMaxHp] = useState('0');

  const [isTempHpModalVisible, setIsTempHpModalVisible] = useState(false);
  const [tempShieldInput, setTempShieldInput] = useState('0');

  const [isDiceModalVisible, setIsDiceModalVisible] = useState(false);
  const [isRestModalVisible, setIsRestModalVisible] = useState(false);
  const [restStep, setRestStep] = useState<'choose' | 'short' | 'roll'>('choose');
  const [shortRestDice, setShortRestDice] = useState('1');
  const [rollsNeeded, setRollsNeeded] = useState(0);
  const [rollResults, setRollResults] = useState<number[]>([]);
  const [diceSides, setDiceSides] = useState(0);

  const [isConditionModalVisible, setIsConditionModalVisible] = useState(false);
  const [conditionInput, setConditionInput] = useState('');

  const [isQuickNoteModalVisible, setIsQuickNoteModalVisible] = useState(false);
  const [quickNoteInput, setQuickNoteInput] = useState('');

  const [collapsedSecondary, setCollapsedSecondary] = useState<Record<CharacterTab, boolean>>({
    Overview: false,
    Combat: true,
    Magic: true,
    Inventory: true,
    Notes: true,
    Homebrew: true,
  });

  const hpPercent = useMemo(() => {
    if (!characterData.hp.max) return 0;
    return Math.round((characterData.hp.current / characterData.hp.max) * 100);
  }, [characterData.hp.current, characterData.hp.max]);

  const proficiency = characterData.proficiencyBonus ?? buildProficiencyByLevel(characterData.level);
  const passivePerception = 10 + (characterData.skills?.perception ?? calculateModifier(characterData.stats.wisdom || 10));
  const hasHomebrew = (characterData.customFields?.length ?? 0) > 0 || (characterData.customTrackers?.length ?? 0) > 0;
  const currentSync = syncByCharacter[baseCharacter.id];

  const syncStatusLabel = useMemo<SyncStatus | 'Conflict'>(() => {
    const status = currentSync?.status;
    if (!status) return syncStatus;
    if (status === 'local-only') return 'Local';
    if (status === 'in-sync') return 'Synced';
    if (status === 'conflict') return 'Conflict';
    return 'Pending';
  }, [currentSync?.status, syncStatus]);

  useEffect(() => {
    setCharacterData(ensureCharacterDefaults(baseCharacter));
  }, [baseCharacter.id]);

  useEffect(() => {
    loadSyncMeta().catch(() => {});
  }, [loadSyncMeta]);

  useEffect(() => {
    ensureCharacterSync(baseCharacter.id, false).catch(() => {});
  }, [baseCharacter.id, ensureCharacterSync]);

  useEffect(() => {
    let alive = true;
    fetchCharacterSheet(baseCharacter.id)
      .then((doc) => {
        if (!alive) return;
        const exists = Boolean(doc);
        setIsCloudDoc(exists);
        setIsSharedSheet(Boolean(doc && Array.isArray(doc.editors) && doc.editors.length > 0));
        setSyncStatus(exists ? 'Synced' : 'Local');
        setCloudAvailability(baseCharacter.id, exists).catch(() => {});
      })
      .catch(() => {
        if (!alive) return;
        setIsCloudDoc(false);
        setIsSharedSheet(false);
        setSyncStatus('Local');
        setCloudAvailability(baseCharacter.id, false).catch(() => {});
      });

    const unsubscribe = subscribeCharacterSheet(baseCharacter.id, (doc) => {
      const exists = Boolean(doc);
      setIsCloudDoc(exists);
      setIsSharedSheet(Boolean(doc && Array.isArray(doc.editors) && doc.editors.length > 0));
      setSyncStatus(exists ? 'Synced' : 'Local');
      setCloudAvailability(baseCharacter.id, exists).catch(() => {});
    });

    return () => {
      alive = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [baseCharacter.id, setCloudAvailability]);

  useEffect(() => {
    setTempCurrentHp(String(characterData.hp.current));
    setTempMaxHp(String(characterData.hp.max));
  }, [characterData.hp.current, characterData.hp.max]);

  useEffect(() => {
    if (!characterData.id) return;
    const timeout = setTimeout(() => {
      void updateCharacter(characterData.id, characterData);
    }, 350);
    return () => clearTimeout(timeout);
  }, [characterData, updateCharacter]);

  useEffect(() => {
    if (!characterData.id) return;
    if (!fbAuth.currentUser) return;
    if (!isCloudDoc) return;

    setSyncStatus('Pending');
    const timeout = setTimeout(() => {
      upsertCharacterSheetFromLocal(characterData)
        .then(() => {
          setSyncStatus('Synced');
          markCloudUploaded(characterData.id).catch(() => {});
        })
        .catch((error) => {
          setSyncStatus('Local');
          const message = String(error?.message || '').toLowerCase();
          if (message.includes('conflict')) {
            markConflict(characterData.id, ['sheet']).catch(() => {});
          }
        });
    }, 1200);

    return () => clearTimeout(timeout);
  }, [characterData, isCloudDoc, markCloudUploaded, markConflict]);

  const patchCharacter = useCallback((patcher: (prev: CharacterDto) => CharacterDto) => {
    setCharacterData((prev) => ensureCharacterDefaults(patcher(prev)));
    markLocalDraft(baseCharacter.id, 'sheet').catch(() => {});
  }, [baseCharacter.id, markLocalDraft]);

  const setNotesBlock = useCallback((key: keyof NonNullable<CharacterDto['notesBlocks']>, value: string) => {
    patchCharacter((prev) => ({
      ...prev,
      notesBlocks: {
        ...prev.notesBlocks,
        [key]: value,
      },
    }));
  }, [patchCharacter]);

  const applyHpDelta = useCallback((delta: number) => {
    patchCharacter((prev) => ({
      ...prev,
      hp: {
        ...prev.hp,
        current: clamp(prev.hp.current + delta, 0, prev.hp.max),
      },
    }));
  }, [patchCharacter]);

  const openHpModal = useCallback(() => {
    setTempCurrentHp(String(characterData.hp.current));
    setTempMaxHp(String(characterData.hp.max));
    setIsHpModalVisible(true);
  }, [characterData.hp.current, characterData.hp.max]);

  const saveHpModal = useCallback(() => {
    const nextMax = Math.max(1, parseNumber(tempMaxHp, characterData.hp.max));
    const nextCurrent = clamp(parseNumber(tempCurrentHp, characterData.hp.current), 0, nextMax);

    patchCharacter((prev) => ({
      ...prev,
      hp: {
        ...prev.hp,
        max: nextMax,
        current: nextCurrent,
      },
    }));

    setIsHpModalVisible(false);
  }, [characterData.hp.current, characterData.hp.max, patchCharacter, tempCurrentHp, tempMaxHp]);

  const saveTempHp = useCallback(() => {
    const value = Math.max(0, parseNumber(tempShieldInput, characterData.hp.temp));
    patchCharacter((prev) => ({
      ...prev,
      hp: {
        ...prev.hp,
        temp: value,
      },
    }));
    setTempShieldInput('0');
    setIsTempHpModalVisible(false);
  }, [characterData.hp.temp, patchCharacter, tempShieldInput]);

  const applyLongRest = useCallback(() => {
    const { sides } = parseDice(characterData.hitDice || '0d0');

    patchCharacter((prev) => {
      const nextSpellSlots = { ...prev.spells.spellSlots };
      Object.keys(nextSpellSlots).forEach((key) => {
        const level = Number(key);
        const slot = nextSpellSlots[level];
        if (!slot) return;
        nextSpellSlots[level] = { ...slot, used: 0 };
      });

      const nextTrackers = (prev.customTrackers || []).map((tracker) => {
        if (tracker.resetRule === 'long-rest' || tracker.resetRule === 'short-rest') {
          return { ...tracker, current: getTrackerResetValue(tracker) };
        }
        return tracker;
      });

      return {
        ...prev,
        hp: {
          ...prev.hp,
          current: prev.hp.max,
          temp: 0,
        },
        hitDice: `${prev.level}d${sides || 6}`,
        spells: {
          ...prev.spells,
          spellSlots: nextSpellSlots,
        },
        customTrackers: nextTrackers,
      };
    });

    setIsRestModalVisible(false);
  }, [characterData.hitDice, patchCharacter]);

  const startShortRestFlow = useCallback(() => {
    setRestStep('short');
    setShortRestDice('1');
    setRollResults([]);
    setRollsNeeded(0);
    setDiceSides(0);
    setIsRestModalVisible(true);
  }, []);

  const startShortRestRoll = useCallback(() => {
    const { count, sides } = parseDice(characterData.hitDice || '0d0');
    if (count <= 0 || sides <= 0) return;

    let amount = parseInt(shortRestDice, 10);
    if (!Number.isFinite(amount) || amount <= 0) amount = 1;

    const safeAmount = clamp(amount, 1, count);
    setRollsNeeded(safeAmount);
    setRollResults([]);
    setDiceSides(sides);
    setRestStep('roll');
  }, [characterData.hitDice, shortRestDice]);

  const applyShortRestRolls = useCallback(() => {
    const { count, sides } = parseDice(characterData.hitDice || '0d0');
    const used = rollResults.length;
    const conMod = calculateModifier(characterData.stats.constitution || 10);
    const heal = rollResults.reduce((sum, result) => sum + result, 0) + conMod * used;

    patchCharacter((prev) => {
      const nextTrackers = (prev.customTrackers || []).map((tracker) => {
        if (tracker.resetRule === 'short-rest') {
          return { ...tracker, current: getTrackerResetValue(tracker) };
        }
        return tracker;
      });

      return {
        ...prev,
        hp: {
          ...prev.hp,
          current: clamp(prev.hp.current + heal, 0, prev.hp.max),
        },
        hitDice: `${Math.max(count - used, 0)}d${sides || 6}`,
        customTrackers: nextTrackers,
      };
    });

    setIsRestModalVisible(false);
  }, [characterData.hitDice, characterData.stats.constitution, patchCharacter, rollResults]);

  const addCondition = useCallback(() => {
    const value = conditionInput.trim();
    if (!value) return;

    patchCharacter((prev) => ({
      ...prev,
      conditions: [...(prev.conditions || []), value],
    }));

    setConditionInput('');
    setIsConditionModalVisible(false);
  }, [conditionInput, patchCharacter]);

  const removeCondition = useCallback((index: number) => {
    patchCharacter((prev) => ({
      ...prev,
      conditions: (prev.conditions || []).filter((_, idx) => idx !== index),
    }));
  }, [patchCharacter]);

  const addQuickSessionNote = useCallback(() => {
    const note = quickNoteInput.trim();
    if (!note) return;

    patchCharacter((prev) => {
      const previous = prev.notesBlocks?.session?.trim();
      const merged = previous ? `${previous}\n• ${note}` : `• ${note}`;
      return {
        ...prev,
        notesBlocks: {
          ...prev.notesBlocks,
          session: merged,
        },
      };
    });

    setQuickNoteInput('');
    setIsQuickNoteModalVisible(false);
    setSelectedTab('Notes');
  }, [patchCharacter, quickNoteInput]);

  const addCustomField = useCallback(() => {
    const newField: CharacterCustomField = {
      id: Date.now().toString(),
      label: 'Custom Field',
      type: 'text',
      value: '',
    };

    patchCharacter((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField],
    }));
  }, [patchCharacter]);

  const updateCustomField = useCallback((fieldId: string, patch: Partial<CharacterCustomField>) => {
    patchCharacter((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).map((field) => {
        if (field.id !== fieldId) return field;

        const nextType = patch.type ?? field.type;
        const nextValue = patch.value ?? field.value;

        if (nextType === 'number' && typeof nextValue === 'string') {
          return { ...field, ...patch, value: parseNumber(nextValue, 0) };
        }

        if (nextType === 'boolean' && typeof nextValue !== 'boolean') {
          return { ...field, ...patch, value: nextValue === 'true' };
        }

        return { ...field, ...patch };
      }),
    }));
  }, [patchCharacter]);

  const removeCustomField = useCallback((fieldId: string) => {
    patchCharacter((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((field) => field.id !== fieldId),
    }));
  }, [patchCharacter]);

  const addTracker = useCallback(() => {
    const tracker: CharacterTracker = {
      id: Date.now().toString(),
      label: 'Custom Tracker',
      current: 0,
      max: 10,
      resetRule: 'none',
    };

    patchCharacter((prev) => ({
      ...prev,
      customTrackers: [...(prev.customTrackers || []), tracker],
    }));
  }, [patchCharacter]);

  const updateTracker = useCallback((trackerId: string, patch: Partial<CharacterTracker>) => {
    patchCharacter((prev) => ({
      ...prev,
      customTrackers: (prev.customTrackers || []).map((tracker) => {
        if (tracker.id !== trackerId) return tracker;
        return { ...tracker, ...patch };
      }),
    }));
  }, [patchCharacter]);

  const removeTracker = useCallback((trackerId: string) => {
    patchCharacter((prev) => ({
      ...prev,
      customTrackers: (prev.customTrackers || []).filter((tracker) => tracker.id !== trackerId),
    }));
  }, [patchCharacter]);

  const quickActions = [
    { id: 'minus-hp', label: '-HP', icon: 'heart-minus-outline', onPress: () => applyHpDelta(-1) },
    { id: 'plus-hp', label: '+HP', icon: 'heart-plus-outline', onPress: () => applyHpDelta(1) },
    {
      id: 'temp-hp',
      label: 'Temp HP',
      icon: 'shield-half-full',
      onPress: () => {
        setTempShieldInput(String(characterData.hp.temp));
        setIsTempHpModalVisible(true);
      },
    },
    { id: 'roll', label: 'Roll', icon: 'dice-multiple-outline', onPress: () => setIsDiceModalVisible(true) },
    { id: 'short-rest', label: 'Short Rest', icon: 'coffee-outline', onPress: startShortRestFlow },
    { id: 'long-rest', label: 'Long Rest', icon: 'weather-night', onPress: applyLongRest },
    { id: 'condition', label: 'Condition', icon: 'alert-circle-outline', onPress: () => setIsConditionModalVisible(true) },
    { id: 'note', label: 'Note', icon: 'notebook-outline', onPress: () => setIsQuickNoteModalVisible(true) },
  ];

  const sortedSkills = useMemo(() => {
    const entries = Object.entries(characterData.skills || {});
    return entries.sort((a, b) => b[1] - a[1]);
  }, [characterData.skills]);

  const syncBadges = useMemo(() => {
    const badges: Array<{ label: string; kind: 'neutral' | 'success' | 'warning' | 'accent' }> = [];
    badges.push({
      label: syncStatusLabel,
      kind:
        syncStatusLabel === 'Synced'
          ? 'success'
          : syncStatusLabel === 'Pending' || syncStatusLabel === 'Conflict'
            ? 'warning'
            : 'neutral',
    });
    if (!isCloudDoc) badges.push({ label: 'Local', kind: 'neutral' });
    if (isSharedSheet) badges.push({ label: 'Shared with DM', kind: 'accent' });
    if (hasHomebrew) badges.push({ label: 'Homebrew', kind: 'warning' });
    return badges;
  }, [hasHomebrew, isCloudDoc, isSharedSheet, syncStatusLabel]);

  const openTab = useCallback((tab: CharacterTab) => setSelectedTab(tab), []);
  const toggleSecondary = useCallback((tab: CharacterTab) => {
    setCollapsedSecondary((prev) => ({ ...prev, [tab]: !prev[tab] }));
  }, []);

  const renderBadge = useCallback((label: string, kind: 'neutral' | 'success' | 'warning' | 'accent') => {
    const badgeStyle: Array<any> = [styles.badge];
    const badgeText: Array<any> = [styles.badgeText];

    if (kind === 'success') badgeStyle.push(styles.badgeSuccess);
    if (kind === 'warning') badgeStyle.push(styles.badgeWarning);
    if (kind === 'accent') badgeStyle.push(styles.badgeAccent);
    if (kind !== 'neutral') badgeText.push(styles.badgeTextInverted);

    return (
      <View key={`${label}-${kind}`} style={badgeStyle}>
        <Text style={badgeText}>{label}</Text>
      </View>
    );
  }, [styles.badge, styles.badgeAccent, styles.badgeSuccess, styles.badgeText, styles.badgeTextInverted, styles.badgeWarning]);

  const renderOverviewPlay = () => (
    <>
      <View style={styles.cardPrimary}>
        <Text style={styles.sectionTitle}>Основні характеристики</Text>
        <View style={styles.statGrid}>
          {STAT_LABELS.map((stat) => {
            const score = characterData.stats[stat.key] || 10;
            const mod = calculateModifier(score);
            return (
              <View key={stat.key} style={styles.statTile}>
                <Text style={styles.statName}>{stat.label}</Text>
                <Text style={styles.statScore}>{score}</Text>
                <Text style={styles.statMod}>{mod >= 0 ? `+${mod}` : `${mod}`}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.cardSecondary}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Top Skills</Text>
          <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Overview')} android_ripple={{ color: '#999' }}>
            <Text style={styles.collapseButtonText}>{collapsedSecondary.Overview ? 'Розгорнути' : 'Згорнути'}</Text>
          </Pressable>
        </View>

        {sortedSkills.slice(0, 6).map(([skill, value]) => (
          <View key={skill} style={styles.rowLine}>
            <Text style={styles.rowLabel}>{SKILL_LABELS[skill] || skill}</Text>
            <Text style={styles.rowValue}>{value >= 0 ? `+${value}` : `${value}`}</Text>
          </View>
        ))}

        {!collapsedSecondary.Overview && (
          <>
            <Text style={styles.subSectionTitle}>Proficiencies</Text>
            <Text style={styles.blockText}>{characterData.proficiencies.length ? characterData.proficiencies.join(', ') : 'Немає'}</Text>
            <Text style={styles.subSectionTitle}>Traits & Features</Text>
            <Text style={styles.blockText}>{characterData.featuresAndTraits?.length ? characterData.featuresAndTraits.join(', ') : 'Немає'}</Text>
            <Text style={styles.subSectionTitle}>Current Conditions</Text>
            {characterData.conditions?.length ? (
              characterData.conditions.map((condition, idx) => (
                <View key={`${condition}-${idx}`} style={styles.conditionRow}>
                  <Text style={styles.conditionText}>• {condition}</Text>
                  <Pressable onPress={() => removeCondition(idx)} android_ripple={{ color: '#999' }}>
                    <MaterialCommunityIcons name='close-circle-outline' size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ))
            ) : (
              <Text style={styles.blockTextMuted}>Немає активних станів</Text>
            )}
          </>
        )}
      </View>
    </>
  );

  const renderCombatPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.sectionTitle}>Combat Tools</Text>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Combat')} android_ripple={{ color: '#999' }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Combat ? 'Розгорнути' : 'Згорнути'}</Text>
        </Pressable>
      </View>

      <Text style={styles.subSectionTitle}>Attacks</Text>
      {characterData.weapons?.length ? (
        characterData.weapons.map((weapon, idx) => (
          <View key={`${weapon.name}-${idx}`} style={styles.rowLine}>
            <Text style={styles.rowLabel}>{weapon.name}</Text>
            <Text style={styles.rowValue}>+{weapon.attackBonus} / {weapon.damage}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.blockTextMuted}>Зброя не додана</Text>
      )}

      {!collapsedSecondary.Combat && (
        <>
          <Text style={styles.subSectionTitle}>Death Saves</Text>
          <Text style={styles.blockText}>
            Успіхи: {characterData.deathSaves?.successes ?? 0} | Провали: {characterData.deathSaves?.failures ?? 0}
          </Text>
          <Text style={styles.subSectionTitle}>Combat Notes</Text>
          <Text style={styles.blockText}>{characterData.notesBlocks?.session?.trim() || 'Немає нотаток сесії'}</Text>
        </>
      )}
    </View>
  );

  const renderMagicPlay = () => {
    const slotLevels = Object.keys(characterData.spells.spellSlots)
      .map(Number)
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    return (
      <View style={styles.cardSecondary}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Magic Snapshot</Text>
          <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Magic')} android_ripple={{ color: '#999' }}>
            <Text style={styles.collapseButtonText}>{collapsedSecondary.Magic ? 'Розгорнути' : 'Згорнути'}</Text>
          </Pressable>
        </View>

        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>Spellcasting</Text>
          <Text style={styles.rowValue}>{characterData.spells.spellcastingAbility || '—'}</Text>
        </View>
        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>Save DC</Text>
          <Text style={styles.rowValue}>{characterData.spells.spellSaveDC || 0}</Text>
        </View>
        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>Attack Bonus</Text>
          <Text style={styles.rowValue}>
            {characterData.spells.spellAttackBonus >= 0
              ? `+${characterData.spells.spellAttackBonus}`
              : characterData.spells.spellAttackBonus}
          </Text>
        </View>

        <Text style={styles.subSectionTitle}>Slots</Text>
        {slotLevels.length ? (
          slotLevels.map((level) => {
            const slot = characterData.spells.spellSlots[level];
            if (!slot) return null;
            return (
              <View key={`slot-${level}`} style={styles.rowLine}>
                <Text style={styles.rowLabel}>{level} рівень</Text>
                <Text style={styles.rowValue}>
                  {Math.max(slot.max - slot.used, 0)}/{slot.max}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.blockTextMuted}>Слоти не налаштовані</Text>
        )}

        {!collapsedSecondary.Magic && (
          <>
            <Text style={styles.subSectionTitle}>Prepared Spells</Text>
            <Text style={styles.blockText}>
              {characterData.spells.preparedSpells.length ? characterData.spells.preparedSpells.join(', ') : 'Немає підготовлених'}
            </Text>
            <Text style={styles.subSectionTitle}>Known Spells</Text>
            <Text style={styles.blockText}>
              {characterData.spells.knownSpells.length ? characterData.spells.knownSpells.join(', ') : 'Немає відомих'}
            </Text>
          </>
        )}
      </View>
    );
  };

  const renderInventoryPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.sectionTitle}>Inventory</Text>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Inventory')} android_ripple={{ color: '#999' }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Inventory ? 'Розгорнути' : 'Згорнути'}</Text>
        </Pressable>
      </View>

      {characterData.inventory.length ? (
        characterData.inventory
          .slice(0, collapsedSecondary.Inventory ? 6 : characterData.inventory.length)
          .map((item, idx) => (
            <Text key={`${item}-${idx}`} style={styles.blockText}>
              • {item}
            </Text>
          ))
      ) : (
        <Text style={styles.blockTextMuted}>Інвентар порожній</Text>
      )}

      <Text style={styles.subSectionTitle}>Currency</Text>
      <Text style={styles.blockText}>
        GP {characterData.coins?.gold ?? 0} | SP {characterData.coins?.silver ?? 0} | CP {characterData.coins?.copper ?? 0}
      </Text>
    </View>
  );

  const renderNotesPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Notes')} android_ripple={{ color: '#999' }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Notes ? 'Розгорнути' : 'Згорнути'}</Text>
        </Pressable>
      </View>

      <Text style={styles.subSectionTitle}>Session</Text>
      <Text style={styles.blockText}>{characterData.notesBlocks?.session?.trim() || 'Немає сесійних нотаток'}</Text>

      {!collapsedSecondary.Notes && (
        <>
          <Text style={styles.subSectionTitle}>Campaign</Text>
          <Text style={styles.blockText}>{characterData.notesBlocks?.campaign?.trim() || 'Немає нотаток кампанії'}</Text>
          <Text style={styles.subSectionTitle}>Goals</Text>
          <Text style={styles.blockText}>{characterData.notesBlocks?.goals?.trim() || 'Немає цілей'}</Text>
          <Text style={styles.subSectionTitle}>Relationships</Text>
          <Text style={styles.blockText}>{characterData.notesBlocks?.relationships?.trim() || 'Немає'}</Text>
          <Text style={styles.subSectionTitle}>Quests</Text>
          <Text style={styles.blockText}>{characterData.notesBlocks?.quests?.trim() || 'Немає'}</Text>
        </>
      )}
    </View>
  );

  const renderHomebrewPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.sectionTitle}>Homebrew</Text>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Homebrew')} android_ripple={{ color: '#999' }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Homebrew ? 'Розгорнути' : 'Згорнути'}</Text>
        </Pressable>
      </View>

      <Text style={styles.subSectionTitle}>Custom Fields</Text>
      {characterData.customFields?.length ? (
        characterData.customFields.map((field) => (
          <View key={field.id} style={styles.rowLine}>
            <Text style={styles.rowLabel}>{field.label}</Text>
            <Text style={styles.rowValue}>{String(field.value)}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.blockTextMuted}>Поля не додані</Text>
      )}

      {!collapsedSecondary.Homebrew && (
        <>
          <Text style={styles.subSectionTitle}>Flexible Trackers</Text>
          {characterData.customTrackers?.length ? (
            characterData.customTrackers.map((tracker) => (
              <View key={tracker.id} style={styles.trackerCard}>
                <View style={styles.trackerHeader}>
                  <Text style={styles.trackerName}>{tracker.label}</Text>
                  <Text style={styles.trackerMeta}>{tracker.resetRule}</Text>
                </View>
                <View style={styles.trackerControls}>
                  <Pressable
                    style={styles.quickCircle}
                    android_ripple={{ color: '#999' }}
                    onPress={() => updateTracker(tracker.id, { current: Math.max(0, tracker.current - 1) })}
                  >
                    <Text style={styles.quickCircleText}>-</Text>
                  </Pressable>
                  <Text style={styles.trackerValue}>
                    {tracker.current}
                    {typeof tracker.max === 'number' ? `/${tracker.max}` : ''}
                  </Text>
                  <Pressable
                    style={styles.quickCircle}
                    android_ripple={{ color: '#999' }}
                    onPress={() => {
                      const max = typeof tracker.max === 'number' ? tracker.max : Number.POSITIVE_INFINITY;
                      updateTracker(tracker.id, { current: Math.min(tracker.current + 1, max) });
                    }}
                  >
                    <Text style={styles.quickCircleText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.blockTextMuted}>Трекери не додані</Text>
          )}
        </>
      )}
    </View>
  );

  const renderTabContentPlay = () => {
    if (selectedTab === 'Overview') return renderOverviewPlay();
    if (selectedTab === 'Combat') return renderCombatPlay();
    if (selectedTab === 'Magic') return renderMagicPlay();
    if (selectedTab === 'Inventory') return renderInventoryPlay();
    if (selectedTab === 'Notes') return renderNotesPlay();
    return renderHomebrewPlay();
  };

  const renderTextInput = (
    value: string,
    onChangeText: (next: string) => void,
    placeholder: string,
    options?: { multiline?: boolean; keyboardType?: 'default' | 'number-pad' | 'numeric' },
  ) => (
    <RNTextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      style={[styles.editInput, options?.multiline ? styles.editInputMultiline : null]}
      keyboardType={options?.keyboardType || 'default'}
      multiline={options?.multiline}
    />
  );

  const renderOverviewEdit = () => (
    <View style={styles.cardSecondary}>
      <Text style={styles.sectionTitle}>Identity</Text>
      <Text style={styles.editLabel}>Name</Text>
      {renderTextInput(characterData.name, (next) => patchCharacter((prev) => ({ ...prev, name: next })), 'Character name')}
      <Text style={styles.editLabel}>Class</Text>
      {renderTextInput(characterData.class, (next) => patchCharacter((prev) => ({ ...prev, class: next })), 'Class')}
      <Text style={styles.editLabel}>Race</Text>
      {renderTextInput(characterData.race, (next) => patchCharacter((prev) => ({ ...prev, race: next })), 'Race')}
      <Text style={styles.editLabel}>Level</Text>
      {renderTextInput(
        String(characterData.level),
        (next) => patchCharacter((prev) => ({ ...prev, level: clamp(parseNumber(next, prev.level), 1, 20) })),
        '1-20',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Experience</Text>
      {renderTextInput(
        String(characterData.experience),
        (next) => patchCharacter((prev) => ({ ...prev, experience: Math.max(0, parseNumber(next, prev.experience)) })),
        'XP',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Proficiency Bonus</Text>
      {renderTextInput(
        String(characterData.proficiencyBonus ?? proficiency),
        (next) => patchCharacter((prev) => ({ ...prev, proficiencyBonus: clamp(parseNumber(next, proficiency), 1, 10) })),
        '2',
        { keyboardType: 'number-pad' },
      )}
    </View>
  );

  const renderCombatEdit = () => (
    <View style={styles.cardSecondary}>
      <Text style={styles.sectionTitle}>Combat Config</Text>
      <Text style={styles.editLabel}>HP Current</Text>
      {renderTextInput(
        String(characterData.hp.current),
        (next) =>
          patchCharacter((prev) => ({
            ...prev,
            hp: { ...prev.hp, current: clamp(parseNumber(next, prev.hp.current), 0, prev.hp.max) },
          })),
        'Current HP',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>HP Max</Text>
      {renderTextInput(
        String(characterData.hp.max),
        (next) =>
          patchCharacter((prev) => {
            const max = Math.max(1, parseNumber(next, prev.hp.max));
            return {
              ...prev,
              hp: { ...prev.hp, max, current: clamp(prev.hp.current, 0, max) },
            };
          }),
        'Max HP',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Temp HP</Text>
      {renderTextInput(
        String(characterData.hp.temp),
        (next) =>
          patchCharacter((prev) => ({
            ...prev,
            hp: { ...prev.hp, temp: Math.max(0, parseNumber(next, prev.hp.temp)) },
          })),
        'Temp HP',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>AC</Text>
      {renderTextInput(
        String(characterData.ac),
        (next) => patchCharacter((prev) => ({ ...prev, ac: Math.max(0, parseNumber(next, prev.ac)) })),
        'Armor Class',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Speed</Text>
      {renderTextInput(
        String(characterData.speed),
        (next) => patchCharacter((prev) => ({ ...prev, speed: Math.max(0, parseNumber(next, prev.speed)) })),
        'Speed',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Initiative</Text>
      {renderTextInput(
        String(characterData.initiative),
        (next) => patchCharacter((prev) => ({ ...prev, initiative: parseNumber(next, prev.initiative) })),
        'Initiative',
        { keyboardType: 'number-pad' },
      )}
    </View>
  );

  const renderMagicEdit = () => {
    const slotLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
      <View style={styles.cardSecondary}>
        <Text style={styles.sectionTitle}>Magic Config</Text>
        <Text style={styles.editLabel}>Spellcasting Ability</Text>
        {renderTextInput(
          characterData.spells.spellcastingAbility,
          (next) =>
            patchCharacter((prev) => ({
              ...prev,
              spells: { ...prev.spells, spellcastingAbility: next },
            })),
          'INT / WIS / CHA',
        )}
        <Text style={styles.editLabel}>Spell Save DC</Text>
        {renderTextInput(
          String(characterData.spells.spellSaveDC),
          (next) =>
            patchCharacter((prev) => ({
              ...prev,
              spells: { ...prev.spells, spellSaveDC: Math.max(0, parseNumber(next, prev.spells.spellSaveDC)) },
            })),
          'DC',
          { keyboardType: 'number-pad' },
        )}
        <Text style={styles.editLabel}>Spell Attack Bonus</Text>
        {renderTextInput(
          String(characterData.spells.spellAttackBonus),
          (next) =>
            patchCharacter((prev) => ({
              ...prev,
              spells: { ...prev.spells, spellAttackBonus: parseNumber(next, prev.spells.spellAttackBonus) },
            })),
          'Attack Bonus',
          { keyboardType: 'number-pad' },
        )}
        <Text style={styles.editLabel}>Prepared Spells (one per line)</Text>
        {renderTextInput(
          characterData.spells.preparedSpells.join('\n'),
          (next) =>
            patchCharacter((prev) => ({
              ...prev,
              spells: { ...prev.spells, preparedSpells: parseLines(next) },
            })),
          'Magic Missile',
          { multiline: true },
        )}
        <Text style={styles.editLabel}>Known Spells (one per line)</Text>
        {renderTextInput(
          characterData.spells.knownSpells.join('\n'),
          (next) =>
            patchCharacter((prev) => ({
              ...prev,
              spells: { ...prev.spells, knownSpells: parseLines(next) },
            })),
          'Shield',
          { multiline: true },
        )}
        <Text style={styles.subSectionTitle}>Spell Slots</Text>
        {slotLevels.map((level) => {
          const slot = characterData.spells.spellSlots[level] || { max: 0, used: 0 };
          return (
            <View key={`slot-edit-${level}`} style={styles.slotEditRow}>
              <Text style={styles.rowLabel}>Lvl {level}</Text>
              <RNTextInput
                value={String(slot.max)}
                onChangeText={(next) =>
                  patchCharacter((prev) => ({
                    ...prev,
                    spells: {
                      ...prev.spells,
                      spellSlots: {
                        ...prev.spells.spellSlots,
                        [level]: {
                          ...prev.spells.spellSlots[level],
                          max: Math.max(0, parseNumber(next, slot.max)),
                          used: prev.spells.spellSlots[level]?.used ?? slot.used,
                        },
                      },
                    },
                  }))
                }
                keyboardType='number-pad'
                placeholder='max'
                placeholderTextColor={colors.textSecondary}
                style={styles.slotInput}
              />
              <RNTextInput
                value={String(slot.used)}
                onChangeText={(next) =>
                  patchCharacter((prev) => ({
                    ...prev,
                    spells: {
                      ...prev.spells,
                      spellSlots: {
                        ...prev.spells.spellSlots,
                        [level]: {
                          ...prev.spells.spellSlots[level],
                          max: prev.spells.spellSlots[level]?.max ?? slot.max,
                          used: Math.max(0, parseNumber(next, slot.used)),
                        },
                      },
                    },
                  }))
                }
                keyboardType='number-pad'
                placeholder='used'
                placeholderTextColor={colors.textSecondary}
                style={styles.slotInput}
              />
            </View>
          );
        })}
      </View>
    );
  };

  const renderInventoryEdit = () => (
    <View style={styles.cardSecondary}>
      <Text style={styles.sectionTitle}>Inventory Config</Text>
      <Text style={styles.editLabel}>Inventory (one item per line)</Text>
      {renderTextInput(
        characterData.inventory.join('\n'),
        (next) => patchCharacter((prev) => ({ ...prev, inventory: parseLines(next) })),
        'Rope\nTorch',
        { multiline: true },
      )}
      <Text style={styles.editLabel}>Notes</Text>
      {renderTextInput(
        characterData.notes || '',
        (next) => patchCharacter((prev) => ({ ...prev, notes: next })),
        'General notes',
        { multiline: true },
      )}
      <Text style={styles.editLabel}>Coins (GP / SP / CP)</Text>
      <View style={styles.slotEditRow}>
        <RNTextInput
          value={String(characterData.coins?.gold ?? 0)}
          onChangeText={(next) =>
            patchCharacter((prev) => ({
              ...prev,
              coins: {
                gold: Math.max(0, parseNumber(next, prev.coins?.gold ?? 0)),
                silver: prev.coins?.silver ?? 0,
                copper: prev.coins?.copper ?? 0,
              },
            }))
          }
          keyboardType='number-pad'
          placeholder='GP'
          placeholderTextColor={colors.textSecondary}
          style={styles.slotInput}
        />
        <RNTextInput
          value={String(characterData.coins?.silver ?? 0)}
          onChangeText={(next) =>
            patchCharacter((prev) => ({
              ...prev,
              coins: {
                gold: prev.coins?.gold ?? 0,
                silver: Math.max(0, parseNumber(next, prev.coins?.silver ?? 0)),
                copper: prev.coins?.copper ?? 0,
              },
            }))
          }
          keyboardType='number-pad'
          placeholder='SP'
          placeholderTextColor={colors.textSecondary}
          style={styles.slotInput}
        />
        <RNTextInput
          value={String(characterData.coins?.copper ?? 0)}
          onChangeText={(next) =>
            patchCharacter((prev) => ({
              ...prev,
              coins: {
                gold: prev.coins?.gold ?? 0,
                silver: prev.coins?.silver ?? 0,
                copper: Math.max(0, parseNumber(next, prev.coins?.copper ?? 0)),
              },
            }))
          }
          keyboardType='number-pad'
          placeholder='CP'
          placeholderTextColor={colors.textSecondary}
          style={styles.slotInput}
        />
      </View>
    </View>
  );

  const renderNotesEdit = () => (
    <View style={styles.cardSecondary}>
      <Text style={styles.sectionTitle}>Session & Story Notes</Text>
      <Text style={styles.editLabel}>Session Notes</Text>
      {renderTextInput(characterData.notesBlocks?.session || '', (next) => setNotesBlock('session', next), 'What happened this session?', {
        multiline: true,
      })}
      <Text style={styles.editLabel}>Campaign Notes</Text>
      {renderTextInput(characterData.notesBlocks?.campaign || '', (next) => setNotesBlock('campaign', next), 'Campaign context', {
        multiline: true,
      })}
      <Text style={styles.editLabel}>Goals</Text>
      {renderTextInput(characterData.notesBlocks?.goals || '', (next) => setNotesBlock('goals', next), 'Character goals', {
        multiline: true,
      })}
      <Text style={styles.editLabel}>Relationships</Text>
      {renderTextInput(
        characterData.notesBlocks?.relationships || '',
        (next) => setNotesBlock('relationships', next),
        'NPC / party relationships',
        { multiline: true },
      )}
      <Text style={styles.editLabel}>Quests</Text>
      {renderTextInput(characterData.notesBlocks?.quests || '', (next) => setNotesBlock('quests', next), 'Open quests', { multiline: true })}
    </View>
  );

  const renderHomebrewEdit = () => (
    <View style={styles.cardSecondary}>
      <Text style={styles.sectionTitle}>Homebrew Fields</Text>
      <TouchableOpacity style={styles.secondaryAction} onPress={addCustomField} activeOpacity={0.85}>
        <Text style={styles.secondaryActionText}>+ Додати custom field</Text>
      </TouchableOpacity>

      {(characterData.customFields || []).map((field) => {
        const currentTypeIndex = FIELD_TYPES.indexOf(field.type);
        const nextType = FIELD_TYPES[(currentTypeIndex + 1) % FIELD_TYPES.length];
        return (
          <View key={field.id} style={styles.editCardBlock}>
            <Text style={styles.editLabel}>Label</Text>
            {renderTextInput(field.label, (next) => updateCustomField(field.id, { label: next }), 'Field label')}

            <View style={styles.cardHeaderRow}>
              <Text style={styles.rowLabel}>Type: {field.type}</Text>
              <Pressable
                style={styles.collapseButton}
                onPress={() => updateCustomField(field.id, { type: nextType })}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.collapseButtonText}>Змінити тип</Text>
              </Pressable>
            </View>

            {field.type === 'boolean' ? (
              <Pressable
                style={styles.booleanField}
                onPress={() => updateCustomField(field.id, { value: !Boolean(field.value) })}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.blockText}>{Boolean(field.value) ? 'True' : 'False'}</Text>
              </Pressable>
            ) : (
              renderTextInput(String(field.value ?? ''), (next) => updateCustomField(field.id, { value: next }), 'Value')
            )}

            <TouchableOpacity style={styles.removeButton} onPress={() => removeCustomField(field.id)} activeOpacity={0.85}>
              <Text style={styles.removeButtonText}>Видалити поле</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <Text style={styles.sectionTitle}>Flexible Trackers</Text>
      <TouchableOpacity style={styles.secondaryAction} onPress={addTracker} activeOpacity={0.85}>
        <Text style={styles.secondaryActionText}>+ Додати tracker</Text>
      </TouchableOpacity>

      {(characterData.customTrackers || []).map((tracker) => {
        const ruleIndex = TRACKER_RULES.indexOf(tracker.resetRule);
        const nextRule = TRACKER_RULES[(ruleIndex + 1) % TRACKER_RULES.length];
        return (
          <View key={tracker.id} style={styles.editCardBlock}>
            <Text style={styles.editLabel}>Tracker Label</Text>
            {renderTextInput(tracker.label, (next) => updateTracker(tracker.id, { label: next }), 'Tracker name')}
            <Text style={styles.editLabel}>Current</Text>
            {renderTextInput(
              String(tracker.current),
              (next) => updateTracker(tracker.id, { current: Math.max(0, parseNumber(next, tracker.current)) }),
              'Current',
              { keyboardType: 'number-pad' },
            )}
            <Text style={styles.editLabel}>Max (optional)</Text>
            {renderTextInput(
              String(tracker.max ?? ''),
              (next) => {
                const parsed = next.trim() === '' ? undefined : Math.max(0, parseNumber(next, 0));
                updateTracker(tracker.id, { max: parsed });
              },
              'Max',
              { keyboardType: 'number-pad' },
            )}

            <View style={styles.cardHeaderRow}>
              <Text style={styles.rowLabel}>Reset: {tracker.resetRule}</Text>
              <Pressable
                style={styles.collapseButton}
                onPress={() => updateTracker(tracker.id, { resetRule: nextRule })}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.collapseButtonText}>Змінити reset</Text>
              </Pressable>
            </View>

            <TouchableOpacity style={styles.removeButton} onPress={() => removeTracker(tracker.id)} activeOpacity={0.85}>
              <Text style={styles.removeButtonText}>Видалити tracker</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  const renderTabContentEdit = () => {
    if (selectedTab === 'Overview') return renderOverviewEdit();
    if (selectedTab === 'Combat') return renderCombatEdit();
    if (selectedTab === 'Magic') return renderMagicEdit();
    if (selectedTab === 'Inventory') return renderInventoryEdit();
    if (selectedTab === 'Notes') return renderNotesEdit();
    return renderHomebrewEdit();
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            {characterData.photoUri ? (
              <Image source={{ uri: characterData.photoUri }} style={styles.characterPhoto} />
            ) : (
              <View style={styles.placeholderPhoto}>
                <MaterialCommunityIcons name='account-outline' size={30} color={colors.textSecondary} />
              </View>
            )}

            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.characterName}>{characterData.name || 'Без імені'}</Text>
                <CharacterMenu character={characterData} onChange={(next) => setCharacterData(ensureCharacterDefaults(next))} />
              </View>
              <Text style={styles.characterMeta}>
                {characterData.class || 'Class'} / {characterData.race || 'Race'} / Lv.{characterData.level}
              </Text>
              <View style={styles.badgesRow}>{syncBadges.map((badge) => renderBadge(badge.label, badge.kind))}</View>
            </View>
          </View>

          <View style={styles.modeRow}>
            <View style={styles.modeSwitch}>
              <Pressable
                style={[styles.modeButton, mode === 'play' ? styles.modeButtonActive : null]}
                onPress={() => setMode('play')}
                android_ripple={{ color: '#999' }}
              >
                <Text style={[styles.modeButtonText, mode === 'play' ? styles.modeButtonTextActive : null]}>Play Mode</Text>
              </Pressable>
              <Pressable
                style={[styles.modeButton, mode === 'edit' ? styles.modeButtonActive : null]}
                onPress={() => setMode('edit')}
                android_ripple={{ color: '#999' }}
              >
                <Text style={[styles.modeButtonText, mode === 'edit' ? styles.modeButtonTextActive : null]}>Edit Mode</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.sessionToggle, characterData.sessionMode ? styles.sessionToggleActive : null]}
              onPress={() => patchCharacter((prev) => ({ ...prev, sessionMode: !prev.sessionMode }))}
              android_ripple={{ color: '#999' }}
            >
              <Text style={[styles.sessionToggleText, characterData.sessionMode ? styles.sessionToggleTextActive : null]}>Session Mode</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.combatSummaryCard}>
          <Text style={styles.summaryTitle}>Combat Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryTileWide}>
              <Text style={styles.summaryLabel}>HP</Text>
              <Text style={styles.summaryValue}>
                {characterData.hp.current}/{characterData.hp.max}
              </Text>
              <Text style={styles.summarySubValue}>Temp {characterData.hp.temp}</Text>
              <View style={styles.hpBarBase}>
                <View style={[styles.hpBarFill, { width: `${clamp(hpPercent, 0, 100)}%` }]} />
              </View>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>AC</Text>
              <Text style={styles.summaryValue}>{characterData.ac}</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>Speed</Text>
              <Text style={styles.summaryValue}>{characterData.speed}</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>Initiative</Text>
              <Text style={styles.summaryValue}>
                {characterData.initiative >= 0 ? `+${characterData.initiative}` : characterData.initiative}
              </Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>Prof.</Text>
              <Text style={styles.summaryValue}>+{proficiency}</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>Spell DC</Text>
              <Text style={styles.summaryValue}>{characterData.spells.spellSaveDC || 0}</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>Passive Perception</Text>
              <Text style={styles.summaryValue}>{passivePerception}</Text>
            </View>
          </View>
        </View>

        {mode === 'play' && (
          <View style={styles.quickActionsWrapper}>
            <Text style={styles.sectionTitle}>Quick Action Bar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
              {quickActions.map((action) => (
                <Pressable key={action.id} style={styles.quickActionButton} onPress={action.onPress} android_ripple={{ color: '#999' }}>
                  <MaterialCommunityIcons name={action.icon as never} size={18} color={colors.text} />
                  <Text style={styles.quickActionText}>{action.label}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.quickActionButton} onPress={openHpModal} android_ripple={{ color: '#999' }}>
                <MaterialCommunityIcons name='heart-cog-outline' size={18} color={colors.text} />
                <Text style={styles.quickActionText}>HP</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        <View style={styles.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {TAB_ORDER.map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tabChip, selectedTab === tab ? styles.tabChipActive : null]}
                onPress={() => openTab(tab)}
                android_ripple={{ color: '#999' }}
              >
                <Text style={[styles.tabChipText, selectedTab === tab ? styles.tabChipTextActive : null]}>{tab}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.tabContent}>{mode === 'play' ? renderTabContentPlay() : renderTabContentEdit()}</View>
      </ScrollView>

      <Modal isVisible={isHpModalVisible} onClose={() => setIsHpModalVisible(false)} onSubmit={saveHpModal} title='HP'>
        <Text style={styles.modalLabel}>Current HP</Text>
        <RNTextInput
          value={tempCurrentHp}
          onChangeText={setTempCurrentHp}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder='Current'
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={styles.modalLabel}>Max HP</Text>
        <RNTextInput
          value={tempMaxHp}
          onChangeText={setTempMaxHp}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder='Max'
          placeholderTextColor={colors.textSecondary}
        />
      </Modal>

      <Modal isVisible={isTempHpModalVisible} onClose={() => setIsTempHpModalVisible(false)} onSubmit={saveTempHp} title='Temp HP'>
        <Text style={styles.modalLabel}>Temp HP value</Text>
        <RNTextInput
          value={tempShieldInput}
          onChangeText={setTempShieldInput}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder='0'
          placeholderTextColor={colors.textSecondary}
        />
      </Modal>

      <Modal isVisible={isDiceModalVisible} onClose={() => setIsDiceModalVisible(false)} title='Roll'>
        <DiceRoller />
      </Modal>

      <Modal isVisible={isConditionModalVisible} onClose={() => setIsConditionModalVisible(false)} onSubmit={addCondition} title='Add Condition'>
        <Text style={styles.modalLabel}>Condition</Text>
        <RNTextInput
          value={conditionInput}
          onChangeText={setConditionInput}
          style={styles.modalInput}
          placeholder='Poisoned'
          placeholderTextColor={colors.textSecondary}
        />
      </Modal>

      <Modal isVisible={isQuickNoteModalVisible} onClose={() => setIsQuickNoteModalVisible(false)} onSubmit={addQuickSessionNote} title='Quick Note'>
        <Text style={styles.modalLabel}>Session note</Text>
        <RNTextInput
          value={quickNoteInput}
          onChangeText={setQuickNoteInput}
          style={[styles.modalInput, styles.modalInputMultiline]}
          placeholder='Write quick note...'
          placeholderTextColor={colors.textSecondary}
          multiline
        />
      </Modal>

      <Modal isVisible={isRestModalVisible} onClose={() => setIsRestModalVisible(false)} title='Rest'>
        {restStep === 'choose' && (
          <>
            <TouchableOpacity onPress={() => setRestStep('short')} style={styles.restButton}>
              <Text style={styles.restButtonText}>Short Rest</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={applyLongRest} style={styles.restButton}>
              <Text style={styles.restButtonText}>Long Rest</Text>
            </TouchableOpacity>
          </>
        )}
        {restStep === 'short' && (
          <>
            <Text style={styles.modalLabel}>Available hit dice: {characterData.hitDice}</Text>
            <RNTextInput
              value={shortRestDice}
              onChangeText={setShortRestDice}
              keyboardType='number-pad'
              style={styles.modalInput}
              placeholder='1'
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={startShortRestRoll} style={styles.restButton}>
              <Text style={styles.restButtonText}>Roll Hit Dice</Text>
            </TouchableOpacity>
          </>
        )}
        {restStep === 'roll' && (
          <>
            <Text style={styles.modalLabel}>
              Roll {rollResults.length + 1} of {rollsNeeded}
            </Text>
            <Dice sides={diceSides} onRoll={(value: number) => setRollResults((prev) => (prev.length < rollsNeeded ? [...prev, value] : prev))} />
            {rollResults.length >= rollsNeeded && (
              <TouchableOpacity onPress={applyShortRestRolls} style={styles.restButton}>
                <Text style={styles.restButtonText}>Apply Rest</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </Modal>
    </View>
  );
}
