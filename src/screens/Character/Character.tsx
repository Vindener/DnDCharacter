import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Pressable, TextInput as RNTextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import type {
  CharacterCustomField,
  CharacterCustomNotesGroup,
  CharacterCustomResource,
  CharacterDto,
  CharacterHomebrewEntry,
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
import type { CharacterActorRole, CharacterChangeHistoryEntry } from '@/services/characterSheets';
import { fetchCharacterSheet, subscribeCharacterSheet, upsertCharacterSheetFromLocal } from '@/services/characterSheets';
import { fbAuth } from '@/services/firebase';
import useSyncStore from '@/context/Sync-store';
import { mapCloudCharacterToLocalDto } from '@/shared/helpers/mapCloudCharacter';
import { trackProductEvent } from '@/shared/services/telemetry/productTelemetry';
import { appendQuickSessionNote, isHomebrewCharacter, normalizeHomebrewV3 } from '@/shared/helpers/homebrew';
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
import { collectConflictPaths, pathToSyncSection } from '@/shared/helpers/sync/conflictPolicy';

interface CharacterProps {
  route: {
    params: {
      character: CharacterDto;
    };
  };
}

type CharacterMode = 'play' | 'edit';
type CharacterTab = 'Overview' | 'Combat' | 'Magic' | 'Inventory' | 'Notes' | 'Homebrew';

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

function getResourceResetValue(resource: CharacterCustomResource): number {
  if (typeof resource.max === 'number') return resource.max;
  return 0;
}

function ensureCharacterDefaults(character: CharacterDto): CharacterDto {
  const withDefaults: CharacterDto = {
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
    characterTemplateId: character.characterTemplateId ?? 'standard-5e',
    customFields: character.customFields ?? [],
    customTrackers: character.customTrackers ?? [],
    customSections: character.customSections ?? [],
    customResources: character.customResources ?? [],
    customNotesGroups: character.customNotesGroups ?? [],
    homebrewEntries: character.homebrewEntries ?? [],
    customResetRules: character.customResetRules ?? [],
    customFeatureBlocks: character.customFeatureBlocks ?? [],
    customSpellLists: character.customSpellLists ?? [],
    notesBlocks: {
      session: character.notesBlocks?.session ?? '',
      campaign: character.notesBlocks?.campaign ?? '',
      goals: character.notesBlocks?.goals ?? '',
      relationships: character.notesBlocks?.relationships ?? '',
      quests: character.notesBlocks?.quests ?? '',
    },
    combatTemplates: {
      actions: character.combatTemplates?.actions ?? [],
      bonusActions: character.combatTemplates?.bonusActions ?? [],
      reactions: character.combatTemplates?.reactions ?? [],
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
  return normalizeHomebrewV3(withDefaults);
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

function getPendingSections(paths: string[]): Set<string> {
  const sections = new Set<string>();
  (paths || []).forEach((path) => {
    const section = pathToSyncSection(path);
    if (section !== 'unknown') sections.add(section);
  });
  return sections;
}

function mergeBySections(local: CharacterDto, remote: CharacterDto, pendingPaths: string[]): CharacterDto {
  const pendingSections = getPendingSections(pendingPaths);
  const next = { ...local };

  if (!pendingSections.has('overview')) {
    next.name = remote.name;
    next.class = remote.class;
    next.subclass = remote.subclass;
    next.race = remote.race;
    next.subrace = remote.subrace;
    next.background = remote.background;
    next.level = remote.level;
    next.experience = remote.experience;
    next.stats = remote.stats;
    next.skills = remote.skills;
    next.savingThrows = remote.savingThrows;
    next.traits = remote.traits;
    next.featuresAndTraits = remote.featuresAndTraits;
    next.proficiencyBonus = remote.proficiencyBonus;
  }

  if (!pendingSections.has('combat')) {
    next.hp = remote.hp;
    next.ac = remote.ac;
    next.initiative = remote.initiative;
    next.speed = remote.speed;
    next.hitDice = remote.hitDice;
    next.deathSaves = remote.deathSaves;
    next.weapons = remote.weapons;
    next.conditions = remote.conditions;
    next.combatTemplates = remote.combatTemplates;
    next.sessionMode = remote.sessionMode;
  }

  if (!pendingSections.has('magic')) {
    next.spells = remote.spells;
  }

  if (!pendingSections.has('inventory')) {
    next.inventory = remote.inventory;
    next.coins = remote.coins;
    next.customCoins = remote.customCoins;
    next.tools = remote.tools;
    next.proficiencies = remote.proficiencies;
  }

  if (!pendingSections.has('notes')) {
    next.notes = remote.notes;
    next.backstory = remote.backstory;
    next.campaign = remote.campaign;
    next.alliesAndOrganizations = remote.alliesAndOrganizations;
    next.notesBlocks = remote.notesBlocks;
    next.customNotesGroups = remote.customNotesGroups;
  }

  if (!pendingSections.has('homebrew')) {
    next.characterTemplateId = remote.characterTemplateId;
    next.customFields = remote.customFields;
    next.customTrackers = remote.customTrackers;
    next.customSections = remote.customSections;
    next.customResources = remote.customResources;
    next.customResetRules = remote.customResetRules;
    next.customFeatureBlocks = remote.customFeatureBlocks;
    next.customSpellLists = remote.customSpellLists;
    next.homebrewEntries = remote.homebrewEntries;
  }

  return ensureCharacterDefaults(next);
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
  const characterDataRef = useRef<CharacterDto>(ensureCharacterDefaults(baseCharacter));
  useEffect(() => {
    characterDataRef.current = characterData;
  }, [characterData]);
  const [mode, setMode] = useState<CharacterMode>('play');
  const [selectedTab, setSelectedTab] = useState<CharacterTab>('Overview');
  const [isCloudDoc, setIsCloudDoc] = useState<boolean>(false);
  const [isSharedSheet, setIsSharedSheet] = useState<boolean>(false);
  const [isOwnedByMe, setIsOwnedByMe] = useState<boolean>(true);
  const [syncFeedback, setSyncFeedback] = useState<string>('Waiting for local changes');
  const syncByCharacter = useSyncStore((s) => s.syncByCharacter);
  const loadSyncMeta = useSyncStore((s) => s.loadSyncMeta);
  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const setCloudAvailability = useSyncStore((s) => s.setCloudAvailability);
  const markLocalDraftPaths = useSyncStore((s) => s.markLocalDraftPaths);
  const markCloudUploaded = useSyncStore((s) => s.markCloudUploaded);
  const markCloudDownloaded = useSyncStore((s) => s.markCloudDownloaded);
  const markConflict = useSyncStore((s) => s.markConflict);
  const clearConflicts = useSyncStore((s) => s.clearConflicts);
  const setSyncTransport = useSyncStore((s) => s.setSyncTransport);
  const markSyncError = useSyncStore((s) => s.markSyncError);
  const roleMode = useAppRoleStore((s) => s.role);
  const userTemplates = useTrackerTemplateStore((s) => s.userTemplates);
  const loadUserTemplates = useTrackerTemplateStore((s) => s.loadUserTemplates);
  const addUserTemplateFromResource = useTrackerTemplateStore((s) => s.addUserTemplateFromResource);
  const removeUserTemplate = useTrackerTemplateStore((s) => s.removeUserTemplate);
  const [sharedHistory, setSharedHistory] = useState<CharacterChangeHistoryEntry[]>([]);
  const netInfo = useNetInfo();
  const isOnline = isNetworkOnline(netInfo.isConnected);

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
  const hasHomebrew = isHomebrewCharacter(characterData);
  const notesGroups = useMemo(() => {
    return (characterData.customNotesGroups || []).slice().sort((a, b) => a.order - b.order);
  }, [characterData.customNotesGroups]);
  const sessionNotes = useMemo(() => {
    const group = notesGroups.find((item) => item.id === 'seed-session' || item.title.toLowerCase() === 'session');
    return group?.content?.trim() || '';
  }, [notesGroups]);
  const currentSync = syncByCharacter[baseCharacter.id];
  const conflictPaths = currentSync?.conflictPaths || [];
  const syncStatusLabel = useMemo(() => getSyncDisplayStatus(currentSync, netInfo.isConnected), [currentSync, netInfo.isConnected]);
  const shareStatusLabel = useMemo(
    () => getShareDisplayStatus({ isSharedSheet, role: roleMode, isOwnedByMe }),
    [isOwnedByMe, isSharedSheet, roleMode],
  );

  useEffect(() => {
    if (currentSync?.status === 'conflict') {
      trackProductEvent('sync_conflict_detected', {
        characterId: baseCharacter.id,
        paths: currentSync.conflictPaths,
      });
    }
  }, [baseCharacter.id, currentSync?.conflictPaths, currentSync?.status]);

  useEffect(() => {
    setCharacterData(ensureCharacterDefaults(baseCharacter));
  }, [baseCharacter.id]);

  useEffect(() => {
    loadSyncMeta().catch(() => {});
  }, [loadSyncMeta]);

  useEffect(() => {
    loadUserTemplates().catch(() => {});
  }, [loadUserTemplates]);

  useEffect(() => {
    ensureCharacterSync(baseCharacter.id, false).catch(() => {});
  }, [baseCharacter.id, ensureCharacterSync]);

  useEffect(() => {
    let alive = true;
    fetchCharacterSheet(baseCharacter.id)
      .then((doc) => {
        if (!alive) return;
        const exists = Boolean(doc);
        const owners = Array.isArray((doc as any)?.owners) ? ((doc as any).owners as string[]) : [];
        const ownerUid = typeof (doc as any)?.ownerUid === 'string' ? (doc as any).ownerUid : '';
        const me = fbAuth.currentUser?.uid || '';
        const owned = Boolean(me && (ownerUid === me || owners.includes(me)));
        setIsCloudDoc(exists);
        setIsOwnedByMe(owned);
        setIsSharedSheet(Boolean(doc && Array.isArray((doc as any).editors) && (doc as any).editors.length > 0));
        setSharedHistory(sanitizeChangeHistory(doc?.changeHistory));
        setSyncFeedback(exists ? 'Cloud doc connected' : 'Local-only character');
        setCloudAvailability(baseCharacter.id, exists).catch(() => {});
      })
      .catch(() => {
        if (!alive) return;
        setIsCloudDoc(false);
        setIsOwnedByMe(true);
        setIsSharedSheet(false);
        setSharedHistory([]);
        setSyncFeedback('Local-only character');
        setCloudAvailability(baseCharacter.id, false).catch(() => {});
      });

    const unsubscribe = subscribeCharacterSheet(baseCharacter.id, (doc) => {
      const exists = Boolean(doc);
      const owners = Array.isArray((doc as any)?.owners) ? ((doc as any).owners as string[]) : [];
      const ownerUid = typeof (doc as any)?.ownerUid === 'string' ? (doc as any).ownerUid : '';
      const me = fbAuth.currentUser?.uid || '';
      const owned = Boolean(me && (ownerUid === me || owners.includes(me)));
      setIsCloudDoc(exists);
      setIsOwnedByMe(owned);
      setIsSharedSheet(Boolean(doc && Array.isArray((doc as any).editors) && (doc as any).editors.length > 0));
      const history = sanitizeChangeHistory(doc?.changeHistory);
      setSharedHistory(history);
      setSyncFeedback(exists ? 'Cloud doc connected' : 'Local-only character');
      setCloudAvailability(baseCharacter.id, exists).catch(() => {});

      const syncState = useSyncStore.getState().syncByCharacter[baseCharacter.id];
      const pendingPaths = syncState?.pendingPaths || [];
      if (!exists) return;

      const remoteDto = ensureCharacterDefaults(mapCloudCharacterToLocalDto(doc as Record<string, unknown>));
      const remotePathsSinceLastSync = history
        .filter((entry) => entry.uid && entry.uid !== me)
        .filter((entry) => (syncState?.lastSyncAt || 0) === 0 || entry.atMs > (syncState?.lastSyncAt || 0))
        .flatMap((entry) => entry.paths || []);

      if (pendingPaths.length) {
        const conflictForPending = collectConflictPaths(pendingPaths, remotePathsSinceLastSync);
        if (conflictForPending.length) {
          markConflict(baseCharacter.id, conflictForPending).catch(() => {});
          setSyncFeedback('Conflict detected. Review required.');
          return;
        }

        if (remotePathsSinceLastSync.length) {
          const merged = mergeBySections(characterDataRef.current, remoteDto, pendingPaths);
          setCharacterData(merged);
          setSyncFeedback('Section merge applied from cloud');
        }
        return;
      }

      setCharacterData(remoteDto);
      void updateCharacter(remoteDto.id, remoteDto);
      markCloudDownloaded(remoteDto.id).catch(() => {});
      setSyncFeedback('Downloaded latest cloud revision');
      if (!pendingPaths.length && remotePathsSinceLastSync.length) {
        setSyncTransport(remoteDto.id, 'downloading', 'Downloaded latest cloud revision').catch(() => {});
      }
    });

    return () => {
      alive = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [baseCharacter.id, markCloudDownloaded, markConflict, setCloudAvailability, setSyncTransport, updateCharacter]);

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

    const pendingPathsForUpload = Array.from(new Set(currentSync?.pendingPaths || []));
    if (!pendingPathsForUpload.length) return;

    if (!isOnline) {
      setSyncFeedback(`Offline queue: ${pendingPathsForUpload.length} pending path(s)`);
      setSyncTransport(characterData.id, 'idle', `Offline queue: ${pendingPathsForUpload.length} pending path(s)`).catch(() => {});
      return;
    }

    const actorRole: CharacterActorRole = mapRoleToHistoryActor(roleMode);
    setSyncFeedback('Uploading local changes...');
    setSyncTransport(characterData.id, 'uploading', 'Uploading local changes...').catch(() => {});
    const timeout = setTimeout(() => {
      upsertCharacterSheetFromLocal(characterData, { historyPaths: pendingPathsForUpload, actorRole })
        .then(() => {
          setSyncFeedback('Auto-synced just now');
          setSyncTransport(characterData.id, 'synced', 'Auto-synced just now').catch(() => {});
          markCloudUploaded(characterData.id).catch(() => {});
        })
        .catch((error) => {
          const message = String(error?.message || '').toLowerCase();
          setSyncFeedback(message.includes('network') ? 'Retrying after network error...' : 'Sync failed. Retry from Sync now.');
          markSyncError(characterData.id, message || 'Sync failed').catch(() => {});
          if (message.includes('conflict')) {
            markConflict(characterData.id, pendingPathsForUpload.length ? pendingPathsForUpload : ['overview.identity']).catch(
              () => {},
            );
          }
        });
    }, 1200);

    return () => clearTimeout(timeout);
  }, [
    characterData,
    currentSync?.pendingPaths,
    isCloudDoc,
    isOnline,
    markCloudUploaded,
    markConflict,
    markSyncError,
    roleMode,
    setSyncTransport,
  ]);

  const patchCharacter = useCallback((patcher: (prev: CharacterDto) => CharacterDto, changedPaths?: string[]) => {
    setCharacterData((prev) => ensureCharacterDefaults(patcher(prev)));
    const paths = changedPaths && changedPaths.length ? changedPaths : [TAB_DEFAULT_PATH[selectedTab]];
    markLocalDraftPaths(baseCharacter.id, paths).catch(() => {});
  }, [baseCharacter.id, markLocalDraftPaths, selectedTab]);

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
        title: 'Custom Group',
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
      label: 'Custom Resource',
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
          title: 'Custom Section',
          content: '',
        },
      ],
    }), ['homebrew.sections']);
  }, [patchCharacter]);

  const updateCustomSection = useCallback((sectionId: string, patch: Partial<NonNullable<CharacterDto['customSections']>[number]>) => {
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
          name: `Custom ${kind}`,
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
    setSyncFeedback('Applying local version to cloud...');
    setSyncTransport(characterData.id, 'uploading', 'Applying local version to cloud...').catch(() => {});
    const historyPaths = Array.from(new Set(currentSync?.pendingPaths || []));
    upsertCharacterSheetFromLocal(characterData, { historyPaths, actorRole: mapRoleToHistoryActor(roleMode) })
      .then(() => {
        setSyncFeedback('Conflict resolved using local version');
        setSyncTransport(characterData.id, 'synced', 'Conflict resolved using local version').catch(() => {});
        markCloudUploaded(characterData.id).catch(() => {});
        clearConflicts(characterData.id).catch(() => {});
      })
      .catch(() => {
        setSyncFeedback('Failed to resolve conflict with local version');
        markSyncError(characterData.id, 'Failed to resolve conflict with local version').catch(() => {});
      });
  }, [characterData, clearConflicts, currentSync?.pendingPaths, markCloudUploaded, markSyncError, roleMode, setSyncTransport]);

  const resolveConflictWithCloud = useCallback(() => {
    trackProductEvent('sync_conflict_resolved_cloud', { characterId: characterData.id });
    fetchCharacterSheet(characterData.id)
      .then((doc) => {
        if (!doc) return;
        const mapped = mapCloudCharacterToLocalDto(doc as Record<string, unknown>);
        const normalized = ensureCharacterDefaults(mapped);
        setCharacterData(normalized);
        void updateCharacter(normalized.id, normalized);
        markCloudDownloaded(normalized.id).catch(() => {});
        clearConflicts(normalized.id).catch(() => {});
        setSyncTransport(normalized.id, 'downloading', 'Conflict resolved using cloud version').catch(() => {});
        setSyncFeedback('Conflict resolved using cloud version');
      })
      .catch(() => {});
  }, [characterData.id, clearConflicts, markCloudDownloaded, setSyncTransport, updateCharacter]);

  const resolveConflictManual = useCallback(() => {
    trackProductEvent('sync_conflict_resolved_later', { characterId: characterData.id });
    clearConflicts(characterData.id).catch(() => {});
    setSyncFeedback('Conflict cleared. Manual review deferred.');
  }, [characterData.id, clearConflicts]);

  const syncNow = useCallback(() => {
    if (!fbAuth.currentUser) {
      setSyncFeedback('Sign in required for cloud sync');
      return;
    }
    if (!isOnline) {
      setSyncFeedback('Offline queue active. Reconnect and retry Sync now.');
      return;
    }

    const pendingPaths = Array.from(new Set(currentSync?.pendingPaths || []));
    const fallbackPath = TAB_DEFAULT_PATH[selectedTab];
    const historyPaths = pendingPaths.length ? pendingPaths : [fallbackPath];
    const actorRole: CharacterActorRole = mapRoleToHistoryActor(roleMode);

    setSyncFeedback('Syncing now...');
    setSyncTransport(characterData.id, 'syncing', 'Syncing now...').catch(() => {});
    upsertCharacterSheetFromLocal(characterData, { historyPaths, actorRole })
      .then(() => {
        setIsCloudDoc(true);
        setCloudAvailability(characterData.id, true).catch(() => {});
        markCloudUploaded(characterData.id).catch(() => {});
        setSyncTransport(characterData.id, 'synced', 'Synced').catch(() => {});
        setSyncFeedback('Synced');
      })
      .catch((error) => {
        const message = String(error?.message || 'Sync failed');
        markSyncError(characterData.id, message).catch(() => {});
        setSyncFeedback(`Sync failed: ${message}`);
      });
  }, [
    characterData,
    currentSync?.pendingPaths,
    isOnline,
    markCloudUploaded,
    markSyncError,
    roleMode,
    selectedTab,
    setCloudAvailability,
    setSyncTransport,
  ]);

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
    const badges: Array<{ label: string; kind: 'neutral' | 'success' | 'warning' | 'accent' | 'danger' }> = [];
    badges.push({
      label: syncStatusLabel,
      kind: getSyncStatusKind(syncStatusLabel),
    });
    if (shareStatusLabel) badges.push({ label: shareStatusLabel, kind: 'accent' });
    if (!isCloudDoc) badges.push({ label: 'Local only', kind: 'neutral' });
    if (hasHomebrew) badges.push({ label: 'Homebrew', kind: 'warning' });
    if (!isOnline) badges.push({ label: 'Offline', kind: 'warning' });
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
        <Text style={styles.sectionConflictBadgeText}>Conflict</Text>
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

  const openTab = useCallback((tab: CharacterTab) => setSelectedTab(tab), []);
  const toggleSecondary = useCallback((tab: CharacterTab) => {
    setCollapsedSecondary((prev) => ({ ...prev, [tab]: !prev[tab] }));
  }, []);

  const renderBadge = useCallback((label: string, kind: 'neutral' | 'success' | 'warning' | 'accent' | 'danger') => {
    const badgeStyle: Array<any> = [styles.badge];
    const badgeText: Array<any> = [styles.badgeText];

    if (kind === 'success') badgeStyle.push(styles.badgeSuccess);
    if (kind === 'warning') badgeStyle.push(styles.badgeWarning);
    if (kind === 'accent') badgeStyle.push(styles.badgeAccent);
    if (kind === 'danger') badgeStyle.push(styles.badgeDanger);
    if (kind !== 'neutral') badgeText.push(styles.badgeTextInverted);

    return (
      <View key={`${label}-${kind}`} style={badgeStyle}>
        <Text style={badgeText}>{label}</Text>
      </View>
    );
  }, [
    styles.badge,
    styles.badgeAccent,
    styles.badgeDanger,
    styles.badgeSuccess,
    styles.badgeText,
    styles.badgeTextInverted,
    styles.badgeWarning,
  ]);

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
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Top Skills</Text>
            {sectionConflictLabel(['overview.conditions'])}
          </View>
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
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Combat Tools</Text>
          {sectionConflictLabel(['combat.core', 'combat.hp', 'combat.rest'])}
        </View>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Combat')} android_ripple={{ color: '#999' }}>
          <Text style={styles.collapseButtonText}>{collapsedSecondary.Combat ? 'Розгорнути' : 'Згорнути'}</Text>
        </Pressable>
      </View>

      <Text style={styles.subSectionTitle}>Actions</Text>
      <Text style={styles.blockText}>
        {characterData.combatTemplates?.actions?.length ? `• ${characterData.combatTemplates.actions.join('\n• ')}` : '• Немає шаблонів дій'}
      </Text>
      <Text style={styles.subSectionTitle}>Bonus Actions</Text>
      <Text style={styles.blockText}>
        {characterData.combatTemplates?.bonusActions?.length
          ? `• ${characterData.combatTemplates.bonusActions.join('\n• ')}`
          : '• Немає шаблонів bonus actions'}
      </Text>
      <Text style={styles.subSectionTitle}>Reactions</Text>
      <Text style={styles.blockText}>
        {characterData.combatTemplates?.reactions?.length
          ? `• ${characterData.combatTemplates.reactions.join('\n• ')}`
          : '• Немає шаблонів reactions'}
      </Text>

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

    return (
      <View style={styles.cardSecondary}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Magic Snapshot</Text>
            {sectionConflictLabel(['magic.'])}
          </View>
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
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Inventory</Text>
          {sectionConflictLabel(['inventory.'])}
        </View>
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
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Notes</Text>
          {sectionConflictLabel(['homebrew.notes-groups'])}
        </View>
        <Pressable style={styles.collapseButton} onPress={() => toggleSecondary('Notes')} android_ripple={{ color: '#999' }}>
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
    </View>
  );

  const renderHomebrewPlay = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Homebrew</Text>
          {sectionConflictLabel(['homebrew.'])}
        </View>
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
          <Text style={styles.subSectionTitle}>Custom Resources</Text>
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
                    android_ripple={{ color: '#999' }}
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
                    android_ripple={{ color: '#999' }}
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

          <Text style={styles.subSectionTitle}>Custom Sections</Text>
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

          <Text style={styles.subSectionTitle}>Homebrew Entries</Text>
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
            <Text style={styles.blockTextMuted}>Entries не додані</Text>
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
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Identity</Text>
        {sectionConflictLabel(['overview.identity'])}
      </View>
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
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Combat Config</Text>
        {sectionConflictLabel(['combat.core', 'combat.hp', 'combat.rest'])}
      </View>
      <Text style={styles.editLabel}>HP Current</Text>
      {renderTextInput(
        String(characterData.hp.current),
        (next) =>
          patchCharacter((prev) => ({
            ...prev,
            hp: { ...prev.hp, current: clamp(parseNumber(next, prev.hp.current), 0, prev.hp.max) },
          }), ['combat.hp']),
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
          }, ['combat.hp']),
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
          }), ['combat.hp']),
        'Temp HP',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>AC</Text>
      {renderTextInput(
        String(characterData.ac),
        (next) => patchCharacter((prev) => ({ ...prev, ac: Math.max(0, parseNumber(next, prev.ac)) }), ['combat.core']),
        'Armor Class',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Speed</Text>
      {renderTextInput(
        String(characterData.speed),
        (next) => patchCharacter((prev) => ({ ...prev, speed: Math.max(0, parseNumber(next, prev.speed)) }), ['combat.core']),
        'Speed',
        { keyboardType: 'number-pad' },
      )}
      <Text style={styles.editLabel}>Initiative</Text>
      {renderTextInput(
        String(characterData.initiative),
        (next) => patchCharacter((prev) => ({ ...prev, initiative: parseNumber(next, prev.initiative) }), ['combat.core']),
        'Initiative',
        { keyboardType: 'number-pad' },
      )}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Combat Templates</Text>
        {sectionConflictLabel(['combat.templates'])}
      </View>
      <Text style={styles.editLabel}>Actions (one per line)</Text>
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
        'Attack with longsword',
        { multiline: true },
      )}
      <Text style={styles.editLabel}>Bonus Actions (one per line)</Text>
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
        'Second Wind',
        { multiline: true },
      )}
      <Text style={styles.editLabel}>Reactions (one per line)</Text>
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
        'Opportunity Attack',
        { multiline: true },
      )}
    </View>
  );

  const renderMagicEdit = () => {
    const slotLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
      <View style={styles.cardSecondary}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Magic Config</Text>
          {sectionConflictLabel(['magic.'])}
        </View>
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
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Inventory Config</Text>
        {sectionConflictLabel(['inventory.'])}
      </View>
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
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Notes Groups</Text>
        {sectionConflictLabel(['homebrew.notes-groups'])}
      </View>
      <TouchableOpacity style={styles.secondaryAction} onPress={addNotesGroup} activeOpacity={0.85}>
        <Text style={styles.secondaryActionText}>+ Додати notes group</Text>
      </TouchableOpacity>
      {notesGroups.map((group) => (
        <View key={group.id} style={styles.editCardBlock}>
          <Text style={styles.editLabel}>Group Title</Text>
          {renderTextInput(group.title, (next) => updateNotesGroupMeta(group.id, { title: next }), 'Group title')}
          <Text style={styles.editLabel}>Group Content</Text>
          {renderTextInput(group.content || '', (next) => setNotesGroup(group.id, next), 'Notes content', { multiline: true })}
          {group.origin === 'custom' && (
            <TouchableOpacity style={styles.removeButton} onPress={() => removeNotesGroup(group.id)} activeOpacity={0.85}>
              <Text style={styles.removeButtonText}>Видалити notes group</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderHomebrewEdit = () => (
    <View style={styles.cardSecondary}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Homebrew Fields</Text>
        {sectionConflictLabel(['homebrew.fields'])}
      </View>
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
            ) : field.type === 'select' ? (
              <>
                <Text style={styles.editLabel}>Options (one per line)</Text>
                {renderTextInput(
                  (field.options || []).join('\n'),
                  (next) => updateCustomField(field.id, { options: parseLines(next) }),
                  'Option A\nOption B',
                  { multiline: true },
                )}
                <Text style={styles.editLabel}>Value</Text>
                {renderTextInput(String(field.value ?? ''), (next) => updateCustomField(field.id, { value: next }), 'Value')}
              </>
            ) : (
              renderTextInput(String(field.value ?? ''), (next) => updateCustomField(field.id, { value: next }), 'Value')
            )}

            <TouchableOpacity style={styles.removeButton} onPress={() => removeCustomField(field.id)} activeOpacity={0.85}>
              <Text style={styles.removeButtonText}>Видалити поле</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Custom Resources</Text>
        {sectionConflictLabel(['homebrew.resources'])}
      </View>
      <TouchableOpacity style={styles.secondaryAction} onPress={addResource} activeOpacity={0.85}>
        <Text style={styles.secondaryActionText}>+ Додати resource</Text>
      </TouchableOpacity>
      <Text style={styles.subSectionTitle}>System Templates</Text>
      {SYSTEM_RESOURCE_TEMPLATES.map((template) => (
        <Pressable
          key={template.id}
          style={styles.secondaryAction}
          onPress={() => applyResourceTemplate(template.resource)}
          android_ripple={{ color: '#999' }}
        >
          <Text style={styles.secondaryActionText}>Apply: {template.name}</Text>
        </Pressable>
      ))}
      {!!userTemplates.length && <Text style={styles.subSectionTitle}>User Templates</Text>}
      {userTemplates.map((template) => (
        <View key={template.id} style={styles.editCardBlock}>
          <Text style={styles.rowLabel}>{template.name}</Text>
          <Text style={styles.blockTextMuted}>
            {template.resource.label} • {template.resource.current}/{template.resource.max ?? '∞'} • {template.resource.resetRule}
          </Text>
          <Pressable
            style={styles.secondaryAction}
            onPress={() => applyResourceTemplate(template.resource)}
            android_ripple={{ color: '#999' }}
          >
            <Text style={styles.secondaryActionText}>Apply User Template</Text>
          </Pressable>
          <TouchableOpacity style={styles.removeButton} onPress={() => removeUserTemplate(template.id)} activeOpacity={0.85}>
            <Text style={styles.removeButtonText}>Видалити шаблон</Text>
          </TouchableOpacity>
        </View>
      ))}

      {(characterData.customResources || []).map((resource) => {
        const ruleIndex = TRACKER_RULES.indexOf(resource.resetRule);
        const nextRule = TRACKER_RULES[(ruleIndex + 1) % TRACKER_RULES.length];
        return (
          <View key={resource.id} style={styles.editCardBlock}>
            <Text style={styles.editLabel}>Resource Label</Text>
            {renderTextInput(resource.label, (next) => updateResource(resource.id, { label: next }), 'Resource name')}
            <Text style={styles.editLabel}>Current</Text>
            {renderTextInput(
              String(resource.current),
              (next) => updateResource(resource.id, { current: Math.max(0, parseNumber(next, resource.current)) }),
              'Current',
              { keyboardType: 'number-pad' },
            )}
            <Text style={styles.editLabel}>Max (optional)</Text>
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
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.collapseButtonText}>Змінити reset</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.secondaryAction}
              onPress={() => saveUserTemplateFromResource(resource)}
              android_ripple={{ color: '#999' }}
            >
              <Text style={styles.secondaryActionText}>Save as User Template</Text>
            </Pressable>

            <TouchableOpacity style={styles.removeButton} onPress={() => removeResource(resource.id)} activeOpacity={0.85}>
              <Text style={styles.removeButtonText}>Видалити resource</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Custom Sections</Text>
        {sectionConflictLabel(['homebrew.sections'])}
      </View>
      <TouchableOpacity style={styles.secondaryAction} onPress={addCustomSection} activeOpacity={0.85}>
        <Text style={styles.secondaryActionText}>+ Додати section</Text>
      </TouchableOpacity>
      {(characterData.customSections || []).map((section) => (
        <View key={section.id} style={styles.editCardBlock}>
          <Text style={styles.editLabel}>Section Title</Text>
          {renderTextInput(section.title, (next) => updateCustomSection(section.id, { title: next }), 'Section title')}
          <Text style={styles.editLabel}>Section Content</Text>
          {renderTextInput(section.content, (next) => updateCustomSection(section.id, { content: next }), 'Section content', {
            multiline: true,
          })}
          <TouchableOpacity style={styles.removeButton} onPress={() => removeCustomSection(section.id)} activeOpacity={0.85}>
            <Text style={styles.removeButtonText}>Видалити section</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Homebrew Entries</Text>
        {sectionConflictLabel(['homebrew.entries'])}
      </View>
      <View style={styles.slotEditRow}>
        <Pressable style={styles.secondaryAction} onPress={() => addHomebrewEntry('spell')} android_ripple={{ color: '#999' }}>
          <Text style={styles.secondaryActionText}>+ Spell</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => addHomebrewEntry('ability')} android_ripple={{ color: '#999' }}>
          <Text style={styles.secondaryActionText}>+ Ability</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => addHomebrewEntry('feat')} android_ripple={{ color: '#999' }}>
          <Text style={styles.secondaryActionText}>+ Feat</Text>
        </Pressable>
      </View>
      {(characterData.homebrewEntries || []).map((entry) => {
        const kinds: CharacterHomebrewEntry['kind'][] = ['spell', 'ability', 'feat'];
        const kindIndex = kinds.indexOf(entry.kind);
        const nextKind = kinds[(kindIndex + 1) % kinds.length];
        return (
          <View key={entry.id} style={styles.editCardBlock}>
            <Text style={styles.editLabel}>Name</Text>
            {renderTextInput(entry.name, (next) => updateHomebrewEntry(entry.id, { name: next }), 'Entry name')}
            <Text style={styles.editLabel}>Description</Text>
            {renderTextInput(entry.description, (next) => updateHomebrewEntry(entry.id, { description: next }), 'Description', {
              multiline: true,
            })}
            <Text style={styles.editLabel}>Tags (one per line)</Text>
            {renderTextInput((entry.tags || []).join('\n'), (next) => updateHomebrewEntry(entry.id, { tags: parseLines(next) }), 'tag-a\ntag-b', {
              multiline: true,
            })}
            <View style={styles.cardHeaderRow}>
              <Text style={styles.rowLabel}>Kind: {entry.kind}</Text>
              <Pressable
                style={styles.collapseButton}
                onPress={() => updateHomebrewEntry(entry.id, { kind: nextKind })}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.collapseButtonText}>Змінити kind</Text>
              </Pressable>
            </View>
            <TouchableOpacity style={styles.removeButton} onPress={() => removeHomebrewEntry(entry.id)} activeOpacity={0.85}>
              <Text style={styles.removeButtonText}>Видалити entry</Text>
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
                <CharacterMenu
                  character={characterData}
                  isCloudDoc={isCloudDoc}
                  isSharedSheet={isSharedSheet}
                  onSyncNow={syncNow}
                  onChange={(next) => setCharacterData(ensureCharacterDefaults(next))}
                />
              </View>
              <Text style={styles.characterMeta}>
                {characterData.class || 'Class'} / {characterData.race || 'Race'} / Lv.{characterData.level}
              </Text>
              <View style={styles.badgesRow}>{syncBadges.map((badge) => renderBadge(badge.label, badge.kind))}</View>
              <View style={styles.syncIndicatorRow}>
                <Text style={styles.syncIndicatorText}>Sync status: {syncStatusLabel}</Text>
                <Text style={styles.syncIndicatorText}>Feedback: {syncFeedback}</Text>
                {currentSync?.transportMessage ? <Text style={styles.syncIndicatorText}>{currentSync.transportMessage}</Text> : null}
              </View>
              <Pressable style={styles.syncNowButton} onPress={syncNow} android_ripple={{ color: '#999' }}>
                <MaterialCommunityIcons name='sync' size={16} color={colors.text} />
                <Text style={styles.syncNowButtonText}>Sync now</Text>
              </Pressable>
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
              onPress={() => patchCharacter((prev) => ({ ...prev, sessionMode: !prev.sessionMode }), ['overview.session-mode'])}
              android_ripple={{ color: '#999' }}
            >
              <Text style={[styles.sessionToggleText, characterData.sessionMode ? styles.sessionToggleTextActive : null]}>Session Mode</Text>
            </Pressable>
          </View>
        </View>

        {currentSync?.status === 'conflict' && (
          <View style={styles.conflictCard}>
            <View style={styles.conflictHeader}>
              <MaterialCommunityIcons name='alert-circle-outline' size={20} color='#f59e0b' />
              <Text style={styles.conflictTitle}>Sync conflict detected</Text>
            </View>
            <Text style={styles.conflictText}>
              Локальні та cloud зміни перетнулися в одній секції. Обери стратегію злиття.
            </Text>
            {currentSync.conflictPaths.length > 0 && (
              <Text style={styles.conflictPaths}>Paths: {currentSync.conflictPaths.join(', ')}</Text>
            )}
            <View style={styles.conflictActionsRow}>
              <Pressable style={styles.conflictAction} onPress={resolveConflictWithLocal} android_ripple={{ color: '#999' }}>
                <Text style={styles.conflictActionText}>Keep Local</Text>
              </Pressable>
              <Pressable style={styles.conflictAction} onPress={resolveConflictWithCloud} android_ripple={{ color: '#999' }}>
                <Text style={styles.conflictActionText}>Use Cloud</Text>
              </Pressable>
              <Pressable style={styles.conflictAction} onPress={resolveConflictManual} android_ripple={{ color: '#999' }}>
                <Text style={styles.conflictActionText}>Resolve Later</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.combatSummaryCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.summaryTitle}>Combat Summary</Text>
            {sectionConflictLabel(['combat.hp', 'combat.core'])}
          </View>
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
                <Pressable
                  key={action.id}
                  style={styles.quickActionButton}
                  onPress={() => {
                    trackProductEvent('quick_action_used', {
                      characterId: characterData.id,
                      actionId: action.id,
                    });
                    action.onPress();
                  }}
                  android_ripple={{ color: '#999' }}
                >
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
                style={[styles.tabChip, selectedTab === tab ? styles.tabChipActive : null, hasConflictForTab(tab) ? styles.tabChipConflict : null]}
                onPress={() => openTab(tab)}
                android_ripple={{ color: '#999' }}
              >
                <View style={styles.tabChipInner}>
                  <Text style={[styles.tabChipText, selectedTab === tab ? styles.tabChipTextActive : null]}>{tab}</Text>
                  {hasConflictForTab(tab) && <MaterialCommunityIcons name='alert-circle' size={14} color='#f59e0b' />}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {isSharedSheet && (
          <View style={styles.cardSecondary}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Shared Change History ({selectedTab})</Text>
            </View>
            {latestTabChangeLabel && (
              <Text style={styles.blockTextMuted}>
                Last change marker: {latestTabChangeLabel} at {new Date(latestTabChange.atMs).toLocaleString()}
              </Text>
            )}
            {!tabHistory.length && <Text style={styles.blockTextMuted}>Для цієї вкладки ще немає shared історії.</Text>}
            {tabHistory.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyAuthor}>
                  {getChangeSourceLabel({ uid: entry.uid, actorRole: entry.actorRole, currentUid: fbAuth.currentUser?.uid })}
                </Text>
                <Text style={styles.historyMeta}>{new Date(entry.atMs).toLocaleString()}</Text>
                <Text style={styles.historyPaths}>{entry.summary || entry.paths.join(', ') || '—'}</Text>
              </View>
            ))}
          </View>
        )}

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
