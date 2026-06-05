import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { View, Text, Pressable, TextInput as RNTextInput } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getStyles } from '../style';
import useThemeStore from '@/context/Theme-store';
import type {
  CharacterCustomField,
  CharacterCustomNotesGroup,
  CharacterCustomResource,
  CharacterViewModel,
  CharacterHomebrewEntry,
  CustomFieldType,
  SkillProficiencyRank,
  TrackerResetRule,
} from '@/types/Character';
import useCharacterStore, {
  selectActiveCharacter,
  selectCharacterStoreActions,
  selectCharacterStoreBasics,
} from '@/context/Character-store';
import { calculateModifier } from '@/shared/helpers/calculateModifier';
import { parseDice } from '@/shared/helpers/dice';
import { computeSkillBonus, skillKeys } from '@/shared/helpers/derived';
import type { CharacterActorRole, CharacterChangeHistoryEntry } from '@/repositories/characterCloudRepository';
import type { CharacterSheet } from '@/repositories/characterCloudRepository';
import { fetchCharacterSheet, subscribeCharacterSheet } from '@/repositories/characterCloudRepository';
import { fbAuth } from '@/services/firebase';
import useSyncStore, { selectSyncByCharacterId, selectSyncStoreActions } from '@/context/Sync-store';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import { trackProductEvent } from '@/shared/services/telemetry/productTelemetry';
import { appendQuickSessionNote, isHomebrewCharacter } from '@/shared/helpers/homebrew';
import { parseCharacter } from '@/domain/schemas';
import useTrackerTemplateStore, { SYSTEM_RESOURCE_TEMPLATES } from '@/context/TrackerTemplates-store';
import useAppRoleStore from '@/context/AppRole-store';
import {
  getChangeSourceLabel,
  getShareDisplayStatus,
  getSyncDisplayStatus,
  getSyncStatusKind,
  isNetworkOnline,
  mapRoleToHistoryActor,
} from '@/shared/helpers/collaboration/status';
import { buildUploadPlan, reconcileRemoteSnapshot, resolveConflict, syncToCloud } from '@/services/characterSyncCoordinator';
import useSpellbookStore from '@/context/Spellbook-store';
import { applySpellStatus, getPreparedSpellsLimit, normalizeSpellName } from '@/domain/spellbook';
import type { SpellDamageProfile, SpellbookSpell } from '@/types/Spellbook';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { useQuickActions } from './useQuickActions';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import { getStatusToneColors } from '@/shared/styles/statusTones';
import type { DiceRollResult } from '@/shared/services/diceRoller';
import {
  applyLevelChange,
  MAX_CHARACTER_LEVEL,
  MIN_CHARACTER_LEVEL,
  type LevelChangeDraftValues,
} from './levelChange';

interface CharacterProps {
  route: {
    params: {
      character: CharacterViewModel;
    };
  };
}

type CharacterMode = 'play' | 'edit';
type CharacterTab = 'Overview' | 'Combat' | 'Magic' | 'Inventory' | 'Notes' | 'Homebrew';
type BadgeKind = 'neutral' | 'success' | 'warning' | 'accent' | 'danger';
type SyncBadge = { id: string; label: string; kind: BadgeKind };
type RollResult = { title: string; details: string[] };
type ContextRollRequest =
  | { kind: 'ability'; title: string; label: string; baseModifier: number }
  | { kind: 'saving-throw'; title: string; label: string; baseModifier: number; proficient: boolean }
  | { kind: 'skill'; title: string; label: string; baseModifier: number; rank?: SkillProficiencyRank }
  | { kind: 'weapon-attack'; weapon: NonNullable<CharacterViewModel['weapons']>[number] }
  | { kind: 'weapon-damage'; weapon: NonNullable<CharacterViewModel['weapons']>[number] }
  | { kind: 'spell-attack'; spellName: string; baseModifier: number }
  | { kind: 'spell-damage'; spellName: string; profile: SpellDamageProfile };
type LevelChangeDraftText = {
  stats: Record<keyof CharacterViewModel['stats'], string>;
  hpCurrent: string;
  hpMax: string;
  ac: string;
  initiative: string;
  proficiencyBonus: string;
};

const TAB_ORDER: CharacterTab[] = ['Overview', 'Combat', 'Magic', 'Inventory', 'Notes', 'Homebrew'];
const TAB_LABELS: Record<CharacterTab, string> = {
  Overview: 'Огляд',
  Combat: 'Бій',
  Magic: 'Магія',
  Inventory: 'Інвентар',
  Notes: 'Нотатки',
  Homebrew: 'Homebrew',
};
const TAB_PATH_PREFIX: Record<CharacterTab, string> = {
  Overview: 'overview.',
  Combat: 'combat.',
  Magic: 'magic.',
  Inventory: 'inventory.',
  Notes: 'homebrew.notes-groups',
  Homebrew: 'homebrew.',
};
const TAB_DEFAULT_PATH: Record<CharacterTab, string> = {
  Overview: 'overview.identity',
  Combat: 'combat.core',
  Magic: 'magic.core',
  Inventory: 'inventory.core',
  Notes: 'homebrew.notes-groups',
  Homebrew: 'homebrew.fields',
};
const TRACKER_RULES: TrackerResetRule[] = ['none', 'short-rest', 'long-rest', 'session'];
const FIELD_TYPES: CustomFieldType[] = ['text', 'number', 'boolean', 'select'];

const STAT_LABELS: Array<{ key: keyof CharacterViewModel['stats']; label: string }> = [
  { key: 'strength', label: 'STR' },
  { key: 'dexterity', label: 'DEX' },
  { key: 'constitution', label: 'CON' },
  { key: 'intelligence', label: 'INT' },
  { key: 'wisdom', label: 'WIS' },
  { key: 'charisma', label: 'CHA' },
];

const SAVE_LABELS: Record<keyof CharacterViewModel['savingThrows'], string> = {
  strength: 'Сила',
  dexterity: 'Спритність',
  constitution: 'Статура',
  intelligence: 'Інтелект',
  wisdom: 'Мудрість',
  charisma: 'Харизма',
};

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
const MAGIC_STATUS_LABELS: Record<'available' | 'known' | 'prepared' | 'cantrip', string> = {
  available: 'доступне',
  known: 'відоме',
  prepared: 'підготовлене',
  cantrip: 'каніпс',
};

const SKILL_RANK_LABELS: Record<SkillProficiencyRank, string> = {
  none: 'Без майст.',
  half: '1/2 майст.',
  proficient: 'Майст.',
  expertise: 'Експертиза',
};

const CONDITION_HINTS: Record<string, string> = {
  blinded: 'Не бачить. Атаки по ньому з перевагою, його атаки з перешкодою.',
  charmed: 'Не може атакувати того, хто зачарував; той має перевагу на соціальні перевірки.',
  deafened: 'Не чує й автоматично провалює перевірки, що потребують слуху.',
  frightened: 'Перешкода на перевірки та атаки, поки джерело страху видно.',
  grappled: 'Швидкість стає 0.',
  incapacitated: 'Не може виконувати дії або реакції.',
  invisible: 'Атаки невидимого з перевагою; атаки по ньому з перешкодою.',
  paralyzed: 'Недієздатний, не рухається; ближні влучання стають критичними.',
  petrified: 'Скам’янілий, недієздатний, має опір більшості шкоди.',
  poisoned: 'Перешкода на атаки та перевірки характеристик.',
  prone: 'Перешкода на атаки; ближні атаки по цілі з перевагою.',
  restrained: 'Швидкість 0, атаки по цілі з перевагою, її атаки з перешкодою.',
  stunned: 'Недієздатний, не рухається, ледве говорить.',
  unconscious: 'Недієздатний, падає, ближні влучання стають критичними.',
  exhausted: 'Застосуй поточний рівень виснаження.',
  отруєний: 'Перешкода на атаки та перевірки характеристик.',
  збитий: 'Перешкода на атаки; ближні атаки по цілі з перевагою.',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseModalNumber(value: string, fallback = 0): number {
  if (String(value || '').trim() === '') return fallback;
  return parseNumber(value, fallback);
}

function formatSignedModifier(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function formatBonus(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function normalizeConditionKey(value: string): string {
  return value.trim().toLowerCase();
}

function getConditionHint(value: string): string | undefined {
  return CONDITION_HINTS[normalizeConditionKey(value)];
}

function getNextSkillRank(rank: SkillProficiencyRank | undefined): SkillProficiencyRank {
  if (!rank || rank === 'none') return 'half';
  if (rank === 'half') return 'proficient';
  if (rank === 'proficient') return 'expertise';
  return 'none';
}

function parseLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildLevelChangeDraftText(character: CharacterViewModel, fallbackProficiency: number): LevelChangeDraftText {
  return {
    stats: {
      strength: String(character.stats.strength ?? 10),
      dexterity: String(character.stats.dexterity ?? 10),
      constitution: String(character.stats.constitution ?? 10),
      intelligence: String(character.stats.intelligence ?? 10),
      wisdom: String(character.stats.wisdom ?? 10),
      charisma: String(character.stats.charisma ?? 10),
    },
    hpCurrent: String(character.hp.current ?? 0),
    hpMax: String(character.hp.max ?? 1),
    ac: String(character.ac ?? 0),
    initiative: String(character.initiative ?? 0),
    proficiencyBonus: String(character.proficiencyBonus ?? fallbackProficiency),
  };
}

function buildDiceRollResultDetails(result: DiceRollResult): string[] {
  const details = [`Формула: ${result.formula}`];
  if (result.mode === 'advantage' || result.mode === 'disadvantage') {
    details.push(`Кидки: ${result.rolls.join(' / ')}`);
    details.push(`Використано: ${result.usedRoll}`);
  } else {
    details.push(`Куби: [${result.rolls.join(', ')}]`);
  }
  details.push(`Модифікатор: ${formatSignedModifier(result.modifier)}`);
  if (result.proficiencyBonus) details.push(`Майстерність: ${formatSignedModifier(result.proficiencyBonus)}`);
  details.push(`Разом: ${result.total}`);
  if (result.isCriticalSuccess) details.push('Критичний успіх');
  if (result.isCriticalFailure) details.push('Критичний провал');
  return details;
}

function buildProficiencyByLevel(level: number): number {
  const safeLevel = clamp(level || 1, 1, 20);
  return 2 + Math.floor((safeLevel - 1) / 4);
}

function getResourceResetValue(resource: CharacterCustomResource): number {
  if (typeof resource.max === 'number') return resource.max;
  return 0;
}

function ensureCharacterDefaults(character: CharacterViewModel): CharacterViewModel {
  const normalized = parseCharacter(character);
  if (normalized.proficiencyBonus === undefined || normalized.proficiencyBonus === null) {
    return { ...normalized, proficiencyBonus: buildProficiencyByLevel(normalized.level) };
  }
  return normalized;
}

function sanitizeChangeHistory(value: unknown): CharacterChangeHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry): CharacterChangeHistoryEntry | null => {
      if (!entry || typeof entry !== 'object') return null;
      const cast = entry as Record<string, unknown>;
      const tab = String(cast.tab || 'Overview') as CharacterTab;
      if (!TAB_ORDER.includes(tab)) return null;
      const actorRole: CharacterActorRole | undefined =
        cast.actorRole === 'DM' || cast.actorRole === 'Player' ? cast.actorRole : undefined;
      return {
        id: String(cast.id || ''),
        uid: String(cast.uid || ''),
        actorRole,
        tab,
        paths: Array.isArray(cast.paths) ? cast.paths.map((item) => String(item)) : [],
        summary: typeof cast.summary === 'string' ? cast.summary : undefined,
        atMs: Number(cast.atMs || 0),
      };
    })
    .filter((entry): entry is CharacterChangeHistoryEntry => Boolean(entry && entry.id && entry.uid && entry.tab));
}

export function useCharacterActions({ route }: Partial<CharacterProps> & { route?: CharacterProps['route'] }) {
  const navigation = useNavigation<StackNavigationProp<TabStackParamList, 'Character'>>();
  const fallbackFromStore = useCharacterStore(selectActiveCharacter);
  const { lastSessionCharacterId } = useCharacterStore(useShallow(selectCharacterStoreBasics));
  const { setLastSessionCharacterId, updateCharacter } = useCharacterStore(useShallow(selectCharacterStoreActions));

  const routeCharacter = route?.params?.character;
  const isCharacterMissing = !routeCharacter && !fallbackFromStore;
  const baseCharacter = routeCharacter || fallbackFromStore || createEmptyCharacter({ id: 'missing-character' });
  const syncCharacterId = routeCharacter?.id || fallbackFromStore?.id || null;

  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [characterData, setCharacterData] = useState<CharacterViewModel>(ensureCharacterDefaults(baseCharacter));
  const characterDataRef = useRef<CharacterViewModel>(ensureCharacterDefaults(baseCharacter));
  useEffect(() => {
    characterDataRef.current = characterData;
  }, [characterData]);
  const [mode, setMode] = useState<CharacterMode>('play');
  const [selectedTab, setSelectedTab] = useState<CharacterTab>('Overview');
  const [isCloudDoc, setIsCloudDoc] = useState<boolean>(false);
  const [isSharedSheet, setIsSharedSheet] = useState<boolean>(false);
  const [isOwnedByMe, setIsOwnedByMe] = useState<boolean>(true);
  const [syncFeedback, setSyncFeedback] = useState<string>('Очікування локальних змін');
  const currentSync = useSyncStore(selectSyncByCharacterId(syncCharacterId));
  const {
    loadSyncMeta,
    ensureCharacterSync,
    setCloudAvailability,
    markLocalDraftPaths,
    markCloudUploaded,
    markCloudDownloaded,
    markConflict,
    clearConflicts,
    setSyncTransport,
    markSyncError,
  } = useSyncStore(useShallow(selectSyncStoreActions));
  const roleMode = useAppRoleStore((s) => s.role);
  const userTemplates = useTrackerTemplateStore((s) => s.userTemplates);
  const loadUserTemplates = useTrackerTemplateStore((s) => s.loadUserTemplates);
  const addUserTemplateFromResource = useTrackerTemplateStore((s) => s.addUserTemplateFromResource);
  const removeUserTemplate = useTrackerTemplateStore((s) => s.removeUserTemplate);
  const loadSpellbook = useSpellbookStore((s) => s.loadSpellbook);
  const upsertCustomSpell = useSpellbookStore((s) => s.upsertCustomSpell);
  const spellbookSpells = useSpellbookStore((s) => s.spells);
  const [sharedHistory, setSharedHistory] = useState<CharacterChangeHistoryEntry[]>([]);
  const netInfo = useNetInfo();
  const isOnline = isNetworkOnline(netInfo.isConnected);

  const [isHpModalVisible, setIsHpModalVisible] = useState(false);
  const [tempCurrentHp, setTempCurrentHp] = useState('0');
  const [tempMaxHp, setTempMaxHp] = useState('0');

  const [isTempHpModalVisible, setIsTempHpModalVisible] = useState(false);
  const [tempShieldInput, setTempShieldInput] = useState('0');

  const [isDiceModalVisible, setIsDiceModalVisible] = useState(false);
  const [abilityRollResult, setAbilityRollResult] = useState<RollResult | null>(null);
  const [weaponRollResult, setWeaponRollResult] = useState<RollResult | null>(null);
  const [contextRollRequest, setContextRollRequest] = useState<ContextRollRequest | null>(null);
  const [spellRollResult, setSpellRollResult] = useState<RollResult | null>(null);
  const [isLevelChangeModalVisible, setIsLevelChangeModalVisible] = useState(false);
  const [levelChangeTarget, setLevelChangeTarget] = useState<number>(
    clamp(Number(baseCharacter.level) || MIN_CHARACTER_LEVEL, MIN_CHARACTER_LEVEL, MAX_CHARACTER_LEVEL),
  );
  const [levelChangeDraftText, setLevelChangeDraftText] = useState<LevelChangeDraftText>(
    buildLevelChangeDraftText(ensureCharacterDefaults(baseCharacter), buildProficiencyByLevel(baseCharacter.level)),
  );
  const [isRestModalVisible, setIsRestModalVisible] = useState(false);
  const [restStep, setRestStep] = useState<'choose' | 'roll'>('choose');
  const [rollsNeeded, setRollsNeeded] = useState(0);
  const [rollResults, setRollResults] = useState<number[]>([]);
  const [diceSides, setDiceSides] = useState(0);

  const [isConditionModalVisible, setIsConditionModalVisible] = useState(false);
  const [conditionInput, setConditionInput] = useState('');

  const [isQuickNoteModalVisible, setIsQuickNoteModalVisible] = useState(false);
  const [quickNoteInput, setQuickNoteInput] = useState('');
  const [quickSpellName, setQuickSpellName] = useState('');
  const [quickSpellLevel, setQuickSpellLevel] = useState('1');
  const [quickSpellSearch, setQuickSpellSearch] = useState('');
  const [isSpellQuickModalVisible, setIsSpellQuickModalVisible] = useState(false);
  const [preparedSpellsDraft, setPreparedSpellsDraft] = useState('');
  const [knownSpellsDraft, setKnownSpellsDraft] = useState('');
  const [cantripsDraft, setCantripsDraft] = useState('');
  const [isPreparedSpellsDraftFocused, setIsPreparedSpellsDraftFocused] = useState(false);
  const [isKnownSpellsDraftFocused, setIsKnownSpellsDraftFocused] = useState(false);
  const [isCantripsDraftFocused, setIsCantripsDraftFocused] = useState(false);

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

  const currentLevel = clamp(Number(characterData.level) || MIN_CHARACTER_LEVEL, MIN_CHARACTER_LEVEL, MAX_CHARACTER_LEVEL);
  const canIncreaseLevel = currentLevel < MAX_CHARACTER_LEVEL;
  const canDecreaseLevel = currentLevel > MIN_CHARACTER_LEVEL;
  const proficiency = characterData.proficiencyBonus ?? buildProficiencyByLevel(characterData.level);
  const hasSkillMetadata = Boolean(characterData.skillProficiencies && Object.keys(characterData.skillProficiencies).length);
  const passivePerception = 10 + computeSkillBonus({
    stats: characterData.stats,
    skill: 'perception',
    rank: characterData.skillProficiencies?.perception,
    proficiencyBonus: proficiency,
    fallbackValue: characterData.skills?.perception,
  });
  const hasHomebrew = isHomebrewCharacter(characterData);
  const notesGroups = useMemo(() => {
    return (characterData.customNotesGroups || []).slice().sort((a, b) => a.order - b.order);
  }, [characterData.customNotesGroups]);
  const sessionNotes = useMemo(() => {
    const group = notesGroups.find((item) => item.id === 'seed-session' || ['session', 'сесія'].includes(item.title.toLowerCase()));
    return group?.content?.trim() || '';
  }, [notesGroups]);
  const magicCombatSpells = useMemo(() => {
    const normalizedPrepared = new Set((characterData.spells.preparedSpells || []).map((entry) => normalizeSpellName(entry)));
    const normalizedCantrips = new Set((characterData.spells.cantrips || []).map((entry) => normalizeSpellName(entry)));
    const normalizedKnown = new Set((characterData.spells.knownSpells || []).map((entry) => normalizeSpellName(entry)));

    const spellbookByName = new Map(
      (spellbookSpells || []).map((spell) => [normalizeSpellName(spell.name), spell] as const),
    );

    const collectedNames: string[] = [];
    const seen = new Set<string>();
    [...(characterData.spells.preparedSpells || []), ...(characterData.spells.cantrips || []), ...(characterData.spells.knownSpells || [])]
      .map((entry) => String(entry || '').trim())
      .filter(Boolean)
      .forEach((entry) => {
        const key = normalizeSpellName(entry);
        if (!key || seen.has(key)) return;
        seen.add(key);
        collectedNames.push(entry);
      });

    return collectedNames.map((name) => {
      const key = normalizeSpellName(name);
      const fromSpellbook = spellbookByName.get(key);
      const status = normalizedPrepared.has(key) ? 'prepared' : normalizedCantrips.has(key) ? 'cantrip' : normalizedKnown.has(key) ? 'known' : 'available';
      return {
        key,
        name,
        status,
        damageProfiles: fromSpellbook?.damageProfiles || [],
      };
    });
  }, [
    characterData.spells.cantrips,
    characterData.spells.knownSpells,
    characterData.spells.preparedSpells,
    spellbookSpells,
  ]);
  const quickSpellCandidates = useMemo(() => {
    const filter = quickSpellSearch.trim().toLowerCase();
    return [...(spellbookSpells || [])]
      .filter((spell) => {
        if (!filter) return true;
        return spell.name.toLowerCase().includes(filter) || spell.school.toLowerCase().includes(filter);
      })
      .sort((a, b) => (a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name, 'uk')))
      .slice(0, 10);
  }, [quickSpellSearch, spellbookSpells]);
  const selectedQuickSpell = useMemo<SpellbookSpell | null>(() => {
    const key = normalizeSpellName(quickSpellName);
    if (!key) return null;
    return (spellbookSpells || []).find((spell) => normalizeSpellName(spell.name) === key) || null;
  }, [quickSpellName, spellbookSpells]);
  const preparedSpellNameSet = useMemo(() => {
    const next = new Set<string>();
    (characterData.spells.preparedSpells || []).forEach((entry) => {
      const key = normalizeSpellName(entry);
      if (!key) return;
      next.add(key);
    });
    return next;
  }, [characterData.spells.preparedSpells]);
  const preparedSpellsCount = preparedSpellNameSet.size;
  const preparedSpellsLimit = useMemo(() => getPreparedSpellsLimit(characterData), [characterData]);
  const selectedQuickSpellKey = normalizeSpellName(quickSpellName);
  const isQuickSpellAlreadyPrepared = Boolean(selectedQuickSpellKey && preparedSpellNameSet.has(selectedQuickSpellKey));
  const canAddPreparedFromQuickModal =
    preparedSpellsLimit === null || isQuickSpellAlreadyPrepared || preparedSpellsCount < preparedSpellsLimit;
  const conflictPaths = currentSync?.conflictPaths || [];
  const syncStatusLabel = useMemo(() => getSyncDisplayStatus(currentSync, netInfo.isConnected), [currentSync, netInfo.isConnected]);
  const shareStatusLabel = useMemo(
    () => getShareDisplayStatus({ isSharedSheet, role: roleMode, isOwnedByMe }),
    [isOwnedByMe, isSharedSheet, roleMode],
  );

  useEffect(() => {
    if (isCharacterMissing) return;
    if (currentSync?.status === 'conflict') {
      trackProductEvent('sync_conflict_detected', {
        characterId: baseCharacter.id,
        paths: currentSync.conflictPaths,
      });
    }
  }, [baseCharacter.id, currentSync?.conflictPaths, currentSync?.status, isCharacterMissing]);

  useEffect(() => {
    setCharacterData(ensureCharacterDefaults(baseCharacter));
  }, [baseCharacter.id]);

  useEffect(() => {
    if (isPreparedSpellsDraftFocused) return;
    setPreparedSpellsDraft(characterData.spells.preparedSpells.join('\n'));
  }, [characterData.spells.preparedSpells, isPreparedSpellsDraftFocused]);

  useEffect(() => {
    if (isKnownSpellsDraftFocused) return;
    setKnownSpellsDraft(characterData.spells.knownSpells.join('\n'));
  }, [characterData.spells.knownSpells, isKnownSpellsDraftFocused]);

  useEffect(() => {
    if (isCantripsDraftFocused) return;
    setCantripsDraft(characterData.spells.cantrips.join('\n'));
  }, [characterData.spells.cantrips, isCantripsDraftFocused]);

  useEffect(() => {
    loadSyncMeta().catch((_error) => {
      /* ignore sync metadata load failure */
    });
  }, [loadSyncMeta]);

  useEffect(() => {
    loadUserTemplates().catch((_error) => {
      /* ignore tracker templates load failure */
    });
  }, [loadUserTemplates]);

  useEffect(() => {
    loadSpellbook().catch((_error) => {
      /* ignore spellbook load failure */
    });
  }, [loadSpellbook]);

  useEffect(() => {
    if (isCharacterMissing) return;
    ensureCharacterSync(baseCharacter.id, false).catch((_error) => {
      /* ignore sync bootstrap failure */
    });
  }, [baseCharacter.id, ensureCharacterSync, isCharacterMissing]);

  useEffect(() => {
    if (isCharacterMissing) return;
    let alive = true;
    fetchCharacterSheet(baseCharacter.id)
      .then((doc) => {
        if (!alive) return;
        const exists = Boolean(doc);
        const { owners, ownerUid, editors } = getSheetOwners(doc);
        const me = fbAuth.currentUser?.uid || '';
        const owned = Boolean(me && (ownerUid === me || owners.includes(me)));
        setIsCloudDoc(exists);
        setIsOwnedByMe(owned);
        setIsSharedSheet(Boolean(doc && editors.length > 0));
        setSharedHistory(sanitizeChangeHistory(doc?.changeHistory));
        setSyncFeedback(exists ? 'Підключено хмарний документ' : 'Лише локальний персонаж');
        setCloudAvailability(baseCharacter.id, exists).catch((_error) => {
          /* ignore cloud availability update failure */
        });
      })
      .catch((_error) => {
        if (!alive) return;
        setIsCloudDoc(false);
        setIsOwnedByMe(true);
        setIsSharedSheet(false);
        setSharedHistory([]);
        setSyncFeedback('Лише локальний персонаж');
        setCloudAvailability(baseCharacter.id, false).catch((_nestedError) => {
          /* ignore cloud availability rollback failure */
        });
      });

    const unsubscribe = subscribeCharacterSheet(baseCharacter.id, (doc) => {
      const exists = Boolean(doc);
      const { owners, ownerUid, editors } = getSheetOwners(doc);
      const me = fbAuth.currentUser?.uid || '';
      const owned = Boolean(me && (ownerUid === me || owners.includes(me)));
      setIsCloudDoc(exists);
      setIsOwnedByMe(owned);
      setIsSharedSheet(Boolean(doc && editors.length > 0));
      const history = sanitizeChangeHistory(doc?.changeHistory);
      setSharedHistory(history);
      setSyncFeedback(exists ? 'Підключено хмарний документ' : 'Лише локальний персонаж');
      setCloudAvailability(baseCharacter.id, exists).catch((_error) => {
        /* ignore cloud availability update failure */
      });

      const syncState = useSyncStore.getState().syncByCharacter[baseCharacter.id];
      if (!exists) return;

      const remoteDto = ensureCharacterDefaults(mapCloudCharacterToLocalDto(doc as Record<string, unknown>));
      const remotePathsSinceLastSync = history
        .filter((entry) => entry.uid && entry.uid !== me)
        .filter((entry) => (syncState?.lastSyncAt || 0) === 0 || entry.atMs > (syncState?.lastSyncAt || 0))
        .flatMap((entry) => entry.paths || []);

      const reconciled = reconcileRemoteSnapshot({
        syncState,
        localCharacter: characterDataRef.current,
        remoteCharacter: remoteDto,
        remotePathsSinceLastSync,
        normalizeCharacter: ensureCharacterDefaults,
      });

      if (reconciled.action === 'conflict') {
        markConflict(baseCharacter.id, reconciled.conflictPaths).catch((_error) => {
          /* ignore conflict mark failure */
        });
        setSyncFeedback('Виявлено конфлікт. Потрібна перевірка.');
        return;
      }

      if (reconciled.action === 'merge') {
        setCharacterData(reconciled.character);
        setSyncFeedback('Злиття секції з хмари застосовано');
        return;
      }

      if (reconciled.action === 'replace') {
        setCharacterData(reconciled.character);
        void updateCharacter(reconciled.character.id, reconciled.character);
        markCloudDownloaded(reconciled.character.id).catch((_error) => {
          /* ignore cloud download marker failure */
        });
        setSyncFeedback('Завантажено останню хмарну ревізію');
        if (reconciled.remotePathsSinceLastSync.length) {
          setSyncTransport(reconciled.character.id, 'downloading', 'Завантажено останню хмарну ревізію').catch((_error) => {
            /* ignore sync transport update failure */
          });
        }
      }
    });

    return () => {
      alive = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [baseCharacter.id, isCharacterMissing, markCloudDownloaded, markConflict, setCloudAvailability, setSyncTransport, updateCharacter]);

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

    const uploadPlan = buildUploadPlan({ syncState: currentSync });
    if (!uploadPlan.pendingCount) return;

    if (!isOnline) {
      const offlineMessage = `Офлайн-черга: ${uploadPlan.pendingCount} шлях(ів) очікує`;
      setSyncFeedback(offlineMessage);
      setSyncTransport(characterData.id, 'idle', offlineMessage).catch(() => {});
      return;
    }

    const actorRole: CharacterActorRole = mapRoleToHistoryActor(roleMode);
    setSyncFeedback('Вивантаження локальних змін...');
    const timeout = setTimeout(() => {
      void syncToCloud({
        character: characterData,
        syncState: currentSync,
        actorRole,
        syncPort: {
          ensureCharacterSync,
          setCloudAvailability,
          markCloudUploaded,
          setSyncTransport,
          markSyncError,
          markConflict,
        },
        isOnline,
        startTransportState: 'uploading',
        syncingMessage: 'Вивантаження локальних змін...',
        syncedMessage: 'Щойно автосинхронізовано',
        conflictFallbackPath: 'overview.identity',
      }).then((result) => {
        if (result.status === 'synced') {
          setSyncFeedback('Щойно автосинхронізовано');
          return;
        }

        const loweredMessage = String(result.message || '').toLowerCase();
        setSyncFeedback(
          loweredMessage.includes('network')
            ? 'Повтор після мережевої помилки...'
            : 'Помилка синхронізації. Повторіть через "Синхронізувати зараз".',
        );
      });
    }, 1200);

    return () => clearTimeout(timeout);
  }, [
    characterData,
    currentSync?.pendingPaths,
    ensureCharacterSync,
    isCloudDoc,
    isOnline,
    markCloudUploaded,
    markConflict,
    markSyncError,
    roleMode,
    setCloudAvailability,
    setSyncTransport,
  ]);

  const patchCharacter = useCallback((patcher: (prev: CharacterViewModel) => CharacterViewModel, changedPaths?: string[]) => {
    if (isCharacterMissing) return;
    setCharacterData((prev) => ensureCharacterDefaults(patcher(prev)));
    const paths = changedPaths && changedPaths.length ? changedPaths : [TAB_DEFAULT_PATH[selectedTab]];
    markLocalDraftPaths(baseCharacter.id, paths).catch((_error) => {
      /* ignore local draft mark failure */
    });
  }, [baseCharacter.id, isCharacterMissing, markLocalDraftPaths, selectedTab]);

  const openLevelChangeModal = useCallback((delta: number) => {
    const safeCurrentLevel = clamp(Number(characterData.level) || MIN_CHARACTER_LEVEL, MIN_CHARACTER_LEVEL, MAX_CHARACTER_LEVEL);
    const safeTargetLevel = clamp(safeCurrentLevel + delta, MIN_CHARACTER_LEVEL, MAX_CHARACTER_LEVEL);
    if (safeTargetLevel === safeCurrentLevel) return;

    setLevelChangeTarget(safeTargetLevel);
    setLevelChangeDraftText(
      buildLevelChangeDraftText(characterData, characterData.proficiencyBonus ?? buildProficiencyByLevel(characterData.level)),
    );
    setIsLevelChangeModalVisible(true);
  }, [characterData]);

  const cancelLevelChange = useCallback(() => {
    setIsLevelChangeModalVisible(false);
  }, []);

  const setLevelDraftField = useCallback((field: keyof Omit<LevelChangeDraftText, 'stats'>, value: string) => {
    setLevelChangeDraftText((prev) => ({ ...prev, [field]: String(value || '') }));
  }, []);

  const setLevelDraftStat = useCallback((stat: keyof CharacterViewModel['stats'], value: string) => {
    setLevelChangeDraftText((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: String(value || ''),
      },
    }));
  }, []);

  const confirmLevelChange = useCallback(() => {
    const numericDraft: LevelChangeDraftValues = {
      stats: {
        strength: parseModalNumber(levelChangeDraftText.stats.strength, characterData.stats.strength),
        dexterity: parseModalNumber(levelChangeDraftText.stats.dexterity, characterData.stats.dexterity),
        constitution: parseModalNumber(levelChangeDraftText.stats.constitution, characterData.stats.constitution),
        intelligence: parseModalNumber(levelChangeDraftText.stats.intelligence, characterData.stats.intelligence),
        wisdom: parseModalNumber(levelChangeDraftText.stats.wisdom, characterData.stats.wisdom),
        charisma: parseModalNumber(levelChangeDraftText.stats.charisma, characterData.stats.charisma),
      },
      hp: {
        current: parseModalNumber(levelChangeDraftText.hpCurrent, characterData.hp.current),
        max: parseModalNumber(levelChangeDraftText.hpMax, characterData.hp.max),
      },
      ac: parseModalNumber(levelChangeDraftText.ac, characterData.ac),
      initiative: parseModalNumber(levelChangeDraftText.initiative, characterData.initiative),
      proficiencyBonus: parseModalNumber(
        levelChangeDraftText.proficiencyBonus,
        characterData.proficiencyBonus ?? buildProficiencyByLevel(characterData.level),
      ),
    };

    const next = applyLevelChange(
      {
        level: characterData.level,
        experience: characterData.experience,
        hitDice: characterData.hitDice,
        hpTemp: characterData.hp.temp,
      },
      levelChangeTarget,
      numericDraft,
    );

    patchCharacter(
      (prev) => ({
        ...prev,
        level: next.level,
        experience: next.experience,
        hitDice: next.hitDice,
        stats: next.stats,
        hp: next.hp,
        ac: next.ac,
        initiative: next.initiative,
        proficiencyBonus: next.proficiencyBonus,
      }),
      ['overview.identity', 'combat.core', 'combat.hp'],
    );

    setIsLevelChangeModalVisible(false);
  }, [characterData, levelChangeDraftText, levelChangeTarget, patchCharacter]);

  const toggleSessionMode = useCallback(() => {
    const nextSessionMode = !characterData.sessionMode;
    patchCharacter((prev) => ({ ...prev, sessionMode: nextSessionMode }), ['overview.session-mode']);
    if (nextSessionMode) {
      void setLastSessionCharacterId(baseCharacter.id);
      return;
    }
    if (lastSessionCharacterId === baseCharacter.id) {
      void setLastSessionCharacterId(null);
    }
  }, [baseCharacter.id, characterData.sessionMode, lastSessionCharacterId, patchCharacter, setLastSessionCharacterId]);

  const setNotesGroup = useCallback((groupId: string, value: string) => {
    patchCharacter((prev) => ({
      ...prev,
      customNotesGroups: (prev.customNotesGroups || []).map((group) => {
        if (group.id !== groupId) return group;
        return { ...group, content: value };
      }),
    }), ['homebrew.notes-groups']);
  }, [patchCharacter]);

  const addNotesGroup = useCallback(() => {
    patchCharacter((prev) => {
      const nextOrder = (prev.customNotesGroups || []).length;
      const nextGroup: CharacterCustomNotesGroup = {
        id: `notes-group-${Date.now()}`,
        title: 'Власна група',
        content: '',
        order: nextOrder,
        origin: 'custom',
      };
      return {
        ...prev,
        customNotesGroups: [...(prev.customNotesGroups || []), nextGroup],
      };
    }, ['homebrew.notes-groups']);
  }, [patchCharacter]);

  const updateNotesGroupMeta = useCallback((groupId: string, patch: Partial<CharacterCustomNotesGroup>) => {
    patchCharacter((prev) => ({
      ...prev,
      customNotesGroups: (prev.customNotesGroups || []).map((group) => {
        if (group.id !== groupId) return group;
        return { ...group, ...patch };
      }),
    }), ['homebrew.notes-groups']);
  }, [patchCharacter]);

  const removeNotesGroup = useCallback((groupId: string) => {
    patchCharacter((prev) => ({
      ...prev,
      customNotesGroups: (prev.customNotesGroups || [])
        .filter((group) => group.id !== groupId)
        .map((group, index) => ({ ...group, order: index })),
    }), ['homebrew.notes-groups']);
  }, [patchCharacter]);

  const applyHpDelta = useCallback((delta: number) => {
    patchCharacter((prev) => ({
      ...prev,
      hp: {
        ...prev.hp,
        current: clamp(prev.hp.current + delta, 0, prev.hp.max),
      },
    }), ['combat.hp']);
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
    }), ['combat.hp']);

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
    }), ['combat.hp']);
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

      const nextResources = (prev.customResources || []).map((resource) => {
        if (resource.resetRule === 'long-rest' || resource.resetRule === 'short-rest') {
          return { ...resource, current: getResourceResetValue(resource) };
        }
        return resource;
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
        customResources: nextResources,
      };
    }, ['combat.rest', 'combat.hp', 'magic.slots', 'homebrew.resources']);

    setIsRestModalVisible(false);
  }, [characterData.hitDice, patchCharacter]);

  const startShortRestFlow = useCallback(() => {
    const { count, sides } = parseDice(characterData.hitDice || '0d0');
    setRollResults([]);
    setRollsNeeded(Math.max(count, 0));
    setDiceSides(Math.max(sides, 0));
    setRestStep('roll');
    setIsRestModalVisible(true);
  }, [characterData.hitDice]);

  const applyShortRestRolls = useCallback(() => {
    const { count, sides } = parseDice(characterData.hitDice || '0d0');
    const used = rollResults.length;
    const conMod = calculateModifier(characterData.stats.constitution || 10);
    const heal = rollResults.reduce((sum, result) => sum + result, 0) + conMod * used;

    patchCharacter((prev) => {
      const nextResources = (prev.customResources || []).map((resource) => {
        if (resource.resetRule === 'short-rest') {
          return { ...resource, current: getResourceResetValue(resource) };
        }
        return resource;
      });

      return {
        ...prev,
        hp: {
          ...prev.hp,
          current: clamp(prev.hp.current + heal, 0, prev.hp.max),
        },
        hitDice: `${Math.max(count - used, 0)}d${sides || 6}`,
        customResources: nextResources,
      };
    }, ['combat.rest', 'combat.hp', 'homebrew.resources']);

    setIsRestModalVisible(false);
  }, [characterData.hitDice, characterData.stats.constitution, patchCharacter, rollResults]);

  const openContextRoll = useCallback((request: ContextRollRequest) => {
    setContextRollRequest(request);
  }, []);

  const rollAbilityCheck = useCallback((label: string, baseModifier: number) => {
    openContextRoll({
      kind: 'ability',
      title: `${label} Check`,
      label,
      baseModifier,
    });
  }, [openContextRoll]);

  const rollSavingThrow = useCallback((label: string, baseModifier: number, proficient: boolean) => {
    openContextRoll({
      kind: 'saving-throw',
      title: `${label} Save`,
      label,
      baseModifier,
      proficient,
    });
  }, [openContextRoll]);

  const rollSkillCheck = useCallback((label: string, baseModifier: number, rank?: SkillProficiencyRank) => {
    openContextRoll({
      kind: 'skill',
      title: `${label} Check`,
      label,
      baseModifier,
      rank,
    });
  }, [openContextRoll]);

  const toggleSavingThrowProficiency = useCallback((stat: keyof CharacterViewModel['savingThrows']) => {
    patchCharacter(
      (prev) => ({
        ...prev,
        savingThrows: {
          ...prev.savingThrows,
          [stat]: !prev.savingThrows?.[stat],
        },
      }),
      ['overview.saving-throws'],
    );
  }, [patchCharacter]);

  const cycleSkillRank = useCallback((skill: keyof CharacterViewModel['skills']) => {
    patchCharacter(
      (prev) => {
        const currentRank = prev.skillProficiencies?.[skill] || 'none';
        const nextRank = getNextSkillRank(currentRank);
        const nextRanks = { ...(prev.skillProficiencies || {}) };

        if (nextRank === 'none') {
          delete nextRanks[skill];
        } else {
          nextRanks[skill] = nextRank;
        }

        const nextSkills = { ...prev.skills };
        nextSkills[skill] = computeSkillBonus({
          stats: prev.stats,
          skill,
          rank: nextRank === 'none' ? undefined : nextRank,
          proficiencyBonus: prev.proficiencyBonus ?? buildProficiencyByLevel(prev.level),
          fallbackValue: prev.skills?.[skill],
        });

        return {
          ...prev,
          skills: nextSkills,
          skillProficiencies: Object.keys(nextRanks).length ? nextRanks : undefined,
        };
      },
      ['overview.skills'],
    );
  }, [patchCharacter]);

  const rollWeaponAttack = useCallback((weapon: NonNullable<CharacterViewModel['weapons']>[number]) => {
    openContextRoll({ kind: 'weapon-attack', weapon });
  }, [openContextRoll]);

  const rollWeaponDamage = useCallback((weapon: NonNullable<CharacterViewModel['weapons']>[number]) => {
    openContextRoll({ kind: 'weapon-damage', weapon });
  }, [openContextRoll]);

  const closeWeaponRollModal = useCallback(() => {
    setContextRollRequest(null);
  }, []);

  const handleContextRollResult = useCallback((result: DiceRollResult) => {
    if (!contextRollRequest) return;
    const details = buildDiceRollResultDetails(result);

    if (contextRollRequest.kind === 'ability' || contextRollRequest.kind === 'saving-throw' || contextRollRequest.kind === 'skill') {
      setAbilityRollResult({
        title: contextRollRequest.title,
        details,
      });
    } else if (contextRollRequest.kind === 'weapon-attack') {
      setWeaponRollResult({
        title: `Влучення: ${contextRollRequest.weapon.name || 'Зброя'}`,
        details,
      });
      setSpellRollResult(null);
    } else if (contextRollRequest.kind === 'weapon-damage') {
      setWeaponRollResult({
        title: `Шкода: ${contextRollRequest.weapon.name || 'Зброя'}`,
        details,
      });
      setSpellRollResult(null);
    } else if (contextRollRequest.kind === 'spell-attack') {
      setSpellRollResult({
        title: `Атака закляттям: ${contextRollRequest.spellName}`,
        details,
      });
      setWeaponRollResult(null);
    } else if (contextRollRequest.kind === 'spell-damage') {
      setSpellRollResult({
        title: `Шкода закляттям: ${contextRollRequest.spellName}`,
        details: [
          `Профіль: ${contextRollRequest.profile.label}`,
          `Тип урону: ${contextRollRequest.profile.damageType}`,
          ...details,
          contextRollRequest.profile.condition ? `Умова: ${contextRollRequest.profile.condition}` : '',
        ].filter(Boolean),
      });
      setWeaponRollResult(null);
    }
  }, [contextRollRequest]);

  const rollSpellAttack = useCallback((spellName: string) => {
    const baseModifier = Number.isFinite(Number(characterData.spells.spellAttackBonus)) ? Number(characterData.spells.spellAttackBonus) : 0;
    setIsSpellQuickModalVisible(false);
    openContextRoll({ kind: 'spell-attack', spellName, baseModifier });
  }, [characterData.spells.spellAttackBonus, openContextRoll]);

  const rollSpellDamage = useCallback((spellName: string, profile: SpellDamageProfile) => {
    setIsSpellQuickModalVisible(false);
    openContextRoll({ kind: 'spell-damage', spellName, profile });
  }, [openContextRoll]);

  const addCondition = useCallback(() => {
    const value = conditionInput.trim();
    if (!value) return;

    patchCharacter((prev) => ({
      ...prev,
      conditions: [...(prev.conditions || []), value],
    }), ['overview.conditions']);

    setConditionInput('');
    setIsConditionModalVisible(false);
  }, [conditionInput, patchCharacter]);

  const removeCondition = useCallback((index: number) => {
    patchCharacter((prev) => ({
      ...prev,
      conditions: (prev.conditions || []).filter((_, idx) => idx !== index),
    }), ['overview.conditions']);
  }, [patchCharacter]);

  const addQuickSessionNote = useCallback(() => {
    const note = quickNoteInput.trim();
    if (!note) return;

    patchCharacter((prev) => appendQuickSessionNote(prev, note), ['homebrew.notes-groups']);

    setQuickNoteInput('');
    setIsQuickNoteModalVisible(false);
    setSelectedTab('Notes');
  }, [patchCharacter, quickNoteInput]);

  const addWeapon = useCallback(() => {
    patchCharacter(
      (prev) => ({
        ...prev,
        weapons: [...(prev.weapons || []), { name: 'Нова зброя', attackBonus: 0, damage: '1d6' }],
      }),
      ['combat.weapons'],
    );
  }, [patchCharacter]);

  const updateWeaponAt = useCallback(
    (index: number, patch: Partial<NonNullable<CharacterViewModel['weapons']>[number]>) => {
      patchCharacter(
        (prev) => {
          const nextWeapons = [...(prev.weapons || [])];
          const current = nextWeapons[index] || { name: '', attackBonus: 0, damage: '1d6' };
          nextWeapons[index] = { ...current, ...patch };
          return {
            ...prev,
            weapons: nextWeapons,
          };
        },
        ['combat.weapons'],
      );
    },
    [patchCharacter],
  );

  const removeWeaponAt = useCallback(
    (index: number) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          weapons: (prev.weapons || []).filter((_, weaponIndex) => weaponIndex !== index),
        }),
        ['combat.weapons'],
      );
    },
    [patchCharacter],
  );

  const openSpellQuickModal = useCallback(() => {
    setQuickSpellSearch('');
    setSpellRollResult(null);
    setIsSpellQuickModalVisible(true);
  }, []);

  const openPreparedSpellbook = useCallback(() => {
    navigation.navigate('Spellbook', {
      characterId: characterData.id,
      initialTab: 'prepared',
      mode: 'player',
    });
  }, [characterData.id, navigation]);

  const closeSpellQuickModal = useCallback(() => {
    setIsSpellQuickModalVisible(false);
    setQuickSpellSearch('');
    setSpellRollResult(null);
  }, []);

  const pickExistingSpellForQuickAdd = useCallback((spell: SpellbookSpell) => {
    setQuickSpellName(spell.name);
    setQuickSpellLevel(String(clamp(Number(spell.level) || 1, 0, 9)));
    setQuickSpellSearch(spell.name);
  }, []);

  const addSpellFromCharacter = useCallback(
    (status: 'known' | 'prepared' | 'cantrip') => {
      const spellName = quickSpellName.trim();
      if (!spellName) return;

      const safeLevel = clamp(parseNumber(quickSpellLevel, status === 'cantrip' ? 0 : 1), 0, 9);
      const nextStatus = status;
      const spellKey = normalizeSpellName(spellName);
      const alreadyPrepared = preparedSpellNameSet.has(spellKey);

      if (nextStatus === 'prepared' && preparedSpellsLimit !== null && !alreadyPrepared && preparedSpellsCount >= preparedSpellsLimit) {
        setSpellRollResult({
          title: 'Ліміт підготовлених заклять',
          details: [
            `Підготовлено ${preparedSpellsCount}/${preparedSpellsLimit}. Приберіть одне підготовлене закляття або підвищіть рівень/характеристику.`,
          ],
        });
        return;
      }

      patchCharacter(
        (prev) => applySpellStatus(prev, spellName, nextStatus, { preparedLimit: preparedSpellsLimit }),
        [`magic.${nextStatus}`],
      );
      void upsertCustomSpell({
        name: spellName,
        level: nextStatus === 'cantrip' ? 0 : safeLevel,
        school: 'Власне',
        tags: ['character-created'],
      });

      setQuickSpellName('');
      if (nextStatus !== 'cantrip') {
        setQuickSpellLevel(String(safeLevel));
      } else {
        setQuickSpellLevel('1');
      }
      closeSpellQuickModal();
    },
    [
      closeSpellQuickModal,
      patchCharacter,
      preparedSpellNameSet,
      preparedSpellsCount,
      preparedSpellsLimit,
      quickSpellLevel,
      quickSpellName,
      upsertCustomSpell,
    ],
  );

  const commitPreparedSpellsDraft = useCallback(() => {
    patchCharacter((prev) => ({
      ...prev,
      spells: { ...prev.spells, preparedSpells: parseLines(preparedSpellsDraft) },
    }));
  }, [patchCharacter, preparedSpellsDraft]);

  const commitKnownSpellsDraft = useCallback(() => {
    patchCharacter((prev) => ({
      ...prev,
      spells: { ...prev.spells, knownSpells: parseLines(knownSpellsDraft) },
    }));
  }, [knownSpellsDraft, patchCharacter]);

  const commitCantripsDraft = useCallback(() => {
    patchCharacter((prev) => ({
      ...prev,
      spells: { ...prev.spells, cantrips: parseLines(cantripsDraft) },
    }));
  }, [cantripsDraft, patchCharacter]);

  const addCustomField = useCallback(() => {
    const newField: CharacterCustomField = {
      id: Date.now().toString(),
      label: 'Власне поле',
      type: 'text',
      value: '',
    };

    patchCharacter((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField],
    }), ['homebrew.fields']);
  }, [patchCharacter]);

  const updateCustomField = useCallback((fieldId: string, patch: Partial<CharacterCustomField>) => {
    patchCharacter((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).map((field) => {
        if (field.id !== fieldId) return field;

        const merged = { ...field, ...patch };
        if (merged.type === 'number') {
          return { ...merged, value: parseNumber(String(merged.value ?? 0), 0) };
        }
        if (merged.type === 'boolean') {
          return { ...merged, value: Boolean(merged.value) };
        }
        if (merged.type === 'select') {
          const options = (merged.options || []).map((option) => String(option).trim()).filter(Boolean);
          const value = String(merged.value ?? '');
          return { ...merged, options, value: options.includes(value) ? value : (options[0] || '') };
        }
        return { ...merged, value: String(merged.value ?? '') };
      }),
    }), ['homebrew.fields']);
  }, [patchCharacter]);

  const removeCustomField = useCallback((fieldId: string) => {
    patchCharacter((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((field) => field.id !== fieldId),
    }), ['homebrew.fields']);
  }, [patchCharacter]);

  const addResource = useCallback(() => {
    const resource: CharacterCustomResource = {
      id: Date.now().toString(),
      label: 'Власний ресурс',
      current: 0,
      max: 10,
      resetRule: 'none',
    };

    patchCharacter((prev) => ({
      ...prev,
      customResources: [...(prev.customResources || []), resource],
    }), ['homebrew.resources']);
  }, [patchCharacter]);

  const updateResource = useCallback((resourceId: string, patch: Partial<CharacterCustomResource>) => {
    patchCharacter((prev) => ({
      ...prev,
      customResources: (prev.customResources || []).map((resource) => {
        if (resource.id !== resourceId) return resource;
        return { ...resource, ...patch };
      }),
    }), ['homebrew.resources']);
  }, [patchCharacter]);

  const removeResource = useCallback((resourceId: string) => {
    patchCharacter((prev) => ({
      ...prev,
      customResources: (prev.customResources || []).filter((resource) => resource.id !== resourceId),
    }), ['homebrew.resources']);
  }, [patchCharacter]);

  const saveUserTemplateFromResource = useCallback((resource: CharacterCustomResource) => {
    addUserTemplateFromResource(resource, resource.label).catch(() => {});
  }, [addUserTemplateFromResource]);

  const applyResourceTemplate = useCallback((resource: Omit<CharacterCustomResource, 'id'>) => {
    patchCharacter((prev) => ({
      ...prev,
      customResources: [
        ...(prev.customResources || []),
        {
          ...resource,
          id: `resource-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        },
      ],
    }), ['homebrew.resources']);
  }, [patchCharacter]);

  const addCustomSection = useCallback(() => {
    patchCharacter((prev) => ({
      ...prev,
      customSections: [
        ...(prev.customSections || []),
        {
          id: `custom-section-${Date.now()}`,
          title: 'Власний розділ',
          content: '',
        },
      ],
    }), ['homebrew.sections']);
  }, [patchCharacter]);

  const updateCustomSection = useCallback((sectionId: string, patch: Partial<NonNullable<CharacterViewModel['customSections']>[number]>) => {
    patchCharacter((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).map((section) => {
        if (section.id !== sectionId) return section;
        return { ...section, ...patch };
      }),
    }), ['homebrew.sections']);
  }, [patchCharacter]);

  const removeCustomSection = useCallback((sectionId: string) => {
    patchCharacter((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).filter((section) => section.id !== sectionId),
    }), ['homebrew.sections']);
  }, [patchCharacter]);

  const addHomebrewEntry = useCallback((kind: CharacterHomebrewEntry['kind']) => {
    patchCharacter((prev) => ({
      ...prev,
      homebrewEntries: [
        ...(prev.homebrewEntries || []),
        {
          id: `homebrew-entry-${Date.now()}`,
          kind,
          name: `Власне: ${kind}`,
          description: '',
          tags: [],
        },
      ],
    }), ['homebrew.entries']);
  }, [patchCharacter]);

  const updateHomebrewEntry = useCallback((entryId: string, patch: Partial<CharacterHomebrewEntry>) => {
    patchCharacter((prev) => ({
      ...prev,
      homebrewEntries: (prev.homebrewEntries || []).map((entry) => {
        if (entry.id !== entryId) return entry;
        if (patch.tags && !Array.isArray(patch.tags)) return entry;
        return { ...entry, ...patch };
      }),
    }), ['homebrew.entries']);
  }, [patchCharacter]);

  const removeHomebrewEntry = useCallback((entryId: string) => {
    patchCharacter((prev) => ({
      ...prev,
      homebrewEntries: (prev.homebrewEntries || []).filter((entry) => entry.id !== entryId),
    }), ['homebrew.entries']);
  }, [patchCharacter]);

  const resolveConflictWithLocal = useCallback(() => {
    trackProductEvent('sync_conflict_resolved_local', { characterId: characterData.id });
    void resolveConflict({
      strategy: 'keep-local',
      character: characterData,
      syncState: currentSync,
      actorRole: mapRoleToHistoryActor(roleMode),
      syncPort: {
        ensureCharacterSync,
        setCloudAvailability,
        markCloudUploaded,
        markCloudDownloaded,
        clearConflicts,
        setSyncTransport,
        markSyncError,
        markConflict,
      },
      isOnline,
      normalizeCharacter: ensureCharacterDefaults,
    }).then((result) => {
      if (result.status === 'resolved-local') {
        setSyncFeedback('Конфлікт вирішено локальною версією');
        return;
      }
      if (result.status === 'error') {
        setSyncFeedback('Не вдалося вирішити конфлікт локальною версією');
      }
    });
  }, [
    characterData,
    clearConflicts,
    currentSync,
    ensureCharacterSync,
    isOnline,
    markCloudDownloaded,
    markCloudUploaded,
    markConflict,
    markSyncError,
    roleMode,
    setCloudAvailability,
    setSyncTransport,
  ]);

  const resolveConflictWithCloud = useCallback(() => {
    trackProductEvent('sync_conflict_resolved_cloud', { characterId: characterData.id });
    void resolveConflict({
      strategy: 'keep-cloud',
      character: characterData,
      syncState: currentSync,
      actorRole: mapRoleToHistoryActor(roleMode),
      syncPort: {
        ensureCharacterSync,
        setCloudAvailability,
        markCloudUploaded,
        markCloudDownloaded,
        clearConflicts,
        setSyncTransport,
        markSyncError,
      },
      isOnline,
      normalizeCharacter: ensureCharacterDefaults,
    }).then((result) => {
      if (result.status === 'resolved-cloud') {
        setCharacterData(result.targetCharacter);
        void updateCharacter(result.targetCharacter.id, result.targetCharacter);
        setSyncFeedback('Конфлікт вирішено хмарною версією');
      }
    });
  }, [
    characterData,
    clearConflicts,
    currentSync,
    ensureCharacterSync,
    isOnline,
    markCloudDownloaded,
    markCloudUploaded,
    markSyncError,
    roleMode,
    setCloudAvailability,
    setSyncTransport,
    updateCharacter,
  ]);

  const resolveConflictManual = useCallback(() => {
    trackProductEvent('sync_conflict_resolved_later', { characterId: characterData.id });
    void resolveConflict({
      strategy: 'later',
      character: characterData,
      syncState: currentSync,
      actorRole: mapRoleToHistoryActor(roleMode),
      syncPort: {
        ensureCharacterSync,
        setCloudAvailability,
        markCloudUploaded,
        markCloudDownloaded,
        clearConflicts,
        setSyncTransport,
        markSyncError,
      },
      isOnline,
      normalizeCharacter: ensureCharacterDefaults,
    }).then(() => {
      setSyncFeedback('Конфлікт знято. Ручну перевірку відкладено.');
    });
  }, [
    characterData,
    clearConflicts,
    currentSync,
    ensureCharacterSync,
    isOnline,
    markCloudDownloaded,
    markCloudUploaded,
    markSyncError,
    roleMode,
    setCloudAvailability,
    setSyncTransport,
  ]);

  const syncNow = useCallback(() => {
    if (!fbAuth.currentUser) {
      setSyncFeedback('Для синхронізації з хмарою потрібен вхід');
      return;
    }
    if (!isOnline) {
      setSyncFeedback('Активна офлайн-черга. Відновіть з’єднання і повторіть синхронізацію.');
      return;
    }

    const uploadPlan = buildUploadPlan({
      syncState: currentSync,
      fallbackPath: TAB_DEFAULT_PATH[selectedTab],
    });

    setSyncFeedback('Синхронізація...');
    void syncToCloud({
      character: characterData,
      syncState: currentSync,
      actorRole: mapRoleToHistoryActor(roleMode),
      syncPort: {
        ensureCharacterSync,
        setCloudAvailability,
        markCloudUploaded,
        setSyncTransport,
        markSyncError,
      },
      isOnline,
      historyPaths: uploadPlan.historyPaths,
      syncingMessage: 'Синхронізація...',
      syncedMessage: 'Синхронізовано',
      conflictFallbackPath: TAB_DEFAULT_PATH[selectedTab],
    }).then((result) => {
      if (result.status === 'synced') {
        setIsCloudDoc(true);
        setSyncFeedback('Синхронізовано');
        return;
      }
      if (result.status === 'error') {
        setSyncFeedback(`Помилка синхронізації: ${result.message}`);
      }
    });
  }, [
    characterData,
    currentSync,
    ensureCharacterSync,
    isOnline,
    markCloudUploaded,
    markSyncError,
    roleMode,
    selectedTab,
    setCloudAvailability,
    setSyncTransport,
  ]);

  const quickActions = useQuickActions({
    tempHp: characterData.hp.temp,
    applyHpDelta,
    openHpModal,
    startShortRestFlow,
    applyLongRest,
    setTempShieldInput,
    setIsTempHpModalVisible,
    setIsDiceModalVisible,
    setIsConditionModalVisible,
    setIsQuickNoteModalVisible,
  });

  const sortedSkills = useMemo(() => {
    const entries = skillKeys.map((skill) => {
      const value = computeSkillBonus({
        stats: characterData.stats,
        skill,
        rank: characterData.skillProficiencies?.[skill],
        proficiencyBonus: proficiency,
        fallbackValue: characterData.skills?.[skill],
      });
      return [skill, value] as const;
    });
    return entries.sort((a, b) => b[1] - a[1]);
  }, [characterData.skillProficiencies, characterData.skills, characterData.stats, proficiency]);

  const syncBadges = useMemo(() => {
    const badges: SyncBadge[] = [];
    const seen = new Set<string>();
    const pushBadge = (label: string, kind: BadgeKind) => {
      const safeLabel = String(label || '').trim();
      if (!safeLabel) return;
      const id = `${kind}:${safeLabel.toLowerCase()}`;
      if (seen.has(id)) return;
      seen.add(id);
      badges.push({ id, label: safeLabel, kind });
    };

    pushBadge(syncStatusLabel, getSyncStatusKind(syncStatusLabel));
    if (shareStatusLabel) pushBadge(shareStatusLabel, 'accent');
    if (!isCloudDoc) pushBadge('Лише локально', 'neutral');
    if (hasHomebrew) pushBadge('Власне', 'warning');
    if (!isOnline) pushBadge('Офлайн', 'warning');
    return badges;
  }, [hasHomebrew, isCloudDoc, isOnline, shareStatusLabel, syncStatusLabel]);

  const hasConflictForPrefixes = useCallback((prefixes: string[]) => {
    if (!conflictPaths.length) return false;
    return conflictPaths.some((path) => prefixes.some((prefix) => path.startsWith(prefix)));
  }, [conflictPaths]);

  const hasConflictForTab = useCallback((tab: CharacterTab) => {
    return hasConflictForPrefixes([TAB_PATH_PREFIX[tab]]);
  }, [hasConflictForPrefixes]);

  const sectionConflictLabel = useCallback((prefixes: string[]) => {
    if (!hasConflictForPrefixes(prefixes)) return null;
    return (
      <View style={styles.sectionConflictBadge}>
        <Text style={styles.sectionConflictBadgeText}>Конфлікт</Text>
      </View>
    );
  }, [hasConflictForPrefixes, styles.sectionConflictBadge, styles.sectionConflictBadgeText]);

  const tabHistory = useMemo(() => {
    if (!isSharedSheet) return [];
    return sharedHistory
      .filter((entry) => entry.tab === selectedTab)
      .slice()
      .sort((a, b) => (b.atMs || 0) - (a.atMs || 0))
      .slice(0, 8);
  }, [isSharedSheet, selectedTab, sharedHistory]);

  const latestTabChange = tabHistory[0];
  const latestTabChangeLabel = latestTabChange
    ? getChangeSourceLabel({
        uid: latestTabChange.uid,
        actorRole: latestTabChange.actorRole,
        currentUid: fbAuth.currentUser?.uid,
      })
    : null;
  const getHistoryAuthorLabel = useCallback(
    (entry: CharacterChangeHistoryEntry) =>
      getChangeSourceLabel({
        uid: entry.uid,
        actorRole: entry.actorRole,
        currentUid: fbAuth.currentUser?.uid,
      }),
    [],
  );

  const openTab = useCallback((tab: CharacterTab) => setSelectedTab(tab), []);
  const toggleSecondary = useCallback((tab: CharacterTab) => {
    setCollapsedSecondary((prev) => ({ ...prev, [tab]: !prev[tab] }));
  }, []);

  const renderBadge = useCallback((badge: SyncBadge) => {
    const { id, label, kind } = badge;
    const tone = getStatusToneColors(colors, kind);
    const badgeStyle: Array<StyleProp<ViewStyle>> = [
      styles.badge,
      { backgroundColor: tone.background, borderColor: tone.border, borderWidth: kind === 'neutral' ? 0 : 1 },
    ];
    const badgeText: Array<StyleProp<TextStyle>> = [styles.badgeText, { color: tone.text }];

    return (
      <View key={id} style={badgeStyle}>
        <Text style={badgeText}>{label}</Text>
      </View>
    );
  }, [
    colors,
    styles.badge,
    styles.badgeText,
  ]);

  const renderConditionList = (emptyLabel: string) =>
    characterData.conditions?.length ? (
      characterData.conditions.map((condition, idx) => {
        const hint = getConditionHint(condition);
        return (
          <View key={`${condition}-${idx}`} style={styles.conditionBlock}>
            <View style={styles.conditionRow}>
              <Text style={styles.conditionText}>• {condition}</Text>
              <Pressable onPress={() => removeCondition(idx)} android_ripple={{ color: colors.ripple }}>
                <MaterialCommunityIcons name='close-circle-outline' size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            {hint ? <Text style={styles.conditionHint}>{hint}</Text> : null}
          </View>
        );
      })
    ) : (
      <Text style={styles.blockTextMuted}>{emptyLabel}</Text>
    );

  const renderOverviewPlay = () => (
    <>
      <View style={styles.cardPrimary}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Основні характеристики</Text>
          {sectionConflictLabel(['overview.identity'])}
        </View>
        <View style={styles.statGrid}>
          {STAT_LABELS.map((stat) => {
            const score = characterData.stats[stat.key] || 10;
            const mod = calculateModifier(score);
            return (
              <Pressable
                key={stat.key}
                style={styles.statTile}
                onPress={() => rollAbilityCheck(stat.label, mod)}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.statName}>{stat.label}</Text>
                <Text style={styles.statScore}>{score}</Text>
                <Text style={styles.statMod}>{mod >= 0 ? `+${mod}` : `${mod}`}</Text>
                <Text style={styles.rollHintText}>Кинути</Text>
              </Pressable>
            );
          })}
        </View>
        {!!abilityRollResult && (
          <View style={styles.editCardBlock}>
            <Text style={styles.subSectionTitle}>{abilityRollResult.title}</Text>
            {abilityRollResult.details.map((line, index) => (
              <Text key={`${abilityRollResult.title}-${index}`} style={styles.weaponRollResultLine}>
                {line}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.cardSecondary}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Сейви та навички</Text>
            {sectionConflictLabel(['overview.saving-throws', 'overview.skills', 'overview.conditions'])}
          </View>
          <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Overview')} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.collapseButtonText}>{collapsedSecondary.Overview ? 'Розгорнути' : 'Згорнути'}</Text>
          </Pressable>
        </View>

        <Text style={styles.subSectionTitle}>Saving Throws</Text>
        {STAT_LABELS.map((stat) => {
          const proficient = Boolean(characterData.savingThrows?.[stat.key]);
          const baseMod = calculateModifier(characterData.stats[stat.key] || 10);
          const total = baseMod + (proficient ? proficiency : 0);
          return (
            <Pressable
              key={`save-${stat.key}`}
              style={styles.actionRowLine}
              onPress={() => rollSavingThrow(SAVE_LABELS[stat.key], baseMod, proficient)}
              android_ripple={{ color: colors.ripple }}
              testID={`character.save.${stat.key}`}
            >
              <Text style={styles.rowLabel}>Сейв: {SAVE_LABELS[stat.key]}</Text>
              {proficient ? (
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>Майст.</Text>
                </View>
              ) : null}
              <Text style={styles.rowValue}>{formatBonus(total)}</Text>
              <Text style={styles.rollPill}>Кидок</Text>
            </Pressable>
          );
        })}

        <Text style={styles.subSectionTitle}>Навички</Text>
        {sortedSkills.slice(0, collapsedSecondary.Overview ? 8 : sortedSkills.length).map(([skill, value]) => {
          const rank = characterData.skillProficiencies?.[skill];
          const rankLabel = rank ? SKILL_RANK_LABELS[rank] : hasSkillMetadata ? SKILL_RANK_LABELS.none : 'Збережено';
          return (
            <Pressable
              key={skill}
              style={styles.actionRowLine}
              onPress={() => rollSkillCheck(SKILL_LABELS[skill] || skill, value, rank)}
              android_ripple={{ color: colors.ripple }}
              testID={`character.skill.${skill}`}
            >
              <Text style={styles.rowLabel}>{SKILL_LABELS[skill] || skill}</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>{rankLabel}</Text>
              </View>
              <Text style={styles.rowValue}>{formatBonus(value)}</Text>
              <Text style={styles.rollPill}>Кидок</Text>
            </Pressable>
          );
        })}

        {!collapsedSecondary.Overview && (
          <>
            <Text style={styles.subSectionTitle}>Пасивне сприйняття</Text>
            <Text style={styles.blockText}>{passivePerception}</Text>
            <Text style={styles.subSectionTitle}>Професії</Text>
            <Text style={styles.blockText}>{characterData.proficiencies.length ? characterData.proficiencies.join(', ') : 'Немає'}</Text>
            <Text style={styles.subSectionTitle}>Риси та особливості</Text>
            <Text style={styles.blockText}>{characterData.featuresAndTraits?.length ? characterData.featuresAndTraits.join(', ') : 'Немає'}</Text>
            <Text style={styles.subSectionTitle}>Поточні стани</Text>
            {renderConditionList('Немає активних станів')}
          </>
        )}
      </View>
    </>
  );

  const renderCombatPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Бойові інструменти</Text>
          {sectionConflictLabel(['combat.core', 'combat.hp', 'combat.rest'])}
        </View>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Combat')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Combat ? 'Розгорнути' : 'Згорнути'}</Text>
        </Pressable>
      </View>

      <Text style={styles.subSectionTitle}>Дії</Text>
      <Text style={styles.blockText}>
        {characterData.combatTemplates?.actions?.length ? `• ${characterData.combatTemplates.actions.join('\n• ')}` : '• Немає шаблонів дій'}
      </Text>
      <Text style={styles.subSectionTitle}>Бонусні дії</Text>
      <Text style={styles.blockText}>
        {characterData.combatTemplates?.bonusActions?.length
          ? `• ${characterData.combatTemplates.bonusActions.join('\n• ')}`
          : '• Немає шаблонів бонусних дій'}
      </Text>
      <Text style={styles.subSectionTitle}>Реакції</Text>
      <Text style={styles.blockText}>
        {characterData.combatTemplates?.reactions?.length
          ? `• ${characterData.combatTemplates.reactions.join('\n• ')}`
          : '• Немає шаблонів реакцій'}
      </Text>

      <Text style={styles.subSectionTitle}>Атаки</Text>
      {characterData.weapons?.length ? (
        characterData.weapons.map((weapon, idx) => {
          const attackBonus = Number.isFinite(Number(weapon.attackBonus)) ? Number(weapon.attackBonus) : 0;
          const damageFormula = String(weapon.damage || '1d6');
          return (
            <View key={`${weapon.name}-${idx}`} style={styles.weaponCombatCard}>
              <View style={styles.rowLine}>
                <Text style={styles.rowLabel}>{weapon.name || `Зброя ${idx + 1}`}</Text>
                <Text style={styles.rowValue}>{`${attackBonus >= 0 ? '+' : ''}${attackBonus} / ${damageFormula}`}</Text>
              </View>
              <View style={styles.weaponActionRow}>
                <Pressable
                  style={[styles.weaponActionButton, styles.weaponActionButtonPrimary]}
                  onPress={() => rollWeaponAttack(weapon)}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Text style={styles.weaponActionText}>Влучення (d20)</Text>
                </Pressable>
                <Pressable
                  style={[styles.weaponActionButton, styles.weaponActionButtonSecondary]}
                  onPress={() => rollWeaponDamage(weapon)}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Text style={styles.weaponActionText}>Шкода ({damageFormula})</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      ) : (
        <Text style={styles.blockTextMuted}>Зброя не додана</Text>
      )}

      {!!weaponRollResult && (
        <View style={styles.editCardBlock}>
          <Text style={styles.subSectionTitle}>{weaponRollResult.title}</Text>
          {weaponRollResult.details.map((line, index) => (
            <Text key={`${weaponRollResult.title}-${index}`} style={styles.weaponRollResultLine}>
              {line}
            </Text>
          ))}
        </View>
      )}

      {!collapsedSecondary.Combat && (
        <>
          <Text style={styles.subSectionTitle}>Кидки смерті</Text>
          <Text style={styles.blockText}>
            Успіхи: {characterData.deathSaves?.successes ?? 0} | Провали: {characterData.deathSaves?.failures ?? 0}
          </Text>
          <Text style={styles.subSectionTitle}>Стани</Text>
          {renderConditionList('Немає активних бойових станів')}
          <Text style={styles.subSectionTitle}>Бойові нотатки</Text>
          <Text style={styles.blockText}>{sessionNotes || 'Немає нотаток сесії'}</Text>
        </>
      )}
    </View>
  );

  const renderMagicPlay = () => {
    const slotLevels = Object.keys(characterData.spells.spellSlots)
      .map(Number)
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
    const hasCasterSetup = Boolean(
      characterData.spells.spellcastingAbility
        || slotLevels.length
        || characterData.spells.cantrips.length
        || characterData.spells.knownSpells.length
        || characterData.spells.preparedSpells.length,
    );
    const concentration = (characterData.conditions || []).find((condition) => {
      const key = normalizeConditionKey(condition);
      return key.includes('concentration') || key.includes('концентра');
    });

    return (
      <View style={styles.cardSecondary}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Огляд магії</Text>
            {sectionConflictLabel(['magic.'])}
          </View>
          <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Magic')} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.collapseButtonText}>{collapsedSecondary.Magic ? 'Розгорнути' : 'Згорнути'}</Text>
          </Pressable>
        </View>

        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>Чаклування</Text>
          <Text style={styles.rowValue}>{characterData.spells.spellcastingAbility || '—'}</Text>
        </View>
        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>Складність</Text>
          <Text style={styles.rowValue}>{characterData.spells.spellSaveDC || 0}</Text>
        </View>
        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>Бонус атаки</Text>
          <Text style={styles.rowValue}>
            {characterData.spells.spellAttackBonus >= 0
              ? `+${characterData.spells.spellAttackBonus}`
              : characterData.spells.spellAttackBonus}
          </Text>
        </View>
        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>Концентрація</Text>
          <Text style={styles.rowValue}>{concentration || (hasCasterSetup ? 'Немає' : 'Не чаклун')}</Text>
        </View>

        {!hasCasterSetup ? (
          <Text style={styles.blockTextMuted}>Для non-caster персонажа магічні ресурси не налаштовані.</Text>
        ) : null}

        <Text style={styles.subSectionTitle}>Слоти</Text>
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

        <Pressable style={styles.secondaryAction} onPress={openPreparedSpellbook} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryActionText}>Відкрити Spellbook</Text>
        </Pressable>

        <Text style={styles.subSectionTitle}>Кидки заклять</Text>
        {magicCombatSpells.length ? (
          magicCombatSpells.map((spell) => {
            const defaultProfile = spell.damageProfiles[0];
            return (
              <View key={`magic-combat-${spell.key}`} style={styles.weaponCombatCard}>
                <View style={styles.rowLine}>
                  <Text style={styles.rowLabel}>{spell.name}</Text>
                  <Text style={styles.rowValue}>
                    {MAGIC_STATUS_LABELS[spell.status]}
                    {defaultProfile ? ` • ${defaultProfile.formula}` : ''}
                  </Text>
                </View>
                <View style={styles.weaponActionRow}>
                  <Pressable
                    style={[styles.weaponActionButton, styles.weaponActionButtonPrimary]}
                    onPress={() => rollSpellAttack(spell.name)}
                    android_ripple={{ color: colors.ripple }}
                  >
                    <Text style={styles.weaponActionText}>Атака (d20)</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.weaponActionButton,
                      styles.weaponActionButtonSecondary,
                      !defaultProfile ? { opacity: 0.45 } : null,
                    ]}
                    onPress={() => defaultProfile && rollSpellDamage(spell.name, defaultProfile)}
                    android_ripple={{ color: colors.ripple }}
                    disabled={!defaultProfile}
                  >
                    <Text style={styles.weaponActionText}>
                      {defaultProfile ? `Шкода (${defaultProfile.formula})` : 'Шкода (нема профілю)'}
                    </Text>
                  </Pressable>
                </View>
                {spell.damageProfiles.length > 1 &&
                  spell.damageProfiles.slice(1).map((profile) => (
                    <Pressable
                      key={`${spell.key}-${profile.id}`}
                      style={styles.secondaryAction}
                      onPress={() => rollSpellDamage(spell.name, profile)}
                      android_ripple={{ color: colors.ripple }}
                    >
                      <Text style={styles.secondaryActionText}>
                        Шкода: {profile.label} ({profile.formula} {profile.damageType})
                      </Text>
                    </Pressable>
                  ))}
              </View>
            );
          })
        ) : (
          <Text style={styles.blockTextMuted}>Додайте закляття до Prepared/Known/Cantrip для швидких кидків.</Text>
        )}

        {!!spellRollResult && (
          <View style={styles.editCardBlock}>
            <Text style={styles.subSectionTitle}>{spellRollResult.title}</Text>
            {spellRollResult.details.map((line, index) => (
              <Text key={`${spellRollResult.title}-${index}`} style={styles.weaponRollResultLine}>
                {line}
              </Text>
            ))}
          </View>
        )}

        {!collapsedSecondary.Magic && (
          <>
            <Text style={styles.subSectionTitle}>Підготовлені закляття</Text>
            <Text style={styles.blockText}>
              {preparedSpellsLimit !== null ? `Ліміт: ${preparedSpellsCount}/${preparedSpellsLimit}. ` : ''}
              {characterData.spells.preparedSpells.length ? characterData.spells.preparedSpells.join(', ') : 'Немає підготовлених'}
            </Text>
          </>
        )}
      </View>
    );
  };

  const renderInventoryPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Інвентар</Text>
          {sectionConflictLabel(['inventory.'])}
        </View>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Inventory')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Inventory ? 'Розгорнути' : 'Згорнути'}</Text>
        </Pressable>
      </View>

      <View style={styles.rowLine}>
        <Text style={styles.rowLabel}>Броня</Text>
        <Text style={styles.rowValue}>{characterData.equipment?.armor || characterData.armorClassDetails || 'Не вказано'}</Text>
      </View>
      <View style={styles.rowLine}>
        <Text style={styles.rowLabel}>Щит</Text>
        <Text style={styles.rowValue}>{characterData.equipment?.shield || 'Не вказано'}</Text>
      </View>
      <View style={styles.rowLine}>
        <Text style={styles.rowLabel}>Переносима вага</Text>
        <Text style={styles.rowValue}>
          {typeof characterData.equipment?.carryingCapacity === 'number' ? `${characterData.equipment.carryingCapacity} lb` : 'Не вказано'}
        </Text>
      </View>

      <Text style={styles.subSectionTitle}>Зброя</Text>
      {characterData.weapons?.length ? (
        characterData.weapons.map((weapon, idx) => (
          <Text key={`inventory-weapon-${weapon.name}-${idx}`} style={styles.blockText}>
            • {weapon.name || `Зброя ${idx + 1}`} ({formatBonus(Number(weapon.attackBonus || 0))}, {weapon.damage || '1d6'})
          </Text>
        ))
      ) : (
        <Text style={styles.blockTextMuted}>Зброя не додана</Text>
      )}

      <Text style={styles.subSectionTitle}>Спорядження</Text>
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

      <Text style={styles.subSectionTitle}>Прив’язані предмети</Text>
      {characterData.equipment?.attunedItems?.length ? (
        characterData.equipment.attunedItems.map((item, idx) => (
          <Text key={`attuned-${item}-${idx}`} style={styles.blockText}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={styles.blockTextMuted}>Немає прив’язаних предметів</Text>
      )}

      <Text style={styles.subSectionTitle}>Валюта</Text>
      <Text style={styles.blockText}>
        GP {characterData.coins?.gold ?? 0} | SP {characterData.coins?.silver ?? 0} | CP {characterData.coins?.copper ?? 0}
      </Text>
    </View>
  );

  const renderNotesPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Нотатки</Text>
          {sectionConflictLabel(['homebrew.notes-groups'])}
        </View>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Notes')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Notes ? 'Розгорнути' : 'Згорнути'}</Text>
        </Pressable>
      </View>

      {!notesGroups.length && <Text style={styles.blockTextMuted}>Нотаток поки немає.</Text>}
      {notesGroups
        .filter((_, index) => !collapsedSecondary.Notes || index < 1)
        .map((group) => (
          <View key={group.id}>
            <Text style={styles.subSectionTitle}>{group.title}</Text>
            <Text style={styles.blockText}>{group.content?.trim() || 'Порожньо'}</Text>
          </View>
        ))}
      {!collapsedSecondary.Notes && (
        <>
          <Text style={styles.subSectionTitle}>Нотатки сесії</Text>
          <Text style={styles.blockText}>{characterData.notesBlocks?.session || characterData.notes || 'Порожньо'}</Text>
          <Text style={styles.subSectionTitle}>Кампанія</Text>
          <Text style={styles.blockText}>{characterData.notesBlocks?.campaign || characterData.campaign || 'Порожньо'}</Text>
          <Text style={styles.subSectionTitle}>Квести</Text>
          <Text style={styles.blockText}>{characterData.notesBlocks?.quests || characterData.notesBlocks?.goals || 'Порожньо'}</Text>
          <Text style={styles.subSectionTitle}>Союзники / вороги</Text>
          <Text style={styles.blockText}>{characterData.alliesAndOrganizations || characterData.notesBlocks?.relationships || 'Порожньо'}</Text>
          <Text style={styles.subSectionTitle}>Рольова гра</Text>
          <Text style={styles.blockText}>
            {[characterData.traits?.personality, characterData.traits?.ideals, characterData.traits?.bonds, characterData.traits?.flaws, characterData.backstory]
              .map((entry) => String(entry || '').trim())
              .filter(Boolean)
              .join('\n') || 'Порожньо'}
          </Text>
        </>
      )}
    </View>
  );

  const renderHomebrewPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Власне</Text>
          {sectionConflictLabel(['homebrew.'])}
        </View>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Homebrew')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Homebrew ? 'Розгорнути' : 'Згорнути'}</Text>
        </Pressable>
      </View>

      <Text style={styles.subSectionTitle}>Власні поля</Text>
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
          <Text style={styles.subSectionTitle}>Власні ресурси</Text>
          {characterData.customResources?.length ? (
            characterData.customResources.map((resource) => (
              <View key={resource.id} style={styles.trackerCard}>
                <View style={styles.trackerHeader}>
                  <Text style={styles.trackerName}>{resource.label}</Text>
                  <Text style={styles.trackerMeta}>{resource.resetRule}</Text>
                </View>
                <View style={styles.trackerControls}>
                  <Pressable
                    style={styles.quickCircle}
                    android_ripple={{ color: colors.ripple }}
                    onPress={() => updateResource(resource.id, { current: Math.max(0, resource.current - 1) })}
                  >
                    <Text style={styles.quickCircleText}>-</Text>
                  </Pressable>
                  <Text style={styles.trackerValue}>
                    {resource.current}
                    {typeof resource.max === 'number' ? `/${resource.max}` : ''}
                  </Text>
                  <Pressable
                    style={styles.quickCircle}
                    android_ripple={{ color: colors.ripple }}
                    onPress={() => {
                      const max = typeof resource.max === 'number' ? resource.max : Number.POSITIVE_INFINITY;
                      updateResource(resource.id, { current: Math.min(resource.current + 1, max) });
                    }}
                  >
                    <Text style={styles.quickCircleText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.blockTextMuted}>Ресурси не додані</Text>
          )}

          <Text style={styles.subSectionTitle}>Власні розділи</Text>
          {characterData.customSections?.length ? (
            characterData.customSections.map((section) => (
              <View key={section.id}>
                <Text style={styles.rowLabel}>{section.title}</Text>
                <Text style={styles.blockText}>{section.content?.trim() || 'Порожньо'}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.blockTextMuted}>Секції не додані</Text>
          )}

          <Text style={styles.subSectionTitle}>Власні записи</Text>
          {characterData.homebrewEntries?.length ? (
            characterData.homebrewEntries.map((entry) => (
              <View key={entry.id} style={styles.editCardBlock}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.rowLabel}>{entry.name}</Text>
                  <Text style={styles.blockTextMuted}>{entry.kind}</Text>
                </View>
                <Text style={styles.blockText}>{entry.description || 'Без опису'}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.blockTextMuted}>Записи не додані</Text>
          )}
        </>
      )}
    </View>
  );

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
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Ідентичність</Text>
        {sectionConflictLabel(['overview.identity'])}
      </View>
      <Text style={styles.editLabel}>Ім’я</Text>
      {renderTextInput(characterData.name, (next) => patchCharacter((prev) => ({ ...prev, name: next })), 'Ім’я персонажа')}
      <Text style={styles.editLabel}>Клас</Text>
      {renderTextInput(characterData.class, (next) => patchCharacter((prev) => ({ ...prev, class: next })), 'Клас')}
      <Text style={styles.editLabel}>Раса</Text>
      {renderTextInput(characterData.race, (next) => patchCharacter((prev) => ({ ...prev, race: next })), 'Раса')}
      <Text style={styles.editLabel}>Кампанія</Text>
      {renderTextInput(
        characterData.campaign || '',
        (next) =>
          patchCharacter(
            (prev) => ({
              ...prev,
              campaign: next,
              campaignId: undefined,
            }),
            ['overview.identity'],
          ),
        'Назва кампанії',
      )}
      <Text style={styles.editLabel}>Рівень</Text>
      <View style={styles.numberStepperRow}>
        <RNTextInput
          value={String(currentLevel)}
          placeholder='1-20'
          placeholderTextColor={colors.textSecondary}
          style={[styles.editInput, styles.numberStepperInput, styles.numberStepperReadOnlyInput]}
          keyboardType='number-pad'
          editable={false}
        />
        <View style={styles.numberStepperControls}>
          <Pressable
            style={[
              styles.numberStepperButton,
              styles.numberStepperButtonTop,
              !canIncreaseLevel ? styles.numberStepperButtonDisabled : null,
            ]}
            onPress={() => openLevelChangeModal(1)}
            android_ripple={{ color: colors.ripple }}
            disabled={!canIncreaseLevel}
          >
            <Text style={styles.numberStepperButtonText}>+</Text>
          </Pressable>
          <Pressable
            style={[styles.numberStepperButton, !canDecreaseLevel ? styles.numberStepperButtonDisabled : null]}
            onPress={() => openLevelChangeModal(-1)}
            android_ripple={{ color: colors.ripple }}
            disabled={!canDecreaseLevel}
          >
            <Text style={styles.numberStepperButtonText}>-</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.editLabel}>Досвід</Text>
      {renderTextInput(
        String(characterData.experience),
        (next) => patchCharacter((prev) => ({ ...prev, experience: Math.max(0, parseNumber(next, prev.experience)) })),
        'XP',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Бонус майстерності</Text>
      {renderTextInput(
        String(characterData.proficiencyBonus ?? proficiency),
        (next) =>
          patchCharacter((prev) => {
            const nextProficiency = clamp(parseNumber(next, proficiency), 1, 10);
            const nextSkills = { ...prev.skills };

            if (prev.skillProficiencies && Object.keys(prev.skillProficiencies).length) {
              skillKeys.forEach((skill) => {
                nextSkills[skill] = computeSkillBonus({
                  stats: prev.stats,
                  skill,
                  rank: prev.skillProficiencies?.[skill],
                  proficiencyBonus: nextProficiency,
                  fallbackValue: prev.skills?.[skill],
                });
              });
            }

            return { ...prev, proficiencyBonus: nextProficiency, skills: nextSkills };
          }),
        '2',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.subSectionTitle}>Характеристики</Text>
      <View style={styles.levelModalStatsGrid}>
        {STAT_LABELS.map((stat) => (
          <View key={`edit-stat-${stat.key}`} style={styles.levelModalStatCell}>
            <Text style={styles.editLabel}>{stat.label}</Text>
            {renderTextInput(
              String(characterData.stats[stat.key] ?? 10),
              (next) =>
                patchCharacter(
                  (prev) => {
                    const nextStats = {
                      ...prev.stats,
                      [stat.key]: clamp(parseNumber(next, prev.stats[stat.key] ?? 10), 1, 30),
                    };
                    const nextSkills = { ...prev.skills };

                    if (prev.skillProficiencies && Object.keys(prev.skillProficiencies).length) {
                      skillKeys.forEach((skill) => {
                        nextSkills[skill] = computeSkillBonus({
                          stats: nextStats,
                          skill,
                          rank: prev.skillProficiencies?.[skill],
                          proficiencyBonus: prev.proficiencyBonus ?? buildProficiencyByLevel(prev.level),
                          fallbackValue: prev.skills?.[skill],
                        });
                      });
                    }

                    return { ...prev, stats: nextStats, skills: nextSkills };
                  },
                  ['overview.stats', 'overview.skills'],
                ),
              stat.label,
              { keyboardType: 'number-pad' },
            )}
          </View>
        ))}
      </View>
      <Text style={styles.subSectionTitle}>Майстерність у сейвах</Text>
      {STAT_LABELS.map((stat) => {
        const proficient = Boolean(characterData.savingThrows?.[stat.key]);
        return (
          <Pressable
            key={`edit-save-${stat.key}`}
            style={styles.actionRowLine}
            onPress={() => toggleSavingThrowProficiency(stat.key)}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={styles.rowLabel}>{SAVE_LABELS[stat.key]}</Text>
            <Text style={styles.rowValue}>{proficient ? 'Майст.' : 'Без майст.'}</Text>
          </Pressable>
        );
      })}
      <Text style={styles.subSectionTitle}>Майстерність у навичках</Text>
      {skillKeys.map((skill) => {
        const rank = characterData.skillProficiencies?.[skill] || 'none';
        const value = computeSkillBonus({
          stats: characterData.stats,
          skill,
          rank: rank === 'none' ? undefined : rank,
          proficiencyBonus: proficiency,
          fallbackValue: characterData.skills?.[skill],
        });
        return (
          <Pressable
            key={`edit-skill-rank-${skill}`}
            style={styles.actionRowLine}
            onPress={() => cycleSkillRank(skill)}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={styles.rowLabel}>{SKILL_LABELS[skill] || skill}</Text>
            <Text style={styles.rowValue}>
              {SKILL_RANK_LABELS[rank]} • {formatBonus(value)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderCombatEdit = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Налаштування бою</Text>
        {sectionConflictLabel(['combat.core', 'combat.hp', 'combat.rest'])}
      </View>
      <Text style={styles.editLabel}>Поточне HP</Text>
      {renderTextInput(
        String(characterData.hp.current),
        (next) =>
          patchCharacter((prev) => ({
            ...prev,
            hp: { ...prev.hp, current: clamp(parseNumber(next, prev.hp.current), 0, prev.hp.max) },
          }), ['combat.hp']),
        'Поточне HP',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Макс. HP</Text>
      {renderTextInput(
        String(characterData.hp.max),
        (next) =>
          patchCharacter((prev) => {
            const max = Math.max(1, parseNumber(next, prev.hp.max));
            return {
              ...prev,
              hp: { ...prev.hp, max, current: clamp(prev.hp.current, 0, max) },
            };
          }, ['combat.hp']),
        'Макс. HP',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Тимчасове HP</Text>
      {renderTextInput(
        String(characterData.hp.temp),
        (next) =>
          patchCharacter((prev) => ({
            ...prev,
            hp: { ...prev.hp, temp: Math.max(0, parseNumber(next, prev.hp.temp)) },
          }), ['combat.hp']),
        'Тимчасове HP',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>AC</Text>
      {renderTextInput(
        String(characterData.ac),
        (next) => patchCharacter((prev) => ({ ...prev, ac: Math.max(0, parseNumber(next, prev.ac)) }), ['combat.core']),
        'Клас захисту',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Швидкість</Text>
      {renderTextInput(
        String(characterData.speed),
        (next) => patchCharacter((prev) => ({ ...prev, speed: Math.max(0, parseNumber(next, prev.speed)) }), ['combat.core']),
        'Швидкість',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Ініціатива</Text>
      {renderTextInput(
        String(characterData.initiative),
        (next) => patchCharacter((prev) => ({ ...prev, initiative: parseNumber(next, prev.initiative) }), ['combat.core']),
        'Ініціатива',
        { keyboardType: 'number-pad' },
      )}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Бойові шаблони</Text>
        {sectionConflictLabel(['combat.templates'])}
      </View>
      <Text style={styles.editLabel}>Дії (по одній в рядку)</Text>
      {renderTextInput(
        (characterData.combatTemplates?.actions || []).join('\n'),
        (next) =>
          patchCharacter(
            (prev) => ({
              ...prev,
              combatTemplates: {
                ...prev.combatTemplates,
                actions: parseLines(next),
              },
            }),
            ['combat.templates.actions'],
          ),
        'Атака довгим мечем',
        { multiline: true },
      )}
      <Text style={styles.editLabel}>Бонусні дії (по одній в рядку)</Text>
      {renderTextInput(
        (characterData.combatTemplates?.bonusActions || []).join('\n'),
        (next) =>
          patchCharacter(
            (prev) => ({
              ...prev,
              combatTemplates: {
                ...prev.combatTemplates,
                bonusActions: parseLines(next),
              },
            }),
            ['combat.templates.bonus-actions'],
          ),
        'Друге дихання',
        { multiline: true },
      )}
      <Text style={styles.editLabel}>Реакції (по одній в рядку)</Text>
      {renderTextInput(
        (characterData.combatTemplates?.reactions || []).join('\n'),
        (next) =>
          patchCharacter(
            (prev) => ({
              ...prev,
              combatTemplates: {
                ...prev.combatTemplates,
                reactions: parseLines(next),
              },
            }),
            ['combat.templates.reactions'],
          ),
        'Атака при нагоді',
        { multiline: true },
      )}
    </View>
  );

  const renderMagicEdit = () => {
    const slotLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
      <View style={styles.cardSecondary}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Налаштування магії</Text>
          {sectionConflictLabel(['magic.'])}
        </View>
        <Text style={styles.editLabel}>Характеристика чаклування</Text>
        {renderTextInput(
          characterData.spells.spellcastingAbility,
          (next) =>
            patchCharacter((prev) => ({
              ...prev,
              spells: { ...prev.spells, spellcastingAbility: next },
            })),
          'INT / WIS / CHA',
        )}
        <Text style={styles.editLabel}>Складність заклять (DC)</Text>
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
        <Text style={styles.editLabel}>Бонус атаки заклять</Text>
        {renderTextInput(
          String(characterData.spells.spellAttackBonus),
          (next) =>
            patchCharacter((prev) => ({
              ...prev,
              spells: { ...prev.spells, spellAttackBonus: parseNumber(next, prev.spells.spellAttackBonus) },
            })),
          'Бонус атаки',
          { keyboardType: 'number-pad' },
        )}
        <View style={styles.editCardBlock}>
          <Text style={styles.subSectionTitle}>Швидке додавання заклять</Text>
          <Text style={styles.blockTextMuted}>Форма відкривається в модальному вікні, щоб не захаращувати екран редагування.</Text>
          {preparedSpellsLimit !== null && (
            <Text style={styles.blockTextMuted}>
              Підготовлено: {preparedSpellsCount}/{preparedSpellsLimit}
            </Text>
          )}
          <Pressable style={styles.secondaryAction} onPress={openSpellQuickModal} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.secondaryActionText}>Відкрити додавання закляття</Text>
          </Pressable>
        </View>
        <Text style={styles.editLabel}>Підготовлені закляття (по одному в рядку)</Text>
        <RNTextInput
          value={preparedSpellsDraft}
          onChangeText={setPreparedSpellsDraft}
          onFocus={() => setIsPreparedSpellsDraftFocused(true)}
          onBlur={() => {
            setIsPreparedSpellsDraftFocused(false);
            commitPreparedSpellsDraft();
          }}
          placeholder='Магічна стріла'
          placeholderTextColor={colors.textSecondary}
          style={[styles.editInput, styles.editInputMultiline]}
          multiline
        />
        <Text style={styles.editLabel}>Відомі закляття (по одному в рядку)</Text>
        <RNTextInput
          value={knownSpellsDraft}
          onChangeText={setKnownSpellsDraft}
          onFocus={() => setIsKnownSpellsDraftFocused(true)}
          onBlur={() => {
            setIsKnownSpellsDraftFocused(false);
            commitKnownSpellsDraft();
          }}
          placeholder='Щит'
          placeholderTextColor={colors.textSecondary}
          style={[styles.editInput, styles.editInputMultiline]}
          multiline
        />
        <Text style={styles.editLabel}>Кантріпи (по одному в рядку)</Text>
        <RNTextInput
          value={cantripsDraft}
          onChangeText={setCantripsDraft}
          onFocus={() => setIsCantripsDraftFocused(true)}
          onBlur={() => {
            setIsCantripsDraftFocused(false);
            commitCantripsDraft();
          }}
          placeholder='Вогняний болт'
          placeholderTextColor={colors.textSecondary}
          style={[styles.editInput, styles.editInputMultiline]}
          multiline
        />
        <Text style={styles.subSectionTitle}>Слоти заклять</Text>
        {slotLevels.map((level) => {
          const slot = characterData.spells.spellSlots[level] || { max: 0, used: 0 };
          return (
            <View key={`slot-edit-${level}`} style={styles.slotEditRow}>
              <Text style={styles.rowLabel}>Рів. {level}</Text>
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
                placeholder='макс'
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
                placeholder='викор'
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
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Налаштування інвентаря</Text>
        {sectionConflictLabel(['inventory.'])}
      </View>
      <Text style={styles.editLabel}>Інвентар (по одному предмету в рядку)</Text>
      {renderTextInput(
        characterData.inventory.join('\n'),
        (next) => patchCharacter((prev) => ({ ...prev, inventory: parseLines(next) })),
        'Мотузка\nСмолоскип',
        { multiline: true },
      )}
      <Text style={styles.editLabel}>Броня</Text>
      {renderTextInput(
        characterData.equipment?.armor || '',
        (next) =>
          patchCharacter(
            (prev) => ({
              ...prev,
              equipment: {
                ...(prev.equipment || {}),
                armor: next.trim() || undefined,
              },
            }),
            ['inventory.equipment'],
          ),
        'Chain Mail',
      )}
      <Text style={styles.editLabel}>Щит</Text>
      {renderTextInput(
        characterData.equipment?.shield || '',
        (next) =>
          patchCharacter(
            (prev) => ({
              ...prev,
              equipment: {
                ...(prev.equipment || {}),
                shield: next.trim() || undefined,
              },
            }),
            ['inventory.equipment'],
          ),
        'Shield',
      )}
      <Text style={styles.editLabel}>Прив’язані предмети (по одному в рядку)</Text>
      {renderTextInput(
        (characterData.equipment?.attunedItems || []).join('\n'),
        (next) =>
          patchCharacter(
            (prev) => ({
              ...prev,
              equipment: {
                ...(prev.equipment || {}),
                attunedItems: parseLines(next),
              },
            }),
            ['inventory.equipment'],
          ),
        'Ring of Protection',
        { multiline: true },
      )}
      <Text style={styles.editLabel}>Переносима вага</Text>
      {renderTextInput(
        String(characterData.equipment?.carryingCapacity ?? ''),
        (next) =>
          patchCharacter(
            (prev) => ({
              ...prev,
              equipment: {
                ...(prev.equipment || {}),
                carryingCapacity: next.trim() ? Math.max(0, parseNumber(next, prev.equipment?.carryingCapacity ?? 0)) : undefined,
              },
            }),
            ['inventory.equipment'],
          ),
        '150',
        { keyboardType: 'number-pad' },
      )}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Налаштування зброї</Text>
        {sectionConflictLabel(['combat.weapons'])}
      </View>
      <Pressable style={styles.secondaryAction} onPress={addWeapon} android_ripple={{ color: colors.ripple }}>
        <Text style={styles.secondaryActionText}>+ Додати зброю</Text>
      </Pressable>
      {(characterData.weapons || []).map((weapon, index) => (
        <View key={`weapon-config-${index}`} style={styles.editCardBlock}>
          <Text style={styles.editLabel}>Назва зброї</Text>
          {renderTextInput(
            weapon.name || '',
            (next) => updateWeaponAt(index, { name: next }),
            'Короткий меч',
          )}
          <Text style={styles.editLabel}>Бонус атаки</Text>
          {renderTextInput(
            String(weapon.attackBonus ?? 0),
            (next) => updateWeaponAt(index, { attackBonus: parseNumber(next, Number(weapon.attackBonus) || 0) }),
            '+5',
            { keyboardType: 'numeric' },
          )}
          <Text style={styles.editLabel}>Шкода (XdY або XdY+Z)</Text>
          {renderTextInput(
            weapon.damage || '',
            (next) => updateWeaponAt(index, { damage: next }),
            '1d8+3',
            { keyboardType: 'default' },
          )}
          <Pressable style={styles.removeButton} onPress={() => removeWeaponAt(index)} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.removeButtonText}>Видалити зброю</Text>
          </Pressable>
        </View>
      ))}
      <Text style={styles.editLabel}>Нотатки</Text>
      {renderTextInput(
        characterData.notes || '',
        (next) => patchCharacter((prev) => ({ ...prev, notes: next })),
        'Загальні нотатки',
        { multiline: true },
      )}
      <Text style={styles.editLabel}>Монети (GP / SP / CP)</Text>
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
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Групи нотаток</Text>
        {sectionConflictLabel(['homebrew.notes-groups'])}
      </View>
      <Pressable style={styles.secondaryAction} onPress={addNotesGroup} android_ripple={{ color: colors.ripple }}>
        <Text style={styles.secondaryActionText}>+ Додати групу нотаток</Text>
      </Pressable>
      {notesGroups.map((group) => (
        <View key={group.id} style={styles.editCardBlock}>
          <Text style={styles.editLabel}>Назва групи</Text>
          {renderTextInput(group.title, (next) => updateNotesGroupMeta(group.id, { title: next }), 'Назва групи')}
          <Text style={styles.editLabel}>Вміст групи</Text>
          {renderTextInput(group.content || '', (next) => setNotesGroup(group.id, next), 'Вміст нотаток', { multiline: true })}
          {group.origin === 'custom' && (
            <Pressable style={styles.removeButton} onPress={() => removeNotesGroup(group.id)} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.removeButtonText}>Видалити групу нотаток</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );

  const renderHomebrewEdit = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Власні поля</Text>
        {sectionConflictLabel(['homebrew.fields'])}
      </View>
      <Pressable style={styles.secondaryAction} onPress={addCustomField} android_ripple={{ color: colors.ripple }}>
        <Text style={styles.secondaryActionText}>+ Додати власне поле</Text>
      </Pressable>

      {(characterData.customFields || []).map((field) => {
        const currentTypeIndex = FIELD_TYPES.indexOf(field.type);
        const nextType = FIELD_TYPES[(currentTypeIndex + 1) % FIELD_TYPES.length];
        return (
          <View key={field.id} style={styles.editCardBlock}>
            <Text style={styles.editLabel}>Назва</Text>
            {renderTextInput(field.label, (next) => updateCustomField(field.id, { label: next }), 'Назва поля')}

            <View style={styles.cardHeaderRow}>
              <Text style={styles.rowLabel}>Тип: {field.type}</Text>
              <Pressable
                style={styles.collapseButton}
                onPress={() => updateCustomField(field.id, { type: nextType })}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.collapseButtonText}>Змінити тип</Text>
              </Pressable>
            </View>

            {field.type === 'boolean' ? (
              <Pressable
                style={styles.booleanField}
                onPress={() => updateCustomField(field.id, { value: !field.value })}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.blockText}>{field.value ? 'Так' : 'Ні'}</Text>
              </Pressable>
            ) : field.type === 'select' ? (
              <>
                <Text style={styles.editLabel}>Опції (по одній в рядку)</Text>
                {renderTextInput(
                  (field.options || []).join('\n'),
                  (next) => updateCustomField(field.id, { options: parseLines(next) }),
                  'Опція A\nОпція B',
                  { multiline: true },
                )}
                <Text style={styles.editLabel}>Значення</Text>
                {renderTextInput(String(field.value ?? ''), (next) => updateCustomField(field.id, { value: next }), 'Значення')}
              </>
            ) : (
              renderTextInput(String(field.value ?? ''), (next) => updateCustomField(field.id, { value: next }), 'Значення')
            )}

            <Pressable style={styles.removeButton} onPress={() => removeCustomField(field.id)} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.removeButtonText}>Видалити поле</Text>
            </Pressable>
          </View>
        );
      })}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Власні ресурси</Text>
        {sectionConflictLabel(['homebrew.resources'])}
      </View>
      <Pressable style={styles.secondaryAction} onPress={addResource} android_ripple={{ color: colors.ripple }}>
        <Text style={styles.secondaryActionText}>+ Додати ресурс</Text>
      </Pressable>
      <Text style={styles.subSectionTitle}>Системні шаблони</Text>
      {SYSTEM_RESOURCE_TEMPLATES.map((template) => (
        <Pressable
          key={template.id}
          style={styles.secondaryAction}
          onPress={() => applyResourceTemplate(template.resource)}
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={styles.secondaryActionText}>Застосувати: {template.name}</Text>
        </Pressable>
      ))}
      {!!userTemplates.length && <Text style={styles.subSectionTitle}>Шаблони користувача</Text>}
      {userTemplates.map((template) => (
        <View key={template.id} style={styles.editCardBlock}>
          <Text style={styles.rowLabel}>{template.name}</Text>
          <Text style={styles.blockTextMuted}>
            {template.resource.label} • {template.resource.current}/{template.resource.max ?? '∞'} • {template.resource.resetRule}
          </Text>
          <Pressable
            style={styles.secondaryAction}
            onPress={() => applyResourceTemplate(template.resource)}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={styles.secondaryActionText}>Застосувати шаблон користувача</Text>
          </Pressable>
          <Pressable style={styles.removeButton} onPress={() => removeUserTemplate(template.id)} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.removeButtonText}>Видалити шаблон</Text>
          </Pressable>
        </View>
      ))}

      {(characterData.customResources || []).map((resource) => {
        const ruleIndex = TRACKER_RULES.indexOf(resource.resetRule);
        const nextRule = TRACKER_RULES[(ruleIndex + 1) % TRACKER_RULES.length];
        return (
          <View key={resource.id} style={styles.editCardBlock}>
            <Text style={styles.editLabel}>Назва ресурсу</Text>
            {renderTextInput(resource.label, (next) => updateResource(resource.id, { label: next }), 'Назва ресурсу')}
            <Text style={styles.editLabel}>Поточне</Text>
            {renderTextInput(
              String(resource.current),
              (next) => updateResource(resource.id, { current: Math.max(0, parseNumber(next, resource.current)) }),
              'Current',
              { keyboardType: 'number-pad' },
            )}
            <Text style={styles.editLabel}>Макс. (необов’язково)</Text>
            {renderTextInput(
              String(resource.max ?? ''),
              (next) => {
                const parsed = next.trim() === '' ? undefined : Math.max(0, parseNumber(next, 0));
                updateResource(resource.id, { max: parsed });
              },
              'Max',
              { keyboardType: 'number-pad' },
            )}

            <View style={styles.cardHeaderRow}>
              <Text style={styles.rowLabel}>Reset: {resource.resetRule}</Text>
              <Pressable
                style={styles.collapseButton}
                onPress={() => updateResource(resource.id, { resetRule: nextRule })}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.collapseButtonText}>Змінити відновлення</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.secondaryAction}
              onPress={() => saveUserTemplateFromResource(resource)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={styles.secondaryActionText}>Зберегти як шаблон користувача</Text>
            </Pressable>

            <Pressable style={styles.removeButton} onPress={() => removeResource(resource.id)} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.removeButtonText}>Видалити ресурс</Text>
            </Pressable>
          </View>
        );
      })}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Власні розділи</Text>
        {sectionConflictLabel(['homebrew.sections'])}
      </View>
      <Pressable style={styles.secondaryAction} onPress={addCustomSection} android_ripple={{ color: colors.ripple }}>
        <Text style={styles.secondaryActionText}>+ Додати розділ</Text>
      </Pressable>
      {(characterData.customSections || []).map((section) => (
        <View key={section.id} style={styles.editCardBlock}>
          <Text style={styles.editLabel}>Назва розділу</Text>
          {renderTextInput(section.title, (next) => updateCustomSection(section.id, { title: next }), 'Назва розділу')}
          <Text style={styles.editLabel}>Вміст розділу</Text>
          {renderTextInput(section.content, (next) => updateCustomSection(section.id, { content: next }), 'Вміст розділу', {
            multiline: true,
          })}
          <Pressable style={styles.removeButton} onPress={() => removeCustomSection(section.id)} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.removeButtonText}>Видалити розділ</Text>
          </Pressable>
        </View>
      ))}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Власні записи</Text>
        {sectionConflictLabel(['homebrew.entries'])}
      </View>
      <View style={styles.slotEditRow}>
        <Pressable style={styles.secondaryAction} onPress={() => addHomebrewEntry('spell')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryActionText}>+ Закляття</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => addHomebrewEntry('ability')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryActionText}>+ Здібність</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => addHomebrewEntry('feat')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryActionText}>+ Риса</Text>
        </Pressable>
      </View>
      {(characterData.homebrewEntries || []).map((entry) => {
        const kinds: CharacterHomebrewEntry['kind'][] = ['spell', 'ability', 'feat'];
        const kindIndex = kinds.indexOf(entry.kind);
        const nextKind = kinds[(kindIndex + 1) % kinds.length];
        return (
          <View key={entry.id} style={styles.editCardBlock}>
            <Text style={styles.editLabel}>Назва</Text>
            {renderTextInput(entry.name, (next) => updateHomebrewEntry(entry.id, { name: next }), 'Назва запису')}
            <Text style={styles.editLabel}>Опис</Text>
            {renderTextInput(entry.description, (next) => updateHomebrewEntry(entry.id, { description: next }), 'Опис', {
              multiline: true,
            })}
            <Text style={styles.editLabel}>Теги (по одному в рядку)</Text>
            {renderTextInput((entry.tags || []).join('\n'), (next) => updateHomebrewEntry(entry.id, { tags: parseLines(next) }), 'тег-а\nтег-б', {
              multiline: true,
            })}
            <View style={styles.cardHeaderRow}>
              <Text style={styles.rowLabel}>Тип: {entry.kind}</Text>
              <Pressable
                style={styles.collapseButton}
                onPress={() => updateHomebrewEntry(entry.id, { kind: nextKind })}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.collapseButtonText}>Змінити тип</Text>
              </Pressable>
            </View>
            <Pressable style={styles.removeButton} onPress={() => removeHomebrewEntry(entry.id)} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.removeButtonText}>Видалити запис</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );

  const onQuickActionPress = useCallback(
    (action: { id: string; onPress: () => void }) => {
      trackProductEvent('quick_action_used', {
        characterId: characterData.id,
        actionId: action.id,
      });
      action.onPress();
    },
    [characterData.id],
  );

  if (isCharacterMissing) {
    return {
      isCharacterMissing: true as const,
      styles,
    };
  }

  return {
    isCharacterMissing: false as const,
    styles,
    colors,
    characterData,
    isCloudDoc,
    isSharedSheet,
    onCharacterMenuChange: (next: CharacterViewModel) => setCharacterData(ensureCharacterDefaults(next)),
    syncBadges,
    renderBadge,
    syncStatusLabel,
    syncFeedback,
    currentSync,
    syncNow,
    mode,
    setMode,
    toggleSessionMode,
    resolveConflictWithLocal,
    resolveConflictWithCloud,
    resolveConflictManual,
    hpPercent,
    proficiency,
    passivePerception,
    sectionConflictLabel,
    quickActions,
    onQuickActionPress,
    selectedTab,
    openTab,
    hasConflictForTab,
    tabOrder: TAB_ORDER,
    tabLabels: TAB_LABELS,
    tabHistory,
    latestTabChange,
    latestTabChangeLabel,
    getHistoryAuthorLabel,
    renderOverviewPlay,
    renderOverviewEdit,
    renderCombatPlay,
    renderCombatEdit,
    renderMagicPlay,
    renderMagicEdit,
    renderInventoryPlay,
    renderInventoryEdit,
    renderNotesPlay,
    renderNotesEdit,
    renderHomebrewPlay,
    renderHomebrewEdit,
    isHpModalVisible,
    setIsHpModalVisible,
    tempCurrentHp,
    setTempCurrentHp,
    tempMaxHp,
    setTempMaxHp,
    saveHpModal,
    isTempHpModalVisible,
    setIsTempHpModalVisible,
    tempShieldInput,
    setTempShieldInput,
    saveTempHp,
    isLevelChangeModalVisible,
    levelChangeTarget,
    levelChangeDraftText,
    setLevelDraftField,
    setLevelDraftStat,
    cancelLevelChange,
    confirmLevelChange,
    isDiceModalVisible,
    setIsDiceModalVisible,
    weaponRollRequest: contextRollRequest,
    closeWeaponRollModal,
    handleContextRollResult,
    isConditionModalVisible,
    setIsConditionModalVisible,
    conditionInput,
    setConditionInput,
    addCondition,
    isQuickNoteModalVisible,
    setIsQuickNoteModalVisible,
    quickNoteInput,
    setQuickNoteInput,
    addQuickSessionNote,
    isSpellQuickModalVisible,
    closeSpellQuickModal,
    quickSpellSearch,
    setQuickSpellSearch,
    quickSpellCandidates,
    pickExistingSpellForQuickAdd,
    quickSpellName,
    setQuickSpellName,
    quickSpellLevel,
    setQuickSpellLevel,
    selectedQuickSpell,
    rollWeaponDamage,
    rollSpellAttack,
    rollSpellDamage,
    spellRollResult,
    preparedSpellsLimit,
    preparedSpellsCount,
    canAddPreparedFromQuickModal,
    isQuickSpellAlreadyPrepared,
    addSpellFromCharacter,
    isRestModalVisible,
    setIsRestModalVisible,
    restStep,
    applyLongRest,
    rollsNeeded,
    rollResults,
    setRollResults,
    diceSides,
    applyShortRestRolls,
  };
}

export type CharacterActionsState = ReturnType<typeof useCharacterActions>;
export type CharacterActionsReadyState = Extract<CharacterActionsState, { isCharacterMissing: false }>;
export type CharacterActionsMissingState = Extract<CharacterActionsState, { isCharacterMissing: true }>;

function getSheetOwners(doc: CharacterSheet | null): { ownerUid: string; owners: string[]; editors: string[] } {
  return {
    ownerUid: typeof doc?.ownerUid === 'string' ? doc.ownerUid : '',
    owners: Array.isArray(doc?.owners) ? doc.owners.filter(Boolean) : [],
    editors: Array.isArray(doc?.editors) ? doc.editors.filter(Boolean) : [],
  };
}




