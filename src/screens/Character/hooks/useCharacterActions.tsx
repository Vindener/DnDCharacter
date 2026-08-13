import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { View, Text, Pressable, TextInput as RNTextInput } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { getStyles } from '../style';
import useThemeStore from '@/context/Theme-store';
import type {
  CharacterCustomField,
  CharacterCustomNotesGroup,
  CharacterCustomResource,
  CharacterViewModel,
  CharacterHomebrewEntry,
  CharacterContentSourceRef,
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
import { fbAuth, timestampToMillis } from '@/services/firebase';
import useSyncStore, { selectSyncByCharacterId, selectSyncStoreActions } from '@/context/Sync-store';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import { trackProductEvent } from '@/shared/services/telemetry/productTelemetry';

// PII rule (CLAUDE.md §8.1): conflict telemetry may only carry a low-cardinality section
// name, never the raw field paths or character id — a dot-path like "homebrew.entries.3"
// could leak structural detail about a specific character's content.
function conflictSectionFromPaths(paths: string[] | undefined): string {
  if (!paths || !paths.length) return 'unknown';
  const sections = new Set(paths.map((path) => path.split('.')[0] || 'unknown'));
  return sections.size === 1 ? [...sections][0] : 'multiple';
}
import { appendQuickSessionNote, isHomebrewCharacter } from '@/shared/helpers/homebrew';
import { parseCharacter } from '@/domain/schemas';
import useTrackerTemplateStore, { SYSTEM_RESOURCE_TEMPLATES } from '@/context/TrackerTemplates-store';
import useAppRoleStore from '@/context/AppRole-store';
import {
  getShareDisplayStatus,
  getSyncDisplayStatus,
  getSyncStatusKind,
  isNetworkOnline,
  mapRoleToHistoryActor,
} from '@/shared/helpers/collaboration/status';
import {
  buildUploadPlan,
  computeRemoteHistorySync,
  reconcileRemoteSnapshot,
  resolveConflict,
  syncToCloud,
} from '@/services/characterSyncCoordinator';
import useSpellbookStore from '@/context/Spellbook-store';
import { applySpellStatus, getPreparedSpellsLimit, normalizeSpellName } from '@/domain/spellbook';
import type { SpellDamageProfile, SpellbookSpell } from '@/types/Spellbook';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { useQuickActions } from './useQuickActions';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import { getStatusToneColors } from '@/shared/styles/statusTones';
import type { DiceRollResult } from '@/shared/services/diceRoller';
import { applyLevelChange, MAX_CHARACTER_LEVEL, MIN_CHARACTER_LEVEL, type LevelChangeDraftValues } from './levelChange';
import { getSrdClassFeaturesAtLevel, getSrdProgressionFeatureNames, getSrdRaceTraits } from '@/domain/srd';
import { CharacterSourceBadge } from '../components/CharacterSourceBadge';
import { isBuiltInRulesSource } from '@/shared/helpers/sourcePresentation';
import { getLocalizedSpellFields } from '@/domain/srd/localization';

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
type Translate = (key: string, options?: Record<string, unknown>) => string;
type SourceFeatureRow = {
  id: string;
  text: string;
  source?: CharacterContentSourceRef;
};
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const MAX_HP = 9999;
const MAX_TEMP_HP = 9999;
const MAX_AC = 30;
const MAX_SPEED = 999;
const MAX_SPELL_SAVE_DC = 30;
const MIN_SPELL_ATTACK_BONUS = -10;
const MAX_SPELL_ATTACK_BONUS = 30;

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

function getConditionHint(value: string, t: Translate): string | undefined {
  const key = normalizeConditionKey(value);
  const normalizedKey = key === 'отруєний' ? 'poisoned' : key === 'збитий' ? 'prone' : key;
  const hint = t(`conditions.${normalizedKey}`, { defaultValue: '' });
  return hint || undefined;
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

function buildDiceRollResultDetails(result: DiceRollResult, t: Translate): string[] {
  const details = [t('rollDetails.formula', { formula: result.formula })];
  if (result.mode === 'advantage' || result.mode === 'disadvantage') {
    details.push(t('rollDetails.rolls', { rolls: result.rolls.join(' / ') }));
    details.push(t('rollDetails.used', { value: result.usedRoll }));
  } else {
    details.push(t('rollDetails.dice', { rolls: result.rolls.join(', ') }));
  }
  details.push(t('rollDetails.modifier', { value: formatSignedModifier(result.modifier) }));
  if (result.proficiencyBonus) details.push(t('rollDetails.proficiency', { value: formatSignedModifier(result.proficiencyBonus) }));
  details.push(t('rollDetails.total', { total: result.total }));
  if (result.isCriticalSuccess) details.push(t('rollDetails.criticalSuccess'));
  if (result.isCriticalFailure) details.push(t('rollDetails.criticalFailure'));
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
      const actorRole: CharacterActorRole | undefined = cast.actorRole === 'DM' || cast.actorRole === 'Player' ? cast.actorRole : undefined;
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
  const { t, i18n } = useTranslation(['character', 'dnd', 'spellbook', 'common']);
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
  const sortLocale = i18n.language === 'uk' ? 'uk' : 'en';
  const tabLabels = useMemo<Record<CharacterTab, string>>(
    () => ({
      Overview: t('tabs.overview'),
      Combat: t('tabs.combat'),
      Magic: t('tabs.magic'),
      Inventory: t('tabs.inventory'),
      Notes: t('tabs.notes'),
      Homebrew: t('tabs.homebrew'),
    }),
    [t],
  );
  const abilityLabel = useCallback((key: keyof CharacterViewModel['stats']) => t(`dnd:abilities.${key}`), [t]);
  const skillLabel = useCallback((key: string) => t(`dnd:skills.${key}`, { defaultValue: key }), [t]);
  const skillRankLabel = useCallback((rank: SkillProficiencyRank) => t(`skillRanks.${rank}`), [t]);
  const spellStatusLabel = useCallback((status: 'available' | 'known' | 'prepared' | 'cantrip') => t(`spellbook:status.${status}`), [t]);

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
  const [syncFeedback, setSyncFeedback] = useState<string>(t('sync.waitingLocalChanges'));
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
    recordRemoteSyncState,
  } = useSyncStore(useShallow(selectSyncStoreActions));
  const roleMode = useAppRoleStore((s) => s.role);
  const userTemplates = useTrackerTemplateStore((s) => s.userTemplates);
  const loadUserTemplates = useTrackerTemplateStore((s) => s.loadUserTemplates);
  const addUserTemplateFromResource = useTrackerTemplateStore((s) => s.addUserTemplateFromResource);
  const removeUserTemplate = useTrackerTemplateStore((s) => s.removeUserTemplate);
  const loadSpellbook = useSpellbookStore((s) => s.loadSpellbook);
  const upsertCustomSpell = useSpellbookStore((s) => s.upsertCustomSpell);
  const spellbookSpells = useSpellbookStore((s) => s.spells);
  const pinnedSpellIds = useSpellbookStore((s) => s.pinnedSpellIds);
  const [sharedHistory, setSharedHistory] = useState<CharacterChangeHistoryEntry[]>([]);
  const netInfo = useNetInfo();
  const isOnline = isNetworkOnline(netInfo.isConnected);

  const [isHpModalVisible, setIsHpModalVisible] = useState(false);
  const [tempCurrentHp, setTempCurrentHp] = useState('0');
  const [tempMaxHp, setTempMaxHp] = useState('0');

  const [isTempHpModalVisible, setIsTempHpModalVisible] = useState(false);
  const [tempShieldInput, setTempShieldInput] = useState('0');

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
  const passivePerception =
    10 +
    computeSkillBonus({
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

    const spellbookByName = new Map((spellbookSpells || []).map((spell) => [normalizeSpellName(spell.name), spell] as const));

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
      const localized = fromSpellbook ? getLocalizedSpellFields(fromSpellbook, i18n.language) : null;
      const status: 'available' | 'known' | 'prepared' | 'cantrip' = normalizedPrepared.has(key)
        ? 'prepared'
        : normalizedCantrips.has(key)
          ? 'cantrip'
          : normalizedKnown.has(key)
            ? 'known'
            : 'available';
      return {
        key,
        name,
        displayName: localized?.name || name,
        status,
        damageProfiles: fromSpellbook?.damageProfiles || [],
        source: fromSpellbook?.source || 'imported',
      };
    });
  }, [
    characterData.spells.cantrips,
    characterData.spells.knownSpells,
    characterData.spells.preparedSpells,
    i18n.language,
    spellbookSpells,
  ]);
  const pinnedMagicSpells = useMemo(
    () => (spellbookSpells || []).filter((spell) => pinnedSpellIds.includes(spell.id)).slice(0, 6),
    [pinnedSpellIds, spellbookSpells],
  );
  const quickSpellCandidates = useMemo(() => {
    const filter = quickSpellSearch.trim().toLowerCase();
    return [...(spellbookSpells || [])]
      .filter((spell) => {
        if (!filter) return true;
        return spell.name.toLowerCase().includes(filter) || spell.school.toLowerCase().includes(filter);
      })
      .sort((a, b) => (a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name, sortLocale)))
      .slice(0, 10);
  }, [quickSpellSearch, sortLocale, spellbookSpells]);
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
  const spellSourceLabel = useCallback(
    (source: SpellbookSpell['source'] | 'imported') => {
      if (isBuiltInRulesSource(source)) return null;
      if (source === 'user-custom') return t('magic.sources.userCustom');
      if (source === 'homebrew') return t('magic.sources.homebrew');
      if (source === 'imported') return t('magic.sources.imported');
      return source;
    },
    [t],
  );
  const conflictPaths = currentSync?.conflictPaths || [];
  const syncStatusLabel = useMemo(() => getSyncDisplayStatus(currentSync, netInfo.isConnected), [currentSync, netInfo.isConnected]);
  const shareStatusLabel = useMemo(
    () => getShareDisplayStatus({ isSharedSheet, role: roleMode, isOwnedByMe }),
    [isOwnedByMe, isSharedSheet, roleMode],
  );
  const formatSyncStatus = useCallback(
    (status: string) => {
      if (status === 'Synced') return t('common:status.synced');
      if (status === 'Pending sync') return t('common:status.pendingSync');
      if (status === 'Offline changes pending') return t('common:status.offlineChanges');
      if (status === 'Conflict detected') return t('common:status.conflictDetected');
      if (status === 'Local only') return t('common:status.localOnly');
      return status;
    },
    [t],
  );
  const formatShareStatus = useCallback(
    (status: string) => {
      if (status === 'Shared with DM') return t('common:status.sharedWithDm');
      if (status === 'Shared with Player') return t('common:status.sharedWithPlayer');
      return status;
    },
    [t],
  );
  const formatChangeSource = useCallback(
    (entry: { uid: string; actorRole?: string | null }) => {
      const currentUid = fbAuth.currentUser?.uid;
      if (currentUid && entry.uid && currentUid === entry.uid) return t('history.sources.you');
      if (entry.actorRole === 'DM') return t('history.sources.dm');
      if (entry.actorRole === 'Player') return t('history.sources.player');
      if (!entry.uid) return t('history.sources.remote');
      return t('history.sources.uid', { uid: entry.uid.slice(0, 6) });
    },
    [t],
  );
  const syncStatusDisplayLabel = useMemo(() => formatSyncStatus(syncStatusLabel), [formatSyncStatus, syncStatusLabel]);
  const shareStatusDisplayLabel = useMemo(
    () => (shareStatusLabel ? formatShareStatus(shareStatusLabel) : null),
    [formatShareStatus, shareStatusLabel],
  );

  useEffect(() => {
    if (isCharacterMissing) return;
    if (currentSync?.status === 'conflict') {
      trackProductEvent('conflict_shown', {
        conflict_section: conflictSectionFromPaths(currentSync.conflictPaths),
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
        setSyncFeedback(exists ? t('sync.cloudConnected') : t('sync.localOnlyCharacter'));
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
        setSyncFeedback(t('sync.localOnlyCharacter'));
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
      setSyncFeedback(exists ? t('sync.cloudConnected') : t('sync.localOnlyCharacter'));
      setCloudAvailability(baseCharacter.id, exists).catch((_error) => {
        /* ignore cloud availability update failure */
      });

      const syncState = useSyncStore.getState().syncByCharacter[baseCharacter.id];
      if (!exists) return;

      const remoteDto = ensureCharacterDefaults(mapCloudCharacterToLocalDto(doc as Record<string, unknown>));
      // COL-5: entry.atMs is the writer device's own clock — comparing it against this
      // device's lastSyncAt compared two different clocks and broke under skew. Diff against
      // already-seen entry ids instead (clock-independent, see computeRemoteHistorySync).
      const { remotePathsSinceLastSync, seenHistoryEntryIds } = computeRemoteHistorySync({
        history,
        selfUid: me,
        seenHistoryEntryIds: syncState?.seenHistoryEntryIds,
      });

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
        setSyncFeedback(t('sync.conflictNeedsReview'));
        return;
      }

      // Not for 'conflict' — leave those entries "unseen" until the conflict is resolved.
      const serverSyncAtMs = timestampToMillis(doc?.lastChangeAt);
      recordRemoteSyncState(baseCharacter.id, { seenHistoryEntryIds, serverSyncAtMs }).catch((_error) => {
        /* ignore cursor persist failure */
      });

      if (reconciled.action === 'merge') {
        setCharacterData(reconciled.character);
        setSyncFeedback(t('sync.cloudSectionMerged'));
        return;
      }

      if (reconciled.action === 'replace') {
        setCharacterData(reconciled.character);
        void updateCharacter(reconciled.character.id, reconciled.character);
        markCloudDownloaded(reconciled.character.id).catch((_error) => {
          /* ignore cloud download marker failure */
        });
        setSyncFeedback(t('sync.latestCloudLoaded'));
        if (reconciled.remotePathsSinceLastSync.length) {
          setSyncTransport(reconciled.character.id, 'downloading', t('sync.latestCloudLoaded')).catch((_error) => {
            /* ignore sync transport update failure */
          });
        }
      }
    });

    return () => {
      alive = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [
    baseCharacter.id,
    isCharacterMissing,
    markCloudDownloaded,
    markConflict,
    recordRemoteSyncState,
    setCloudAvailability,
    setSyncTransport,
    updateCharacter,
  ]);

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
      const offlineMessage = t('sync.offlineQueue', { count: uploadPlan.pendingCount });
      setSyncFeedback(offlineMessage);
      setSyncTransport(characterData.id, 'idle', offlineMessage).catch(() => {});
      return;
    }

    const actorRole: CharacterActorRole = mapRoleToHistoryActor(roleMode);
    setSyncFeedback(t('sync.uploadingLocalChanges'));
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
        syncingMessage: t('sync.uploadingLocalChanges'),
        syncedMessage: t('sync.autoSynced'),
        conflictFallbackPath: 'overview.identity',
      }).then((result) => {
        if (result.status === 'synced') {
          setSyncFeedback(t('sync.autoSynced'));
          return;
        }

        const loweredMessage = String(result.message || '').toLowerCase();
        setSyncFeedback(loweredMessage.includes('network') ? t('sync.retryAfterNetworkError') : t('sync.syncErrorRetry'));
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

  const patchCharacter = useCallback(
    (patcher: (prev: CharacterViewModel) => CharacterViewModel, changedPaths?: string[]) => {
      if (isCharacterMissing) return;
      setCharacterData((prev) => ensureCharacterDefaults(patcher(prev)));
      const paths = changedPaths && changedPaths.length ? changedPaths : [TAB_DEFAULT_PATH[selectedTab]];
      markLocalDraftPaths(baseCharacter.id, paths).catch((_error) => {
        /* ignore local draft mark failure */
      });
    },
    [baseCharacter.id, isCharacterMissing, markLocalDraftPaths, selectedTab],
  );

  const openLevelChangeModal = useCallback(
    (delta: number) => {
      const safeCurrentLevel = clamp(Number(characterData.level) || MIN_CHARACTER_LEVEL, MIN_CHARACTER_LEVEL, MAX_CHARACTER_LEVEL);
      const safeTargetLevel = clamp(safeCurrentLevel + delta, MIN_CHARACTER_LEVEL, MAX_CHARACTER_LEVEL);
      if (safeTargetLevel === safeCurrentLevel) return;

      setLevelChangeTarget(safeTargetLevel);
      setLevelChangeDraftText(
        buildLevelChangeDraftText(characterData, characterData.proficiencyBonus ?? buildProficiencyByLevel(characterData.level)),
      );
      setIsLevelChangeModalVisible(true);
    },
    [characterData],
  );

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

  const setNotesGroup = useCallback(
    (groupId: string, value: string) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          customNotesGroups: (prev.customNotesGroups || []).map((group) => {
            if (group.id !== groupId) return group;
            return { ...group, content: value };
          }),
        }),
        ['homebrew.notes-groups'],
      );
    },
    [patchCharacter],
  );

  const addNotesGroup = useCallback(() => {
    patchCharacter(
      (prev) => {
        const nextOrder = (prev.customNotesGroups || []).length;
        const nextGroup: CharacterCustomNotesGroup = {
          id: `notes-group-${Date.now()}`,
          title: t('defaults.customNotesGroup'),
          content: '',
          order: nextOrder,
          origin: 'custom',
        };
        return {
          ...prev,
          customNotesGroups: [...(prev.customNotesGroups || []), nextGroup],
        };
      },
      ['homebrew.notes-groups'],
    );
  }, [patchCharacter, t]);

  const updateNotesGroupMeta = useCallback(
    (groupId: string, patch: Partial<CharacterCustomNotesGroup>) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          customNotesGroups: (prev.customNotesGroups || []).map((group) => {
            if (group.id !== groupId) return group;
            return { ...group, ...patch };
          }),
        }),
        ['homebrew.notes-groups'],
      );
    },
    [patchCharacter],
  );

  const removeNotesGroup = useCallback(
    (groupId: string) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          customNotesGroups: (prev.customNotesGroups || [])
            .filter((group) => group.id !== groupId)
            .map((group, index) => ({ ...group, order: index })),
        }),
        ['homebrew.notes-groups'],
      );
    },
    [patchCharacter],
  );

  const applyHpDelta = useCallback(
    (delta: number) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          hp: {
            ...prev.hp,
            current: clamp(prev.hp.current + delta, 0, prev.hp.max),
          },
        }),
        ['combat.hp'],
      );
    },
    [patchCharacter],
  );

  const openHpModal = useCallback(() => {
    setTempCurrentHp(String(characterData.hp.current));
    setTempMaxHp(String(characterData.hp.max));
    setIsHpModalVisible(true);
  }, [characterData.hp.current, characterData.hp.max]);

  const saveHpModal = useCallback(() => {
    const nextMax = clamp(parseNumber(tempMaxHp, characterData.hp.max), 1, MAX_HP);
    const nextCurrent = clamp(parseNumber(tempCurrentHp, characterData.hp.current), 0, nextMax);

    patchCharacter(
      (prev) => ({
        ...prev,
        hp: {
          ...prev.hp,
          max: nextMax,
          current: nextCurrent,
        },
      }),
      ['combat.hp'],
    );

    setIsHpModalVisible(false);
  }, [characterData.hp.current, characterData.hp.max, patchCharacter, tempCurrentHp, tempMaxHp]);

  const saveTempHp = useCallback(() => {
    const value = clamp(parseNumber(tempShieldInput, characterData.hp.temp), 0, MAX_TEMP_HP);
    patchCharacter(
      (prev) => ({
        ...prev,
        hp: {
          ...prev.hp,
          temp: value,
        },
      }),
      ['combat.hp'],
    );
    setTempShieldInput('0');
    setIsTempHpModalVisible(false);
  }, [characterData.hp.temp, patchCharacter, tempShieldInput]);

  const applyLongRest = useCallback(() => {
    const { sides } = parseDice(characterData.hitDice || '0d0');

    patchCharacter(
      (prev) => {
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
      },
      ['combat.rest', 'combat.hp', 'magic.slots', 'homebrew.resources'],
    );

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

    patchCharacter(
      (prev) => {
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
      },
      ['combat.rest', 'combat.hp', 'homebrew.resources'],
    );

    setIsRestModalVisible(false);
  }, [characterData.hitDice, characterData.stats.constitution, patchCharacter, rollResults]);

  const openContextRoll = useCallback((request: ContextRollRequest) => {
    setContextRollRequest(request);
  }, []);

  const rollAbilityCheck = useCallback(
    (label: string, baseModifier: number) => {
      openContextRoll({
        kind: 'ability',
        title: `${label} Check`,
        label,
        baseModifier,
      });
    },
    [openContextRoll],
  );

  const rollSavingThrow = useCallback(
    (label: string, baseModifier: number, proficient: boolean) => {
      openContextRoll({
        kind: 'saving-throw',
        title: `${label} Save`,
        label,
        baseModifier,
        proficient,
      });
    },
    [openContextRoll],
  );

  const rollSkillCheck = useCallback(
    (label: string, baseModifier: number, rank?: SkillProficiencyRank) => {
      openContextRoll({
        kind: 'skill',
        title: `${label} Check`,
        label,
        baseModifier,
        rank,
      });
    },
    [openContextRoll],
  );

  const toggleSavingThrowProficiency = useCallback(
    (stat: keyof CharacterViewModel['savingThrows']) => {
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
    },
    [patchCharacter],
  );

  const cycleSkillRank = useCallback(
    (skill: keyof CharacterViewModel['skills']) => {
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
    },
    [patchCharacter],
  );

  const rollWeaponAttack = useCallback(
    (weapon: NonNullable<CharacterViewModel['weapons']>[number]) => {
      openContextRoll({ kind: 'weapon-attack', weapon });
    },
    [openContextRoll],
  );

  const rollWeaponDamage = useCallback(
    (weapon: NonNullable<CharacterViewModel['weapons']>[number]) => {
      openContextRoll({ kind: 'weapon-damage', weapon });
    },
    [openContextRoll],
  );

  const closeWeaponRollModal = useCallback(() => {
    setContextRollRequest(null);
  }, []);

  const handleContextRollResult = useCallback(
    (result: DiceRollResult) => {
      if (!contextRollRequest) return;
      const details = buildDiceRollResultDetails(result, t);

      if (contextRollRequest.kind === 'ability' || contextRollRequest.kind === 'saving-throw' || contextRollRequest.kind === 'skill') {
        setAbilityRollResult({
          title: contextRollRequest.title,
          details,
        });
      } else if (contextRollRequest.kind === 'weapon-attack') {
        setWeaponRollResult({
          title: t('modals.roll.hitLabel', { weapon: contextRollRequest.weapon.name || t('modals.roll.weaponFallback') }),
          details,
        });
        setSpellRollResult(null);
      } else if (contextRollRequest.kind === 'weapon-damage') {
        setWeaponRollResult({
          title: t('modals.roll.damageLabel', { weapon: contextRollRequest.weapon.name || t('modals.roll.weaponFallback') }),
          details,
        });
        setSpellRollResult(null);
      } else if (contextRollRequest.kind === 'spell-attack') {
        setSpellRollResult({
          title: t('modals.roll.spellAttackLabel', { spell: contextRollRequest.spellName }),
          details,
        });
        setWeaponRollResult(null);
      } else if (contextRollRequest.kind === 'spell-damage') {
        setSpellRollResult({
          title: t('modals.roll.spellDamageLabel', { spell: contextRollRequest.spellName }),
          details: [
            t('rollDetails.profile', { profile: contextRollRequest.profile.label }),
            t('rollDetails.damageType', { type: contextRollRequest.profile.damageType }),
            ...details,
            contextRollRequest.profile.condition ? t('rollDetails.condition', { condition: contextRollRequest.profile.condition }) : '',
          ].filter(Boolean),
        });
        setWeaponRollResult(null);
      }
    },
    [contextRollRequest, t],
  );

  const rollSpellAttack = useCallback(
    (spellName: string) => {
      const baseModifier = Number.isFinite(Number(characterData.spells.spellAttackBonus))
        ? Number(characterData.spells.spellAttackBonus)
        : 0;
      setIsSpellQuickModalVisible(false);
      openContextRoll({ kind: 'spell-attack', spellName, baseModifier });
    },
    [characterData.spells.spellAttackBonus, openContextRoll],
  );

  const rollSpellDamage = useCallback(
    (spellName: string, profile: SpellDamageProfile) => {
      setIsSpellQuickModalVisible(false);
      openContextRoll({ kind: 'spell-damage', spellName, profile });
    },
    [openContextRoll],
  );

  const addCondition = useCallback(() => {
    const value = conditionInput.trim();
    if (!value) return;

    patchCharacter(
      (prev) => ({
        ...prev,
        conditions: [...(prev.conditions || []), value],
      }),
      ['overview.conditions'],
    );

    setConditionInput('');
    setIsConditionModalVisible(false);
  }, [conditionInput, patchCharacter]);

  const removeCondition = useCallback(
    (index: number) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          conditions: (prev.conditions || []).filter((_, idx) => idx !== index),
        }),
        ['overview.conditions'],
      );
    },
    [patchCharacter],
  );

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
        weapons: [...(prev.weapons || []), { name: t('defaults.newWeapon'), attackBonus: 0, damage: '1d6' }],
      }),
      ['combat.weapons'],
    );
  }, [patchCharacter, t]);

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
          title: t('modals.spell.preparedLimitTitle'),
          details: [t('modals.spell.preparedLimitMessage', { count: preparedSpellsCount, limit: preparedSpellsLimit })],
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
        school: t('defaults.customSpellSchool'),
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
      t,
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
      label: t('defaults.customField'),
      type: 'text',
      value: '',
    };

    patchCharacter(
      (prev) => ({
        ...prev,
        customFields: [...(prev.customFields || []), newField],
      }),
      ['homebrew.fields'],
    );
  }, [patchCharacter, t]);

  const updateCustomField = useCallback(
    (fieldId: string, patch: Partial<CharacterCustomField>) => {
      patchCharacter(
        (prev) => ({
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
              return { ...merged, options, value: options.includes(value) ? value : options[0] || '' };
            }
            return { ...merged, value: String(merged.value ?? '') };
          }),
        }),
        ['homebrew.fields'],
      );
    },
    [patchCharacter],
  );

  const removeCustomField = useCallback(
    (fieldId: string) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          customFields: (prev.customFields || []).filter((field) => field.id !== fieldId),
        }),
        ['homebrew.fields'],
      );
    },
    [patchCharacter],
  );

  const addResource = useCallback(() => {
    const resource: CharacterCustomResource = {
      id: Date.now().toString(),
      label: t('defaults.customResource'),
      current: 0,
      max: 10,
      resetRule: 'none',
    };

    patchCharacter(
      (prev) => ({
        ...prev,
        customResources: [...(prev.customResources || []), resource],
      }),
      ['homebrew.resources'],
    );
  }, [patchCharacter, t]);

  const updateResource = useCallback(
    (resourceId: string, patch: Partial<CharacterCustomResource>) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          customResources: (prev.customResources || []).map((resource) => {
            if (resource.id !== resourceId) return resource;
            return { ...resource, ...patch };
          }),
        }),
        ['homebrew.resources'],
      );
    },
    [patchCharacter],
  );

  const removeResource = useCallback(
    (resourceId: string) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          customResources: (prev.customResources || []).filter((resource) => resource.id !== resourceId),
        }),
        ['homebrew.resources'],
      );
    },
    [patchCharacter],
  );

  const saveUserTemplateFromResource = useCallback(
    (resource: CharacterCustomResource) => {
      addUserTemplateFromResource(resource, resource.label).catch(() => {});
    },
    [addUserTemplateFromResource],
  );

  const applyResourceTemplate = useCallback(
    (resource: Omit<CharacterCustomResource, 'id'>) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          customResources: [
            ...(prev.customResources || []),
            {
              ...resource,
              id: `resource-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
            },
          ],
        }),
        ['homebrew.resources'],
      );
    },
    [patchCharacter],
  );

  const addCustomSection = useCallback(() => {
    patchCharacter(
      (prev) => ({
        ...prev,
        customSections: [
          ...(prev.customSections || []),
          {
            id: `custom-section-${Date.now()}`,
            title: t('defaults.customSection'),
            content: '',
          },
        ],
      }),
      ['homebrew.sections'],
    );
  }, [patchCharacter, t]);

  const updateCustomSection = useCallback(
    (sectionId: string, patch: Partial<NonNullable<CharacterViewModel['customSections']>[number]>) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          customSections: (prev.customSections || []).map((section) => {
            if (section.id !== sectionId) return section;
            return { ...section, ...patch };
          }),
        }),
        ['homebrew.sections'],
      );
    },
    [patchCharacter],
  );

  const removeCustomSection = useCallback(
    (sectionId: string) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          customSections: (prev.customSections || []).filter((section) => section.id !== sectionId),
        }),
        ['homebrew.sections'],
      );
    },
    [patchCharacter],
  );

  const addHomebrewEntry = useCallback(
    (kind: CharacterHomebrewEntry['kind']) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          homebrewEntries: [
            ...(prev.homebrewEntries || []),
            {
              id: `homebrew-entry-${Date.now()}`,
              kind,
              name: t('defaults.customEntryName', { kind }),
              description: '',
              tags: [],
            },
          ],
        }),
        ['homebrew.entries'],
      );
    },
    [patchCharacter, t],
  );

  const updateHomebrewEntry = useCallback(
    (entryId: string, patch: Partial<CharacterHomebrewEntry>) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          homebrewEntries: (prev.homebrewEntries || []).map((entry) => {
            if (entry.id !== entryId) return entry;
            if (patch.tags && !Array.isArray(patch.tags)) return entry;
            return { ...entry, ...patch };
          }),
        }),
        ['homebrew.entries'],
      );
    },
    [patchCharacter],
  );

  const removeHomebrewEntry = useCallback(
    (entryId: string) => {
      patchCharacter(
        (prev) => ({
          ...prev,
          homebrewEntries: (prev.homebrewEntries || []).filter((entry) => entry.id !== entryId),
        }),
        ['homebrew.entries'],
      );
    },
    [patchCharacter],
  );

  const resolveConflictWithLocal = useCallback(() => {
    trackProductEvent('conflict_resolved_local', { conflict_section: conflictSectionFromPaths(currentSync?.conflictPaths) });
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
        setSyncFeedback(t('sync.conflictResolvedLocal'));
        return;
      }
      if (result.status === 'error') {
        setSyncFeedback(t('sync.conflictResolveLocalFailed'));
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
    trackProductEvent('conflict_resolved_cloud', { conflict_section: conflictSectionFromPaths(currentSync?.conflictPaths) });
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
        recordRemoteSyncState,
      },
      isOnline,
      normalizeCharacter: ensureCharacterDefaults,
    }).then((result) => {
      if (result.status === 'resolved-cloud') {
        setCharacterData(result.targetCharacter);
        void updateCharacter(result.targetCharacter.id, result.targetCharacter);
        setSyncFeedback(t('sync.conflictResolvedCloud'));
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
    recordRemoteSyncState,
    roleMode,
    setCloudAvailability,
    setSyncTransport,
    updateCharacter,
  ]);

  const resolveConflictManual = useCallback(() => {
    trackProductEvent('conflict_resolved_later', { conflict_section: conflictSectionFromPaths(currentSync?.conflictPaths) });
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
      setSyncFeedback(t('sync.conflictDeferred'));
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
      setSyncFeedback(t('sync.signInRequired'));
      return;
    }
    if (!isOnline) {
      setSyncFeedback(t('sync.offlineQueueActive'));
      return;
    }

    const uploadPlan = buildUploadPlan({
      syncState: currentSync,
      fallbackPath: TAB_DEFAULT_PATH[selectedTab],
    });

    setSyncFeedback(t('sync.syncing'));
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
      syncingMessage: t('sync.syncing'),
      syncedMessage: t('sync.synced'),
      conflictFallbackPath: TAB_DEFAULT_PATH[selectedTab],
    }).then((result) => {
      if (result.status === 'synced') {
        setIsCloudDoc(true);
        setSyncFeedback(t('sync.synced'));
        return;
      }
      if (result.status === 'error') {
        setSyncFeedback(t('sync.syncErrorWithMessage', { message: result.message }));
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
    openDiceRoller: () => navigation.navigate('DiceRoller'),
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

  const sourceFeatureRows = useMemo<SourceFeatureRow[]>(() => {
    const rows: SourceFeatureRow[] = [];
    const featureSources = characterData.contentSources?.featuresAndTraits || [];
    const seen = new Set<string>();
    const pushRow = (id: string, text: string, source?: CharacterContentSourceRef) => {
      const safeText = String(text || '').trim();
      if (!safeText || seen.has(safeText.toLowerCase())) return;
      seen.add(safeText.toLowerCase());
      rows.push({ id, text: safeText, source });
    };

    (characterData.featuresAndTraits || []).forEach((feature, index) => {
      pushRow(`saved-${index}`, feature, featureSources[index]);
    });

    getSrdRaceTraits(characterData.raceId, characterData.subraceId).forEach((trait) => {
      pushRow(`race-${trait.id}`, `${trait.name}: ${trait.summary}`, {
        origin: 'srd-5.1',
        source: 'srd-5.1',
        license: 'ogl-1.0a',
        id: trait.id,
        name: trait.name,
      });
    });

    getSrdClassFeaturesAtLevel(characterData.classId, characterData.level).forEach((feature) => {
      pushRow(`class-${feature.id}`, `${feature.name}: ${feature.summary}`, {
        origin: 'srd-5.1',
        source: 'srd-5.1',
        license: 'ogl-1.0a',
        id: feature.id,
        name: feature.name,
      });
    });

    getSrdProgressionFeatureNames(characterData.classId, characterData.level).forEach((feature, index) => {
      pushRow(`progression-${index}-${feature}`, feature, {
        origin: 'srd-5.1',
        source: 'srd-5.1',
        license: 'ogl-1.0a',
        id: characterData.classId,
        name: feature,
      });
    });

    if (!rows.length && characterData.contentSources?.class) {
      pushRow('class-source', characterData.contentSources.class.name || characterData.class, characterData.contentSources.class);
    }

    return rows;
  }, [
    characterData.class,
    characterData.classId,
    characterData.contentSources,
    characterData.featuresAndTraits,
    characterData.level,
    characterData.raceId,
    characterData.subraceId,
  ]);

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

    pushBadge(syncStatusDisplayLabel, getSyncStatusKind(syncStatusLabel));
    if (shareStatusDisplayLabel) pushBadge(shareStatusDisplayLabel, 'accent');
    if (!isCloudDoc) pushBadge(t('badges.localOnly'), 'neutral');
    if (hasHomebrew) pushBadge(t('badges.homebrew'), 'warning');
    if (!isOnline) pushBadge(t('badges.offline'), 'warning');
    return badges;
  }, [hasHomebrew, isCloudDoc, isOnline, shareStatusDisplayLabel, syncStatusDisplayLabel, syncStatusLabel, t]);

  const hasConflictForPrefixes = useCallback(
    (prefixes: string[]) => {
      if (!conflictPaths.length) return false;
      return conflictPaths.some((path) => prefixes.some((prefix) => path.startsWith(prefix)));
    },
    [conflictPaths],
  );

  const hasConflictForTab = useCallback(
    (tab: CharacterTab) => {
      return hasConflictForPrefixes([TAB_PATH_PREFIX[tab]]);
    },
    [hasConflictForPrefixes],
  );

  const sectionConflictLabel = useCallback(
    (prefixes: string[]) => {
      if (!hasConflictForPrefixes(prefixes)) return null;
      return (
        <View style={styles.sectionConflictBadge}>
          <Text style={styles.sectionConflictBadgeText}>{t('badges.conflict')}</Text>
        </View>
      );
    },
    [hasConflictForPrefixes, styles.sectionConflictBadge, styles.sectionConflictBadgeText],
  );

  const tabHistory = useMemo(() => {
    if (!isSharedSheet) return [];
    return sharedHistory
      .filter((entry) => entry.tab === selectedTab)
      .slice()
      .sort((a, b) => (b.atMs || 0) - (a.atMs || 0))
      .slice(0, 8);
  }, [isSharedSheet, selectedTab, sharedHistory]);

  const latestTabChange = tabHistory[0];
  const latestTabChangeLabel = latestTabChange ? formatChangeSource(latestTabChange) : null;
  const getHistoryAuthorLabel = useCallback((entry: CharacterChangeHistoryEntry) => formatChangeSource(entry), [formatChangeSource]);

  const openTab = useCallback((tab: CharacterTab) => setSelectedTab(tab), []);
  const toggleSecondary = useCallback((tab: CharacterTab) => {
    setCollapsedSecondary((prev) => ({ ...prev, [tab]: !prev[tab] }));
  }, []);

  const renderBadge = useCallback(
    (badge: SyncBadge) => {
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
    },
    [colors, styles.badge, styles.badgeText],
  );

  const renderSourceBadge = useCallback(
    (source: CharacterContentSourceRef | undefined, id: string) => {
      return <CharacterSourceBadge source={source} id={id} styles={styles} />;
    },
    [styles],
  );

  const renderFeatureRows = useCallback(
    (rows: SourceFeatureRow[]) => {
      if (!rows.length) return <Text style={styles.blockText}>{t('empty.none')}</Text>;
      return rows.map((row) => (
        <View key={row.id} style={styles.sourceFeatureRow}>
          <View style={styles.sourceFeatureHeader}>
            <Text style={styles.sourceFeatureText}>{row.text}</Text>
            {renderSourceBadge(row.source, row.id)}
          </View>
        </View>
      ));
    },
    [renderSourceBadge, styles.blockText, styles.sourceFeatureHeader, styles.sourceFeatureRow, styles.sourceFeatureText, t],
  );

  const renderConditionList = (emptyLabel: string) =>
    characterData.conditions?.length ? (
      characterData.conditions.map((condition, idx) => {
        const hint = getConditionHint(condition, t);
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
          <Text style={styles.sectionTitle}>{t('overview.abilityScores')}</Text>
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
                <Text style={styles.rollHintText}>{t('actions.roll')}</Text>
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
            <Text style={styles.sectionTitle}>{t('overview.savesAndSkills')}</Text>
            {sectionConflictLabel(['overview.saving-throws', 'overview.skills', 'overview.conditions'])}
          </View>
          <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Overview')} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.collapseButtonText}>{collapsedSecondary.Overview ? t('actions.expand') : t('actions.collapse')}</Text>
          </Pressable>
        </View>

        <Text style={styles.subSectionTitle}>{t('overview.savingThrows')}</Text>
        {STAT_LABELS.map((stat) => {
          const proficient = Boolean(characterData.savingThrows?.[stat.key]);
          const baseMod = calculateModifier(characterData.stats[stat.key] || 10);
          const total = baseMod + (proficient ? proficiency : 0);
          return (
            <Pressable
              key={`save-${stat.key}`}
              style={styles.actionRowLine}
              onPress={() => rollSavingThrow(abilityLabel(stat.key), baseMod, proficient)}
              android_ripple={{ color: colors.ripple }}
              testID={`character.save.${stat.key}`}
            >
              <Text style={styles.rowLabel}>{t('overview.saveLabel', { ability: abilityLabel(stat.key) })}</Text>
              {proficient ? (
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>{skillRankLabel('proficient')}</Text>
                </View>
              ) : null}
              <Text style={styles.rowValue}>{formatBonus(total)}</Text>
              <Text style={styles.rollPill}>{t('actions.roll')}</Text>
            </Pressable>
          );
        })}

        <Text style={styles.subSectionTitle}>{t('overview.skills')}</Text>
        {sortedSkills.slice(0, collapsedSecondary.Overview ? 8 : sortedSkills.length).map(([skill, value]) => {
          const rank = characterData.skillProficiencies?.[skill];
          const rankLabel = rank ? skillRankLabel(rank) : hasSkillMetadata ? skillRankLabel('none') : t('skillRanks.saved');
          return (
            <Pressable
              key={skill}
              style={styles.actionRowLine}
              onPress={() => rollSkillCheck(skillLabel(skill), value, rank)}
              android_ripple={{ color: colors.ripple }}
              testID={`character.skill.${skill}`}
            >
              <Text style={styles.rowLabel}>{skillLabel(skill)}</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>{rankLabel}</Text>
              </View>
              <Text style={styles.rowValue}>{formatBonus(value)}</Text>
              <Text style={styles.rollPill}>{t('actions.roll')}</Text>
            </Pressable>
          );
        })}

        {!collapsedSecondary.Overview && (
          <>
            <Text style={styles.subSectionTitle}>{t('overview.passivePerception')}</Text>
            <Text style={styles.blockText}>{passivePerception}</Text>
            <Text style={styles.subSectionTitle}>{t('overview.proficiencies')}</Text>
            <Text style={styles.blockText}>
              {characterData.proficiencies.length ? characterData.proficiencies.join(', ') : t('empty.none')}
            </Text>
            <Text style={styles.subSectionTitle}>{t('overview.features')}</Text>
            {renderFeatureRows(sourceFeatureRows)}
            <Text style={styles.subSectionTitle}>{t('overview.conditions')}</Text>
            {renderConditionList(t('empty.noActiveConditions'))}
          </>
        )}
      </View>
    </>
  );

  const renderCombatPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{t('combat.tools')}</Text>
          {sectionConflictLabel(['combat.core', 'combat.hp', 'combat.rest'])}
        </View>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Combat')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Combat ? t('actions.expand') : t('actions.collapse')}</Text>
        </Pressable>
      </View>

      <Text style={styles.subSectionTitle}>{t('combat.actions')}</Text>
      <Text style={styles.blockText}>
        {characterData.combatTemplates?.actions?.length
          ? `• ${characterData.combatTemplates.actions.join('\n• ')}`
          : t('combat.noActionTemplates')}
      </Text>
      <Text style={styles.subSectionTitle}>{t('combat.bonusActions')}</Text>
      <Text style={styles.blockText}>
        {characterData.combatTemplates?.bonusActions?.length
          ? `• ${characterData.combatTemplates.bonusActions.join('\n• ')}`
          : t('combat.noBonusActionTemplates')}
      </Text>
      <Text style={styles.subSectionTitle}>{t('combat.reactions')}</Text>
      <Text style={styles.blockText}>
        {characterData.combatTemplates?.reactions?.length
          ? `• ${characterData.combatTemplates.reactions.join('\n• ')}`
          : t('combat.noReactionTemplates')}
      </Text>

      <Text style={styles.subSectionTitle}>{t('combat.attacks')}</Text>
      {characterData.weapons?.length ? (
        characterData.weapons.map((weapon, idx) => {
          const attackBonus = Number.isFinite(Number(weapon.attackBonus)) ? Number(weapon.attackBonus) : 0;
          const damageFormula = String(weapon.damage || '1d6');
          return (
            <View key={`${weapon.name}-${idx}`} style={styles.weaponCombatCard}>
              <View style={styles.rowLine}>
                <Text style={styles.rowLabel}>{weapon.name || t('combat.weaponFallback', { index: idx + 1 })}</Text>
                <Text style={styles.rowValue}>{`${attackBonus >= 0 ? '+' : ''}${attackBonus} / ${damageFormula}`}</Text>
              </View>
              <View style={styles.weaponActionRow}>
                <Pressable
                  style={[styles.weaponActionButton, styles.weaponActionButtonPrimary]}
                  onPress={() => rollWeaponAttack(weapon)}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Text style={styles.weaponActionText}>{t('modals.roll.attackD20')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.weaponActionButton, styles.weaponActionButtonSecondary]}
                  onPress={() => rollWeaponDamage(weapon)}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Text style={styles.weaponActionText}>{t('modals.roll.damageFormula', { formula: damageFormula })}</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      ) : (
        <Text style={styles.blockTextMuted}>{t('combat.noWeapons')}</Text>
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
          <Text style={styles.subSectionTitle}>{t('combat.deathSaves')}</Text>
          <Text style={styles.blockText}>
            {t('combat.deathSaveCounts', {
              successes: characterData.deathSaves?.successes ?? 0,
              failures: characterData.deathSaves?.failures ?? 0,
            })}
          </Text>
          <Text style={styles.subSectionTitle}>{t('combat.conditions')}</Text>
          {renderConditionList(t('empty.noActiveCombatConditions'))}
          <Text style={styles.subSectionTitle}>{t('combat.notes')}</Text>
          <Text style={styles.blockText}>{sessionNotes || t('empty.noSessionNotes')}</Text>
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
      characterData.spells.spellcastingAbility ||
      slotLevels.length ||
      characterData.spells.cantrips.length ||
      characterData.spells.knownSpells.length ||
      characterData.spells.preparedSpells.length,
    );
    const concentration = (characterData.conditions || []).find((condition) => {
      const key = normalizeConditionKey(condition);
      return key.includes('concentration') || key.includes('концентра');
    });

    return (
      <View style={styles.cardSecondary}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{t('magic.title')}</Text>
            {sectionConflictLabel(['magic.'])}
          </View>
          <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Magic')} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.collapseButtonText}>{collapsedSecondary.Magic ? t('actions.expand') : t('actions.collapse')}</Text>
          </Pressable>
        </View>

        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>{t('magic.spellcasting')}</Text>
          <Text style={styles.rowValue}>{characterData.spells.spellcastingAbility || '—'}</Text>
        </View>
        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>{t('magic.dc')}</Text>
          <Text style={styles.rowValue}>{characterData.spells.spellSaveDC || 0}</Text>
        </View>
        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>{t('magic.attackBonus')}</Text>
          <Text style={styles.rowValue}>
            {characterData.spells.spellAttackBonus >= 0
              ? `+${characterData.spells.spellAttackBonus}`
              : characterData.spells.spellAttackBonus}
          </Text>
        </View>
        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>{t('magic.concentration')}</Text>
          <Text style={styles.rowValue}>{concentration || (hasCasterSetup ? t('empty.none') : t('magic.notCaster'))}</Text>
        </View>

        {!hasCasterSetup ? <Text style={styles.blockTextMuted}>{t('magic.nonCasterHint')}</Text> : null}

        <Text style={styles.subSectionTitle}>{t('magic.slots')}</Text>
        {slotLevels.length ? (
          slotLevels.map((level) => {
            const slot = characterData.spells.spellSlots[level];
            if (!slot) return null;
            return (
              <View key={`slot-${level}`} style={styles.rowLine}>
                <Text style={styles.rowLabel}>{t('magic.slotLevel', { level })}</Text>
                <Text style={styles.rowValue}>
                  {Math.max(slot.max - slot.used, 0)}/{slot.max}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.blockTextMuted}>{t('magic.noSlots')}</Text>
        )}

        <Pressable style={styles.secondaryAction} onPress={openPreparedSpellbook} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryActionText}>{t('magic.openSpellbook')}</Text>
        </Pressable>

        <Text style={styles.subSectionTitle}>{t('magic.pinnedSpells')}</Text>
        {pinnedMagicSpells.length ? (
          pinnedMagicSpells.map((spell) => {
            const display = getLocalizedSpellFields(spell, i18n.language);
            return (
              <View key={`magic-pinned-${spell.id}`} style={styles.weaponCombatCard}>
                <View style={styles.rowLine}>
                  <Text style={styles.rowLabel}>{display.name}</Text>
                  <Text style={styles.rowValue}>
                    {spell.level === 0 ? t('magic.cantrip') : t('magic.slotLevel', { level: spell.level })}
                    {spellSourceLabel(spell.source) ? ` · ${spellSourceLabel(spell.source)}` : ''}
                  </Text>
                </View>
                <Text style={styles.blockTextMuted}>
                  {display.school} · {display.castingTime || '—'} · {display.range || '—'}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.blockTextMuted}>{t('magic.noPinnedSpells')}</Text>
        )}

        <Text style={styles.subSectionTitle}>{t('magic.spellRolls')}</Text>
        {magicCombatSpells.length ? (
          magicCombatSpells.map((spell) => {
            const defaultProfile = spell.damageProfiles[0];
            return (
              <View key={`magic-combat-${spell.key}`} style={styles.weaponCombatCard}>
                <View style={styles.rowLine}>
                  <Text style={styles.rowLabel}>{spell.displayName}</Text>
                  <Text style={styles.rowValue}>
                    {spellStatusLabel(spell.status)}
                    {spellSourceLabel(spell.source) ? ` · ${spellSourceLabel(spell.source)}` : ''}
                    {defaultProfile ? ` • ${defaultProfile.formula}` : ''}
                  </Text>
                </View>
                <View style={styles.weaponActionRow}>
                  <Pressable
                    style={[styles.weaponActionButton, styles.weaponActionButtonPrimary]}
                    onPress={() => rollSpellAttack(spell.name)}
                    android_ripple={{ color: colors.ripple }}
                  >
                    <Text style={styles.weaponActionText}>{t('modals.roll.attackD20')}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.weaponActionButton, styles.weaponActionButtonSecondary, !defaultProfile ? { opacity: 0.45 } : null]}
                    onPress={() => defaultProfile && rollSpellDamage(spell.name, defaultProfile)}
                    android_ripple={{ color: colors.ripple }}
                    disabled={!defaultProfile}
                  >
                    <Text style={styles.weaponActionText}>
                      {defaultProfile
                        ? t('modals.roll.damageFormula', { formula: defaultProfile.formula })
                        : t('modals.roll.damageNoProfile')}
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
                        {t('modals.roll.damageProfile', { label: profile.label, formula: profile.formula, type: profile.damageType })}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            );
          })
        ) : (
          <Text style={styles.blockTextMuted}>{t('magic.quickRollsEmpty')}</Text>
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
            <Text style={styles.subSectionTitle}>{t('magic.preparedSpells')}</Text>
            <Text style={styles.blockText}>
              {preparedSpellsLimit !== null ? t('magic.preparedLimit', { count: preparedSpellsCount, limit: preparedSpellsLimit }) : ''}
              {characterData.spells.preparedSpells.length ? characterData.spells.preparedSpells.join(', ') : t('magic.noPrepared')}
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
          <Text style={styles.sectionTitle}>{t('inventory.title')}</Text>
          {sectionConflictLabel(['inventory.'])}
        </View>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Inventory')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Inventory ? t('actions.expand') : t('actions.collapse')}</Text>
        </Pressable>
      </View>

      <View style={styles.rowLine}>
        <Text style={styles.rowLabel}>{t('inventory.armor')}</Text>
        <Text style={styles.rowValue}>{characterData.equipment?.armor || characterData.armorClassDetails || t('empty.notSpecified')}</Text>
      </View>
      <View style={styles.rowLine}>
        <Text style={styles.rowLabel}>{t('inventory.shield')}</Text>
        <Text style={styles.rowValue}>{characterData.equipment?.shield || t('empty.notSpecified')}</Text>
      </View>
      <View style={styles.rowLine}>
        <Text style={styles.rowLabel}>{t('inventory.carryingCapacity')}</Text>
        <Text style={styles.rowValue}>
          {typeof characterData.equipment?.carryingCapacity === 'number'
            ? `${characterData.equipment.carryingCapacity} lb`
            : t('empty.notSpecified')}
        </Text>
      </View>

      <Text style={styles.subSectionTitle}>{t('inventory.weapons')}</Text>
      {characterData.weapons?.length ? (
        characterData.weapons.map((weapon, idx) => (
          <Text key={`inventory-weapon-${weapon.name}-${idx}`} style={styles.blockText}>
            • {weapon.name || t('combat.weaponFallback', { index: idx + 1 })} ({formatBonus(Number(weapon.attackBonus || 0))},{' '}
            {weapon.damage || '1d6'})
          </Text>
        ))
      ) : (
        <Text style={styles.blockTextMuted}>{t('combat.noWeapons')}</Text>
      )}

      <Text style={styles.subSectionTitle}>{t('inventory.equipment')}</Text>
      {characterData.inventory.length ? (
        characterData.inventory.slice(0, collapsedSecondary.Inventory ? 6 : characterData.inventory.length).map((item, idx) => (
          <Text key={`${item}-${idx}`} style={styles.blockText}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={styles.blockTextMuted}>{t('inventory.empty')}</Text>
      )}

      <Text style={styles.subSectionTitle}>{t('inventory.attunedItems')}</Text>
      {characterData.equipment?.attunedItems?.length ? (
        characterData.equipment.attunedItems.map((item, idx) => (
          <Text key={`attuned-${item}-${idx}`} style={styles.blockText}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={styles.blockTextMuted}>{t('inventory.noAttunedItems')}</Text>
      )}

      <Text style={styles.subSectionTitle}>{t('inventory.currency')}</Text>
      <Text style={styles.blockText}>
        GP {characterData.coins?.gold ?? 0} | SP {characterData.coins?.silver ?? 0} | CP {characterData.coins?.copper ?? 0}
      </Text>
    </View>
  );

  const renderNotesPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{t('notes.title')}</Text>
          {sectionConflictLabel(['homebrew.notes-groups'])}
        </View>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Notes')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Notes ? t('actions.expand') : t('actions.collapse')}</Text>
        </Pressable>
      </View>

      {!notesGroups.length && <Text style={styles.blockTextMuted}>{t('notes.empty')}</Text>}
      {notesGroups
        .filter((_, index) => !collapsedSecondary.Notes || index < 1)
        .map((group) => (
          <View key={group.id}>
            <Text style={styles.subSectionTitle}>{group.title}</Text>
            <Text style={styles.blockText}>{group.content?.trim() || t('empty.blank')}</Text>
          </View>
        ))}
      {!collapsedSecondary.Notes && (
        <>
          <Text style={styles.subSectionTitle}>{t('notes.session')}</Text>
          <Text style={styles.blockText}>{characterData.notesBlocks?.session || characterData.notes || t('empty.blank')}</Text>
          <Text style={styles.subSectionTitle}>{t('notes.campaign')}</Text>
          <Text style={styles.blockText}>{characterData.notesBlocks?.campaign || characterData.campaign || t('empty.blank')}</Text>
          <Text style={styles.subSectionTitle}>{t('notes.quests')}</Text>
          <Text style={styles.blockText}>{characterData.notesBlocks?.quests || characterData.notesBlocks?.goals || t('empty.blank')}</Text>
          <Text style={styles.subSectionTitle}>{t('notes.alliesEnemies')}</Text>
          <Text style={styles.blockText}>
            {characterData.alliesAndOrganizations || characterData.notesBlocks?.relationships || t('empty.blank')}
          </Text>
          <Text style={styles.subSectionTitle}>{t('notes.roleplay')}</Text>
          <Text style={styles.blockText}>
            {[
              characterData.traits?.personality,
              characterData.traits?.ideals,
              characterData.traits?.bonds,
              characterData.traits?.flaws,
              characterData.backstory,
            ]
              .map((entry) => String(entry || '').trim())
              .filter(Boolean)
              .join('\n') || t('empty.blank')}
          </Text>
        </>
      )}
    </View>
  );

  const renderHomebrewPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{t('homebrew.title')}</Text>
          {sectionConflictLabel(['homebrew.'])}
        </View>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Homebrew')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Homebrew ? t('actions.expand') : t('actions.collapse')}</Text>
        </Pressable>
      </View>

      <Text style={styles.subSectionTitle}>{t('homebrew.customFields')}</Text>
      {characterData.customFields?.length ? (
        characterData.customFields.map((field) => (
          <View key={field.id} style={styles.rowLine}>
            <Text style={styles.rowLabel}>{field.label}</Text>
            <Text style={styles.rowValue}>{String(field.value)}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.blockTextMuted}>{t('homebrew.noFields')}</Text>
      )}

      {!collapsedSecondary.Homebrew && (
        <>
          <Text style={styles.subSectionTitle}>{t('homebrew.customResources')}</Text>
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
            <Text style={styles.blockTextMuted}>{t('homebrew.noResources')}</Text>
          )}

          <Text style={styles.subSectionTitle}>{t('homebrew.customSections')}</Text>
          {characterData.customSections?.length ? (
            characterData.customSections.map((section) => (
              <View key={section.id}>
                <Text style={styles.rowLabel}>{section.title}</Text>
                <Text style={styles.blockText}>{section.content?.trim() || t('empty.blank')}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.blockTextMuted}>{t('homebrew.noSections')}</Text>
          )}

          <Text style={styles.subSectionTitle}>{t('homebrew.customEntries')}</Text>
          {characterData.homebrewEntries?.length ? (
            characterData.homebrewEntries.map((entry) => (
              <View key={entry.id} style={styles.editCardBlock}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.rowLabel}>{entry.name}</Text>
                  <Text style={styles.blockTextMuted}>{entry.kind}</Text>
                </View>
                <Text style={styles.blockText}>{entry.description || t('empty.noDescription')}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.blockTextMuted}>{t('homebrew.noEntries')}</Text>
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
        <Text style={styles.sectionTitle}>{t('edit.identity.title')}</Text>
        {sectionConflictLabel(['overview.identity'])}
      </View>
      <Text style={styles.editLabel}>{t('edit.identity.name')}</Text>
      {renderTextInput(
        characterData.name,
        (next) => patchCharacter((prev) => ({ ...prev, name: next })),
        t('edit.identity.namePlaceholder'),
      )}
      <Text style={styles.editLabel}>{t('edit.identity.class')}</Text>
      {renderTextInput(characterData.class, (next) => patchCharacter((prev) => ({ ...prev, class: next })), t('edit.identity.class'))}
      <Text style={styles.editLabel}>{t('edit.identity.race')}</Text>
      {renderTextInput(characterData.race, (next) => patchCharacter((prev) => ({ ...prev, race: next })), t('edit.identity.race'))}
      <Text style={styles.editLabel}>{t('edit.identity.campaign')}</Text>
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
        t('edit.identity.campaignPlaceholder'),
      )}
      <Text style={styles.editLabel}>{t('edit.identity.level')}</Text>
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
      <Text style={styles.editLabel}>{t('edit.identity.experience')}</Text>
      {renderTextInput(
        String(characterData.experience),
        (next) => patchCharacter((prev) => ({ ...prev, experience: Math.max(0, parseNumber(next, prev.experience)) })),
        'XP',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>{t('edit.identity.proficiencyBonus')}</Text>
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
      <Text style={styles.subSectionTitle}>{t('overview.srdDetails')}</Text>
      {renderFeatureRows(sourceFeatureRows)}
      <Text style={styles.subSectionTitle}>{t('overview.abilityScores')}</Text>
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
      <Text style={styles.subSectionTitle}>{t('edit.proficiency.savingThrows')}</Text>
      {STAT_LABELS.map((stat) => {
        const proficient = Boolean(characterData.savingThrows?.[stat.key]);
        return (
          <Pressable
            key={`edit-save-${stat.key}`}
            style={styles.actionRowLine}
            onPress={() => toggleSavingThrowProficiency(stat.key)}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={styles.rowLabel}>{abilityLabel(stat.key)}</Text>
            <Text style={styles.rowValue}>{proficient ? t('skillRanks.proficient') : t('skillRanks.none')}</Text>
          </Pressable>
        );
      })}
      <Text style={styles.subSectionTitle}>{t('edit.proficiency.skills')}</Text>
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
            <Text style={styles.rowLabel}>{skillLabel(skill)}</Text>
            <Text style={styles.rowValue}>
              {skillRankLabel(rank)} • {formatBonus(value)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderCombatEdit = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t('edit.combat.title')}</Text>
        {sectionConflictLabel(['combat.core', 'combat.hp', 'combat.rest'])}
      </View>
      <Text style={styles.editLabel}>{t('edit.combat.currentHp')}</Text>
      {renderTextInput(
        String(characterData.hp.current),
        (next) =>
          patchCharacter(
            (prev) => ({
              ...prev,
              hp: { ...prev.hp, current: clamp(parseNumber(next, prev.hp.current), 0, prev.hp.max) },
            }),
            ['combat.hp'],
          ),
        t('edit.combat.currentHp'),
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>{t('edit.combat.maxHp')}</Text>
      {renderTextInput(
        String(characterData.hp.max),
        (next) =>
          patchCharacter(
            (prev) => {
              const max = clamp(parseNumber(next, prev.hp.max), 1, MAX_HP);
              return {
                ...prev,
                hp: { ...prev.hp, max, current: clamp(prev.hp.current, 0, max) },
              };
            },
            ['combat.hp'],
          ),
        t('edit.combat.maxHp'),
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>{t('edit.combat.tempHp')}</Text>
      {renderTextInput(
        String(characterData.hp.temp),
        (next) =>
          patchCharacter(
            (prev) => ({
              ...prev,
              hp: { ...prev.hp, temp: clamp(parseNumber(next, prev.hp.temp), 0, MAX_TEMP_HP) },
            }),
            ['combat.hp'],
          ),
        t('edit.combat.tempHp'),
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>AC</Text>
      {renderTextInput(
        String(characterData.ac),
        (next) => patchCharacter((prev) => ({ ...prev, ac: clamp(parseNumber(next, prev.ac), 0, MAX_AC) }), ['combat.core']),
        t('edit.combat.acPlaceholder'),
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>{t('edit.combat.speed')}</Text>
      {renderTextInput(
        String(characterData.speed),
        (next) => patchCharacter((prev) => ({ ...prev, speed: clamp(parseNumber(next, prev.speed), 0, MAX_SPEED) }), ['combat.core']),
        t('edit.combat.speed'),
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>{t('edit.combat.initiative')}</Text>
      {renderTextInput(
        String(characterData.initiative),
        (next) => patchCharacter((prev) => ({ ...prev, initiative: parseNumber(next, prev.initiative) }), ['combat.core']),
        t('edit.combat.initiative'),
        { keyboardType: 'number-pad' },
      )}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t('edit.combat.templates')}</Text>
        {sectionConflictLabel(['combat.templates'])}
      </View>
      <Text style={styles.editLabel}>{t('edit.combat.actionsLines')}</Text>
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
        t('edit.combat.actionsPlaceholder'),
        { multiline: true },
      )}
      <Text style={styles.editLabel}>{t('edit.combat.bonusActionsLines')}</Text>
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
        t('edit.combat.bonusActionsPlaceholder'),
        { multiline: true },
      )}
      <Text style={styles.editLabel}>{t('edit.combat.reactionsLines')}</Text>
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
        t('edit.combat.reactionsPlaceholder'),
        { multiline: true },
      )}
    </View>
  );

  const renderMagicEdit = () => {
    const slotLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
      <View style={styles.cardSecondary}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{t('edit.magic.title')}</Text>
          {sectionConflictLabel(['magic.'])}
        </View>
        <Text style={styles.editLabel}>{t('edit.magic.spellcastingAbility')}</Text>
        {renderTextInput(
          characterData.spells.spellcastingAbility,
          (next) =>
            patchCharacter((prev) => ({
              ...prev,
              spells: { ...prev.spells, spellcastingAbility: next },
            })),
          'INT / WIS / CHA',
        )}
        <Text style={styles.editLabel}>{t('edit.magic.spellSaveDc')}</Text>
        {renderTextInput(
          String(characterData.spells.spellSaveDC),
          (next) =>
            patchCharacter((prev) => ({
              ...prev,
              spells: { ...prev.spells, spellSaveDC: clamp(parseNumber(next, prev.spells.spellSaveDC), 0, MAX_SPELL_SAVE_DC) },
            })),
          'DC',
          { keyboardType: 'number-pad' },
        )}
        <Text style={styles.editLabel}>{t('edit.magic.spellAttackBonus')}</Text>
        {renderTextInput(
          String(characterData.spells.spellAttackBonus),
          (next) =>
            patchCharacter((prev) => ({
              ...prev,
              spells: {
                ...prev.spells,
                spellAttackBonus: clamp(parseNumber(next, prev.spells.spellAttackBonus), MIN_SPELL_ATTACK_BONUS, MAX_SPELL_ATTACK_BONUS),
              },
            })),
          t('edit.magic.spellAttackBonusPlaceholder'),
          { keyboardType: 'number-pad' },
        )}
        <View style={styles.editCardBlock}>
          <Text style={styles.subSectionTitle}>{t('edit.magic.quickAdd')}</Text>
          <Text style={styles.blockTextMuted}>{t('edit.magic.quickAddHint')}</Text>
          {preparedSpellsLimit !== null && (
            <Text style={styles.blockTextMuted}>
              {t('modals.spell.preparedCount', { count: preparedSpellsCount, limit: preparedSpellsLimit })}
            </Text>
          )}
          <Pressable style={styles.secondaryAction} onPress={openSpellQuickModal} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.secondaryActionText}>{t('edit.magic.openQuickAdd')}</Text>
          </Pressable>
        </View>
        <Text style={styles.editLabel}>{t('edit.magic.preparedLines')}</Text>
        <RNTextInput
          value={preparedSpellsDraft}
          onChangeText={setPreparedSpellsDraft}
          onFocus={() => setIsPreparedSpellsDraftFocused(true)}
          onBlur={() => {
            setIsPreparedSpellsDraftFocused(false);
            commitPreparedSpellsDraft();
          }}
          placeholder={t('edit.magic.preparedPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.editInput, styles.editInputMultiline]}
          multiline
        />
        <Text style={styles.editLabel}>{t('edit.magic.knownLines')}</Text>
        <RNTextInput
          value={knownSpellsDraft}
          onChangeText={setKnownSpellsDraft}
          onFocus={() => setIsKnownSpellsDraftFocused(true)}
          onBlur={() => {
            setIsKnownSpellsDraftFocused(false);
            commitKnownSpellsDraft();
          }}
          placeholder={t('edit.magic.knownPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.editInput, styles.editInputMultiline]}
          multiline
        />
        <Text style={styles.editLabel}>{t('edit.magic.cantripsLines')}</Text>
        <RNTextInput
          value={cantripsDraft}
          onChangeText={setCantripsDraft}
          onFocus={() => setIsCantripsDraftFocused(true)}
          onBlur={() => {
            setIsCantripsDraftFocused(false);
            commitCantripsDraft();
          }}
          placeholder={t('edit.magic.cantripsPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.editInput, styles.editInputMultiline]}
          multiline
        />
        <Text style={styles.subSectionTitle}>{t('magic.slots')}</Text>
        {slotLevels.map((level) => {
          const slot = characterData.spells.spellSlots[level] || { max: 0, used: 0 };
          return (
            <View key={`slot-edit-${level}`} style={styles.slotEditRow}>
              <Text style={styles.rowLabel}>{t('edit.magic.slotLevelShort', { level })}</Text>
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
                placeholder={t('edit.magic.slotMaxPlaceholder')}
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
                placeholder={t('edit.magic.slotUsedPlaceholder')}
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
        <Text style={styles.sectionTitle}>{t('edit.inventory.title')}</Text>
        {sectionConflictLabel(['inventory.'])}
      </View>
      <Text style={styles.editLabel}>{t('edit.inventory.itemsLines')}</Text>
      {renderTextInput(
        characterData.inventory.join('\n'),
        (next) => patchCharacter((prev) => ({ ...prev, inventory: parseLines(next) })),
        t('edit.inventory.itemsPlaceholder'),
        { multiline: true },
      )}
      <Text style={styles.editLabel}>{t('inventory.armor')}</Text>
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
      <Text style={styles.editLabel}>{t('inventory.shield')}</Text>
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
      <Text style={styles.editLabel}>{t('edit.inventory.attunedLines')}</Text>
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
      <Text style={styles.editLabel}>{t('inventory.carryingCapacity')}</Text>
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
        <Text style={styles.sectionTitle}>{t('edit.inventory.weaponsTitle')}</Text>
        {sectionConflictLabel(['combat.weapons'])}
      </View>
      <Pressable style={styles.secondaryAction} onPress={addWeapon} android_ripple={{ color: colors.ripple }}>
        <Text style={styles.secondaryActionText}>{t('edit.inventory.addWeapon')}</Text>
      </Pressable>
      {(characterData.weapons || []).map((weapon, index) => (
        <View key={`weapon-config-${index}`} style={styles.editCardBlock}>
          <Text style={styles.editLabel}>{t('edit.inventory.weaponName')}</Text>
          {renderTextInput(weapon.name || '', (next) => updateWeaponAt(index, { name: next }), t('edit.inventory.weaponNamePlaceholder'))}
          <Text style={styles.editLabel}>{t('edit.inventory.attackBonus')}</Text>
          {renderTextInput(
            String(weapon.attackBonus ?? 0),
            (next) => updateWeaponAt(index, { attackBonus: parseNumber(next, Number(weapon.attackBonus) || 0) }),
            '+5',
            { keyboardType: 'numeric' },
          )}
          <Text style={styles.editLabel}>{t('edit.inventory.damageFormula')}</Text>
          {renderTextInput(weapon.damage || '', (next) => updateWeaponAt(index, { damage: next }), '1d8+3', { keyboardType: 'default' })}
          <Pressable style={styles.removeButton} onPress={() => removeWeaponAt(index)} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.removeButtonText}>{t('edit.inventory.removeWeapon')}</Text>
          </Pressable>
        </View>
      ))}
      <Text style={styles.editLabel}>{t('notes.title')}</Text>
      {renderTextInput(
        characterData.notes || '',
        (next) => patchCharacter((prev) => ({ ...prev, notes: next })),
        t('edit.inventory.notesPlaceholder'),
        { multiline: true },
      )}
      <Text style={styles.editLabel}>{t('edit.inventory.coins')}</Text>
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
        <Text style={styles.sectionTitle}>{t('edit.notes.groups')}</Text>
        {sectionConflictLabel(['homebrew.notes-groups'])}
      </View>
      <Pressable style={styles.secondaryAction} onPress={addNotesGroup} android_ripple={{ color: colors.ripple }}>
        <Text style={styles.secondaryActionText}>{t('edit.notes.addGroup')}</Text>
      </Pressable>
      {notesGroups.map((group) => (
        <View key={group.id} style={styles.editCardBlock}>
          <Text style={styles.editLabel}>{t('edit.notes.groupTitle')}</Text>
          {renderTextInput(group.title, (next) => updateNotesGroupMeta(group.id, { title: next }), t('edit.notes.groupTitle'))}
          <Text style={styles.editLabel}>{t('edit.notes.groupContent')}</Text>
          {renderTextInput(group.content || '', (next) => setNotesGroup(group.id, next), t('edit.notes.groupContentPlaceholder'), {
            multiline: true,
          })}
          {group.origin === 'custom' && (
            <Pressable style={styles.removeButton} onPress={() => removeNotesGroup(group.id)} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.removeButtonText}>{t('edit.notes.removeGroup')}</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );

  const renderHomebrewEdit = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t('homebrew.customFields')}</Text>
        {sectionConflictLabel(['homebrew.fields'])}
      </View>
      <Pressable style={styles.secondaryAction} onPress={addCustomField} android_ripple={{ color: colors.ripple }}>
        <Text style={styles.secondaryActionText}>{t('edit.homebrew.addField')}</Text>
      </Pressable>

      {(characterData.customFields || []).map((field) => {
        const currentTypeIndex = FIELD_TYPES.indexOf(field.type);
        const nextType = FIELD_TYPES[(currentTypeIndex + 1) % FIELD_TYPES.length];
        return (
          <View key={field.id} style={styles.editCardBlock}>
            <Text style={styles.editLabel}>{t('edit.homebrew.name')}</Text>
            {renderTextInput(field.label, (next) => updateCustomField(field.id, { label: next }), t('edit.homebrew.fieldNamePlaceholder'))}

            <View style={styles.cardHeaderRow}>
              <Text style={styles.rowLabel}>{t('edit.homebrew.type', { type: field.type })}</Text>
              <Pressable
                style={styles.collapseButton}
                onPress={() => updateCustomField(field.id, { type: nextType })}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.collapseButtonText}>{t('edit.homebrew.changeType')}</Text>
              </Pressable>
            </View>

            {field.type === 'boolean' ? (
              <Pressable
                style={styles.booleanField}
                onPress={() => updateCustomField(field.id, { value: !field.value })}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.blockText}>{field.value ? t('boolean.yes') : t('boolean.no')}</Text>
              </Pressable>
            ) : field.type === 'select' ? (
              <>
                <Text style={styles.editLabel}>{t('edit.homebrew.optionsLines')}</Text>
                {renderTextInput(
                  (field.options || []).join('\n'),
                  (next) => updateCustomField(field.id, { options: parseLines(next) }),
                  t('edit.homebrew.optionsPlaceholder'),
                  { multiline: true },
                )}
                <Text style={styles.editLabel}>{t('edit.homebrew.value')}</Text>
                {renderTextInput(
                  String(field.value ?? ''),
                  (next) => updateCustomField(field.id, { value: next }),
                  t('edit.homebrew.value'),
                )}
              </>
            ) : (
              renderTextInput(String(field.value ?? ''), (next) => updateCustomField(field.id, { value: next }), t('edit.homebrew.value'))
            )}

            <Pressable style={styles.removeButton} onPress={() => removeCustomField(field.id)} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.removeButtonText}>{t('edit.homebrew.removeField')}</Text>
            </Pressable>
          </View>
        );
      })}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t('homebrew.customResources')}</Text>
        {sectionConflictLabel(['homebrew.resources'])}
      </View>
      <Pressable style={styles.secondaryAction} onPress={addResource} android_ripple={{ color: colors.ripple }}>
        <Text style={styles.secondaryActionText}>{t('edit.homebrew.addResource')}</Text>
      </Pressable>
      <Text style={styles.subSectionTitle}>{t('edit.homebrew.systemTemplates')}</Text>
      {SYSTEM_RESOURCE_TEMPLATES.map((template) => (
        <Pressable
          key={template.id}
          style={styles.secondaryAction}
          onPress={() => applyResourceTemplate(template.resource)}
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={styles.secondaryActionText}>{t('edit.homebrew.applyTemplate', { name: template.name })}</Text>
        </Pressable>
      ))}
      {!!userTemplates.length && <Text style={styles.subSectionTitle}>{t('edit.homebrew.userTemplates')}</Text>}
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
            <Text style={styles.secondaryActionText}>{t('edit.homebrew.applyUserTemplate')}</Text>
          </Pressable>
          <Pressable style={styles.removeButton} onPress={() => removeUserTemplate(template.id)} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.removeButtonText}>{t('edit.homebrew.removeTemplate')}</Text>
          </Pressable>
        </View>
      ))}

      {(characterData.customResources || []).map((resource) => {
        const ruleIndex = TRACKER_RULES.indexOf(resource.resetRule);
        const nextRule = TRACKER_RULES[(ruleIndex + 1) % TRACKER_RULES.length];
        return (
          <View key={resource.id} style={styles.editCardBlock}>
            <Text style={styles.editLabel}>{t('edit.homebrew.resourceName')}</Text>
            {renderTextInput(resource.label, (next) => updateResource(resource.id, { label: next }), t('edit.homebrew.resourceName'))}
            <Text style={styles.editLabel}>{t('edit.homebrew.current')}</Text>
            {renderTextInput(
              String(resource.current),
              (next) => updateResource(resource.id, { current: Math.max(0, parseNumber(next, resource.current)) }),
              'Current',
              { keyboardType: 'number-pad' },
            )}
            <Text style={styles.editLabel}>{t('edit.homebrew.maxOptional')}</Text>
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
                <Text style={styles.collapseButtonText}>{t('edit.homebrew.changeReset')}</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.secondaryAction}
              onPress={() => saveUserTemplateFromResource(resource)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={styles.secondaryActionText}>{t('edit.homebrew.saveAsUserTemplate')}</Text>
            </Pressable>

            <Pressable style={styles.removeButton} onPress={() => removeResource(resource.id)} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.removeButtonText}>{t('edit.homebrew.removeResource')}</Text>
            </Pressable>
          </View>
        );
      })}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t('homebrew.customSections')}</Text>
        {sectionConflictLabel(['homebrew.sections'])}
      </View>
      <Pressable style={styles.secondaryAction} onPress={addCustomSection} android_ripple={{ color: colors.ripple }}>
        <Text style={styles.secondaryActionText}>{t('edit.homebrew.addSection')}</Text>
      </Pressable>
      {(characterData.customSections || []).map((section) => (
        <View key={section.id} style={styles.editCardBlock}>
          <Text style={styles.editLabel}>{t('edit.homebrew.sectionTitle')}</Text>
          {renderTextInput(section.title, (next) => updateCustomSection(section.id, { title: next }), t('edit.homebrew.sectionTitle'))}
          <Text style={styles.editLabel}>{t('edit.homebrew.sectionContent')}</Text>
          {renderTextInput(
            section.content,
            (next) => updateCustomSection(section.id, { content: next }),
            t('edit.homebrew.sectionContent'),
            {
              multiline: true,
            },
          )}
          <Pressable style={styles.removeButton} onPress={() => removeCustomSection(section.id)} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.removeButtonText}>{t('edit.homebrew.removeSection')}</Text>
          </Pressable>
        </View>
      ))}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t('homebrew.customEntries')}</Text>
        {sectionConflictLabel(['homebrew.entries'])}
      </View>
      <View style={styles.slotEditRow}>
        <Pressable style={styles.secondaryAction} onPress={() => addHomebrewEntry('spell')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryActionText}>{t('edit.homebrew.addSpell')}</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => addHomebrewEntry('ability')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryActionText}>{t('edit.homebrew.addAbility')}</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => addHomebrewEntry('feat')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryActionText}>{t('edit.homebrew.addFeat')}</Text>
        </Pressable>
      </View>
      {(characterData.homebrewEntries || []).map((entry) => {
        const kinds: CharacterHomebrewEntry['kind'][] = ['spell', 'ability', 'feat'];
        const kindIndex = kinds.indexOf(entry.kind);
        const nextKind = kinds[(kindIndex + 1) % kinds.length];
        return (
          <View key={entry.id} style={styles.editCardBlock}>
            <Text style={styles.editLabel}>{t('edit.homebrew.name')}</Text>
            {renderTextInput(entry.name, (next) => updateHomebrewEntry(entry.id, { name: next }), t('edit.homebrew.entryName'))}
            <Text style={styles.editLabel}>{t('edit.homebrew.description')}</Text>
            {renderTextInput(
              entry.description,
              (next) => updateHomebrewEntry(entry.id, { description: next }),
              t('edit.homebrew.description'),
              {
                multiline: true,
              },
            )}
            <Text style={styles.editLabel}>{t('edit.homebrew.tagsLines')}</Text>
            {renderTextInput(
              (entry.tags || []).join('\n'),
              (next) => updateHomebrewEntry(entry.id, { tags: parseLines(next) }),
              t('edit.homebrew.tagsPlaceholder'),
              {
                multiline: true,
              },
            )}
            <View style={styles.cardHeaderRow}>
              <Text style={styles.rowLabel}>{t('edit.homebrew.type', { type: entry.kind })}</Text>
              <Pressable
                style={styles.collapseButton}
                onPress={() => updateHomebrewEntry(entry.id, { kind: nextKind })}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.collapseButtonText}>{t('edit.homebrew.changeType')}</Text>
              </Pressable>
            </View>
            <Pressable style={styles.removeButton} onPress={() => removeHomebrewEntry(entry.id)} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.removeButtonText}>{t('edit.homebrew.removeEntry')}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );

  const onQuickActionPress = useCallback((action: { id: string; onPress: () => void }) => {
    trackProductEvent('quick_action_used', { actionId: action.id });
    action.onPress();
  }, []);

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
    isOwnedByMe,
    onCharacterMenuChange: (next: CharacterViewModel) => setCharacterData(ensureCharacterDefaults(next)),
    syncBadges,
    renderBadge,
    syncStatusLabel: syncStatusDisplayLabel,
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
    tabLabels,
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
