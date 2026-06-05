import type {
  CharacterCustomField,
  CharacterCustomResource,
  CharacterCustomSection,
  CharacterEntity,
  CharacterHomebrewEntry,
  CharacterTemplateId,
  SkillProficiencyRank,
} from '@/domain/types';
import { BACKGROUNDS } from '@/shared/const/Backgrounds';
import { CLASS_OPTIONS } from '@/shared/const/CharacterClass';
import { CLASS_GEAR } from '@/shared/const/ClassStartingGear';
import { CLASS_PRESETS } from '@/shared/const/ClassPresets';
import { buildTemplatePatch } from '@/shared/const/CharacterTemplates';
import { AbilityKey, RACES, RACE_OPTIONS } from '@/shared/const/Races';
import { abilityMod, proficiencyBonus } from '@/shared/helpers/combat';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import { rollDice as rollDiceWithService } from '@/shared/services/diceRoller';
import skillToStat, { AbilityStatsKey, SkillKey } from '@/types/skillToStat';

export type StartMethod = 'standard-5e' | 'quick' | 'homebrew-blank' | 'import';
export type StatMethod = 'array' | 'pointbuy' | 'manual' | 'roll' | 'random';
export type StorageMode = 'local-only' | 'local-cloud';
export type ShareTarget = 'none' | 'dm' | 'player';

export const TOTAL_CREATE_CHARACTER_STEPS = 11;
export const ABILITY_KEYS: AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export const ABILITY_NAMES_UA: Record<AbilityKey, string> = {
  strength: 'Сила',
  dexterity: 'Спритність',
  constitution: 'Статура',
  intelligence: 'Інтелект',
  wisdom: 'Мудрість',
  charisma: 'Харизма',
};

export const ABILITY_SHORT: Record<AbilityKey, string> = {
  strength: 'СИЛ',
  dexterity: 'СПР',
  constitution: 'СТА',
  intelligence: 'ІНТ',
  wisdom: 'МДР',
  charisma: 'ХАР',
};

export const STANDARD_ARRAY: Record<AbilityKey, number> = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8,
};

export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

const DEFAULT_ROLL_STATS: Record<AbilityKey, number> = {
  strength: 13,
  dexterity: 13,
  constitution: 13,
  intelligence: 12,
  wisdom: 12,
  charisma: 12,
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

const BACKGROUND_SKILL_MAP: Record<string, SkillKey> = {
  Акробатика: 'acrobatics',
  'Догляд за тваринами': 'animalHandling',
  Тваринництво: 'animalHandling',
  Аркана: 'arcana',
  Атлетика: 'athletics',
  Обман: 'deception',
  Історія: 'history',
  Проникливість: 'insight',
  Залякування: 'intimidation',
  Розслідування: 'investigation',
  Медицина: 'medicine',
  Природа: 'nature',
  Увага: 'perception',
  Виступ: 'performance',
  Переконання: 'persuasion',
  Релігія: 'religion',
  'Спритність рук': 'sleightOfHand',
  Скритність: 'stealth',
  Виживання: 'survival',
};

export interface CreateCharacterDraft {
  step: number;
  startMethod: StartMethod;
  characterTemplateId: CharacterTemplateId;
  name: string;
  level: string;
  photoUri?: string;
  campaign: string;
  playerName: string;
  notes: string;
  raceKey: string;
  subraceKey: string;
  customRace: string;
  customSubrace: string;
  useCustomRace: boolean;
  selectedClass: string;
  customClassName: string;
  subclass: string;
  customSubclass: string;
  backgroundKey: string;
  customBackground: string;
  statMethod: StatMethod;
  stats: Record<AbilityKey, number>;
  pointBuyStats: Record<AbilityKey, number>;
  manualStats: Record<AbilityKey, string>;
  rollStats: Record<AbilityKey, string>;
  rollDetails: Record<AbilityKey, string>;
  flexPick1: AbilityKey;
  flexPick2: AbilityKey;
  hpMax: string;
  hpCurrent: string;
  hitDice: string;
  ac: string;
  speed: string;
  initiative: string;
  proficiencyBonus: string;
  savingThrows: Record<AbilityKey, boolean>;
  gearSelections: number[];
  weaponsText: string;
  armor: string;
  shield: boolean;
  toolsText: string;
  currencyGold: string;
  currencySilver: string;
  currencyCopper: string;
  startingPack: string;
  magicEnabled: boolean;
  spellcastingAbility: AbilityKey;
  spellSaveDC: string;
  spellAttackBonus: string;
  cantripsText: string;
  knownSpellsText: string;
  preparedSpellsText: string;
  spellSlotsText: string;
  alignment: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  customFieldsText: string;
  customResourcesText: string;
  customSectionsText: string;
  customTrackersText: string;
  customAbilitiesText: string;
  storageMode: StorageMode;
  shareTarget: ShareTarget;
  inviteEmail: string;
}

export interface DraftDefaults {
  finalStats: Record<AbilityKey, number>;
  baseStats: Record<AbilityKey, number>;
  racialBonus: Record<AbilityKey, number>;
  pointBuySpent: number;
  pointBuyValid: boolean;
  resolvedRace: string;
  resolvedSubrace?: string;
  resolvedClassName: string;
  resolvedSubclass?: string;
  resolvedBackground?: string;
  isCaster: boolean;
  showMagic: boolean;
  hitDie: number;
  defaultHp: number;
  defaultHitDice: string;
  defaultSpeed: number;
  defaultInitiative: number;
  defaultProficiencyBonus: number;
  selectedGear: string[];
  backgroundMechanics: BackgroundMechanics;
}

export interface BackgroundMechanics {
  skillProficiencies: Partial<Record<SkillKey, SkillProficiencyRank>>;
  tools: string[];
  proficiencies: string[];
  featureText?: string;
}

export interface AbilityRollResult {
  rolls: number[];
  kept: number[];
  dropped: number;
  total: number;
  detail: string;
}

export function createInitialDraft(): CreateCharacterDraft {
  const selectedClass = CLASS_OPTIONS[0] || 'fighter';
  const raceKey = RACE_OPTIONS[0] || 'human';
  const backgroundKey = BACKGROUNDS[0]?.key || 'custom';
  const level = '1';
  const hitDie = CLASS_PRESETS[selectedClass]?.hitDie ?? 8;
  const speed = RACES[raceKey]?.speed ?? 30;

  return {
    step: 1,
    startMethod: 'standard-5e',
    characterTemplateId: 'standard-5e',
    name: '',
    level,
    campaign: '',
    playerName: '',
    notes: '',
    raceKey,
    subraceKey: '',
    customRace: '',
    customSubrace: '',
    useCustomRace: false,
    selectedClass,
    customClassName: '',
    subclass: '',
    customSubclass: '',
    backgroundKey,
    customBackground: '',
    statMethod: 'array',
    stats: { ...STANDARD_ARRAY },
    pointBuyStats: {
      strength: 8,
      dexterity: 8,
      constitution: 8,
      intelligence: 8,
      wisdom: 8,
      charisma: 8,
    },
    manualStats: stringifyStats(STANDARD_ARRAY),
    rollStats: stringifyStats(DEFAULT_ROLL_STATS),
    rollDetails: emptyStatText(),
    flexPick1: 'strength',
    flexPick2: 'dexterity',
    hpMax: String(hitDie + abilityMod(STANDARD_ARRAY.constitution)),
    hpCurrent: String(hitDie + abilityMod(STANDARD_ARRAY.constitution)),
    hitDice: `1d${hitDie}`,
    ac: '10',
    speed: String(speed),
    initiative: String(abilityMod(STANDARD_ARRAY.dexterity)),
    proficiencyBonus: String(proficiencyBonus(1)),
    savingThrows: createSavingThrowDefaults(selectedClass),
    gearSelections: [],
    weaponsText: '',
    armor: '',
    shield: false,
    toolsText: '',
    currencyGold: String(BG_COINS[backgroundKey] || 0),
    currencySilver: '0',
    currencyCopper: '0',
    startingPack: '',
    magicEnabled: Boolean(CLASS_PRESETS[selectedClass]?.spellcastingAbility),
    spellcastingAbility: (CLASS_PRESETS[selectedClass]?.spellcastingAbility as AbilityKey | undefined) ?? 'intelligence',
    spellSaveDC: '',
    spellAttackBonus: '',
    cantripsText: '',
    knownSpellsText: '',
    preparedSpellsText: '',
    spellSlotsText: '',
    alignment: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    customFieldsText: '',
    customResourcesText: '',
    customSectionsText: '',
    customTrackersText: '',
    customAbilitiesText: '',
    storageMode: 'local-only',
    shareTarget: 'none',
    inviteEmail: '',
  };
}

function stringifyStats(stats: Record<AbilityKey, number>): Record<AbilityKey, string> {
  return {
    strength: String(stats.strength),
    dexterity: String(stats.dexterity),
    constitution: String(stats.constitution),
    intelligence: String(stats.intelligence),
    wisdom: String(stats.wisdom),
    charisma: String(stats.charisma),
  };
}

function emptyStatText(): Record<AbilityKey, string> {
  return {
    strength: '',
    dexterity: '',
    constitution: '',
    intelligence: '',
    wisdom: '',
    charisma: '',
  };
}

export function mergeDraftWithDefaults(value: Partial<CreateCharacterDraft> | null | undefined): CreateCharacterDraft {
  const defaults = createInitialDraft();
  if (!value) return defaults;
  return {
    ...defaults,
    ...value,
    stats: { ...defaults.stats, ...(value.stats || {}) },
    pointBuyStats: { ...defaults.pointBuyStats, ...(value.pointBuyStats || {}) },
    manualStats: { ...defaults.manualStats, ...(value.manualStats || {}) },
    rollStats: { ...defaults.rollStats, ...(value.rollStats || {}) },
    rollDetails: { ...defaults.rollDetails, ...(value.rollDetails || {}) },
    savingThrows: { ...defaults.savingThrows, ...(value.savingThrows || {}) },
    gearSelections: Array.isArray(value.gearSelections) ? value.gearSelections : defaults.gearSelections,
    step: clampNumber(value.step ?? defaults.step, 1, TOTAL_CREATE_CHARACTER_STEPS),
  };
}

export function applyStartMethod(draft: CreateCharacterDraft, method: StartMethod): CreateCharacterDraft {
  if (method === 'quick') {
    const next = {
      ...draft,
      startMethod: method,
      characterTemplateId: 'standard-5e' as CharacterTemplateId,
      statMethod: 'array' as StatMethod,
      stats: { ...STANDARD_ARRAY },
      selectedClass: draft.selectedClass === 'custom' ? 'fighter' : draft.selectedClass,
      useCustomRace: false,
      magicEnabled: Boolean(CLASS_PRESETS[draft.selectedClass]?.spellcastingAbility),
    };
    return applyDerivedDefaults(next, { forceCombat: true, forceEquipment: true });
  }

  if (method === 'homebrew-blank') {
    return {
      ...draft,
      startMethod: method,
      characterTemplateId: 'custom-blank',
      useCustomRace: true,
      customRace: draft.customRace || 'Власна раса',
      selectedClass: 'custom',
      customClassName: draft.customClassName || 'Власний клас',
      backgroundKey: 'custom',
      customBackground: draft.customBackground || 'Власна предісторія',
      statMethod: 'manual',
      magicEnabled: true,
    };
  }

  if (method === 'standard-5e') {
    const next = {
      ...draft,
      startMethod: method,
      characterTemplateId: 'standard-5e' as CharacterTemplateId,
      useCustomRace: false,
      selectedClass: draft.selectedClass === 'custom' ? CLASS_OPTIONS[0] || 'fighter' : draft.selectedClass,
      statMethod: draft.statMethod === 'manual' ? 'array' : draft.statMethod,
    };
    return applyDerivedDefaults(next, { forceCombat: true });
  }

  return { ...draft, startMethod: method };
}

export function applyDerivedDefaults(
  draft: CreateCharacterDraft,
  options: { forceCombat?: boolean; forceEquipment?: boolean } = {},
): CreateCharacterDraft {
  const defaults = deriveDraftDefaults(draft);
  const spellAbility = (CLASS_PRESETS[draft.selectedClass]?.spellcastingAbility as AbilityKey | undefined) ?? draft.spellcastingAbility;
  const spellMod = abilityMod(defaults.finalStats[spellAbility] ?? 10);
  const proficiency = defaults.defaultProficiencyBonus;
  const saveDc = 8 + proficiency + spellMod;
  const spellAttack = proficiency + spellMod;
  const selectedGear = defaults.selectedGear;

  return {
    ...draft,
    hpMax: options.forceCombat || !draft.hpMax ? String(defaults.defaultHp) : draft.hpMax,
    hpCurrent: options.forceCombat || !draft.hpCurrent ? String(defaults.defaultHp) : draft.hpCurrent,
    hitDice: options.forceCombat || !draft.hitDice ? defaults.defaultHitDice : draft.hitDice,
    speed: options.forceCombat || !draft.speed ? String(defaults.defaultSpeed) : draft.speed,
    initiative: options.forceCombat || !draft.initiative ? String(defaults.defaultInitiative) : draft.initiative,
    proficiencyBonus: options.forceCombat || !draft.proficiencyBonus ? String(proficiency) : draft.proficiencyBonus,
    savingThrows: options.forceCombat ? createSavingThrowDefaults(draft.selectedClass) : draft.savingThrows,
    weaponsText: options.forceEquipment ? selectedGear.filter((item) => looksLikeWeapon(item)).join('\n') : draft.weaponsText,
    armor: options.forceEquipment ? selectedGear.find((item) => looksLikeArmor(item)) || draft.armor : draft.armor,
    shield: options.forceEquipment ? selectedGear.some((item) => item.toLowerCase().includes('щит')) : draft.shield,
    startingPack: options.forceEquipment ? selectedGear.filter((item) => !looksLikeWeapon(item) && !looksLikeArmor(item)).join('\n') : draft.startingPack,
    currencyGold: draft.currencyGold || String(BG_COINS[draft.backgroundKey] || 0),
    magicEnabled: draft.magicEnabled || defaults.isCaster,
    spellcastingAbility: spellAbility,
    spellSaveDC: draft.spellSaveDC || String(saveDc),
    spellAttackBonus: draft.spellAttackBonus || String(spellAttack),
  };
}

export function deriveDraftDefaults(draft: CreateCharacterDraft): DraftDefaults {
  const level = parseInteger(draft.level, 1);
  const raceDef = draft.useCustomRace ? undefined : RACES[draft.raceKey];
  const subraceDef = !draft.useCustomRace && draft.subraceKey ? raceDef?.subraces?.[draft.subraceKey] : undefined;
  const baseStats = getBaseStats(draft);
  const racialBonus = createEmptyStats();

  ABILITY_KEYS.forEach((ability) => {
    const raceValue = raceDef?.asi?.[ability];
    const subraceValue = subraceDef?.asi?.[ability];
    if (typeof raceValue === 'number') racialBonus[ability] += raceValue;
    if (typeof subraceValue === 'number') racialBonus[ability] += subraceValue;
  });

  const flex = subraceDef?.flexible || raceDef?.flexible;
  if (flex?.count === 2) {
    const excluded = new Set(flex.exclude || []);
    if (!excluded.has(draft.flexPick1)) racialBonus[draft.flexPick1] += 1;
    if (draft.flexPick2 !== draft.flexPick1 && !excluded.has(draft.flexPick2)) racialBonus[draft.flexPick2] += 1;
  }

  const finalStats = createEmptyStats();
  ABILITY_KEYS.forEach((ability) => {
    finalStats[ability] = baseStats[ability] + racialBonus[ability];
  });

  const classPreset = CLASS_PRESETS[draft.selectedClass];
  const hitDie = classPreset?.hitDie ?? 8;
  const defaultHp = Math.max(1, hitDie + abilityMod(finalStats.constitution));
  const defaultSpeed = raceDef?.speed ?? parseInteger(draft.speed, 30);
  const defaultInitiative = abilityMod(finalStats.dexterity);
  const defaultProficiencyBonus = proficiencyBonus(level);
  const gearDef = draft.selectedClass !== 'custom' ? CLASS_GEAR[draft.selectedClass] : undefined;
  const selectedGear = gearDef
    ? [
        ...gearDef.base,
        ...gearDef.choices.map((choice, index) => choice.options[draft.gearSelections[index] ?? 0] || choice.options[0]),
      ]
    : [];

  const backgroundDef = BACKGROUNDS.find((item) => item.key === draft.backgroundKey);
  const isCaster = Boolean(classPreset?.spellcastingAbility);

  return {
    finalStats,
    baseStats,
    racialBonus,
    pointBuySpent: pointBuySpent(draft.pointBuyStats),
    pointBuyValid: pointBuySpent(draft.pointBuyStats) <= POINT_BUY_BUDGET,
    resolvedRace: draft.useCustomRace ? draft.customRace.trim() : raceDef?.name || draft.raceKey,
    resolvedSubrace: draft.useCustomRace ? draft.customSubrace.trim() || undefined : draft.subraceKey || undefined,
    resolvedClassName: draft.selectedClass === 'custom' ? draft.customClassName.trim() : draft.selectedClass,
    resolvedSubclass: draft.selectedClass === 'custom' ? draft.customSubclass.trim() || undefined : draft.subclass || undefined,
    resolvedBackground: draft.backgroundKey === 'custom' ? draft.customBackground.trim() : backgroundDef?.name || draft.backgroundKey,
    isCaster,
    showMagic: isCaster || draft.magicEnabled,
    hitDie,
    defaultHp,
    defaultHitDice: `${level}d${hitDie}`,
    defaultSpeed,
    defaultInitiative,
    defaultProficiencyBonus,
    selectedGear,
    backgroundMechanics: buildBackgroundMechanics(draft.backgroundKey),
  };
}

export function getBaseStats(draft: CreateCharacterDraft): Record<AbilityKey, number> {
  if (draft.statMethod === 'pointbuy') return { ...draft.pointBuyStats };
  if (draft.statMethod === 'manual') return parseStatsText(draft.manualStats, STANDARD_ARRAY);
  if (draft.statMethod === 'roll' || draft.statMethod === 'random') return parseStatsText(draft.rollStats, DEFAULT_ROLL_STATS);
  return { ...draft.stats };
}

export function formatAbilityModifier(score: number): string {
  const value = abilityMod(score);
  return value >= 0 ? `+${value}` : `${value}`;
}

export function signedNumber(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function pointBuySpent(stats: Record<AbilityKey, number>): number {
  return ABILITY_KEYS.reduce((sum, ability) => sum + (POINT_BUY_COST[stats[ability]] ?? 0), 0);
}

export function createSavingThrowDefaults(selectedClass: string): Record<AbilityKey, boolean> {
  const savingThrows = new Set(CLASS_PRESETS[selectedClass]?.savingThrows || []);
  return {
    strength: savingThrows.has('strength'),
    dexterity: savingThrows.has('dexterity'),
    constitution: savingThrows.has('constitution'),
    intelligence: savingThrows.has('intelligence'),
    wisdom: savingThrows.has('wisdom'),
    charisma: savingThrows.has('charisma'),
  };
}

export function buildBackgroundMechanics(backgroundKey: string): BackgroundMechanics {
  const background = BACKGROUNDS.find((item) => item.key === backgroundKey);
  if (!background) {
    return { skillProficiencies: {}, tools: [], proficiencies: [] };
  }

  const skillProficiencies: Partial<Record<SkillKey, SkillProficiencyRank>> = {};
  background.skills.forEach((label) => {
    const skill = BACKGROUND_SKILL_MAP[label];
    if (skill) skillProficiencies[skill] = 'proficient';
  });

  const proficiencies = [...background.skills];
  if (background.languages) proficiencies.push(`Мови: +${background.languages}`);

  return {
    skillProficiencies,
    tools: background.tools || [],
    proficiencies,
    featureText: `${background.featureName}: ${background.featureDescription}`,
  };
}

export function shouldShowMagicStep(draft: CreateCharacterDraft): boolean {
  return deriveDraftDefaults(draft).showMagic;
}

export function rollAbilityScore(random?: () => number): AbilityRollResult {
  const result = rollDiceWithService({ dice: 'd6', count: 4, label: 'Характеристика', random });
  const sorted = [...result.rolls].sort((a, b) => a - b);
  const dropped = sorted[0];
  const kept = sorted.slice(1);
  const total = kept.reduce((sum, value) => sum + value, 0);
  return {
    rolls: result.rolls,
    kept,
    dropped,
    total,
    detail: `Кидки: ${result.rolls.join(', ')} · залишено ${kept.join(' + ')} · відкинуто ${dropped}`,
  };
}

export function rollAllAbilityScores(random?: () => number): {
  stats: Record<AbilityKey, string>;
  details: Record<AbilityKey, string>;
} {
  const stats = stringifyStats(DEFAULT_ROLL_STATS);
  const details = stringifyStats(DEFAULT_ROLL_STATS);
  ABILITY_KEYS.forEach((ability) => {
    const result = rollAbilityScore(random);
    stats[ability] = String(result.total);
    details[ability] = result.detail;
  });
  return { stats, details };
}

export function buildCharacterFromDraft(draft: CreateCharacterDraft, id: string): CharacterEntity {
  const normalized = applyDerivedDefaults(draft);
  const defaults = deriveDraftDefaults(normalized);
  const level = parseInteger(normalized.level, 1);
  const proficiency = parseInteger(normalized.proficiencyBonus, defaults.defaultProficiencyBonus);
  const hpMax = Math.max(1, parseInteger(normalized.hpMax, defaults.defaultHp));
  const hpCurrent = clampNumber(parseInteger(normalized.hpCurrent, hpMax), 0, hpMax);
  const templatePatch = buildTemplatePatch(normalized.characterTemplateId);
  const backgroundMechanics = defaults.backgroundMechanics;
  const proficiencies = [
    ...(CLASS_PRESETS[normalized.selectedClass]?.proficiencies || []),
    ...backgroundMechanics.proficiencies,
    ...backgroundMechanics.tools,
  ];
  if (backgroundMechanics.featureText) proficiencies.push(backgroundMechanics.featureText);

  const character = createEmptyCharacter({
    id,
    name: normalized.name.trim(),
    class: defaults.resolvedClassName,
    subclass: defaults.resolvedSubclass,
    race: defaults.resolvedRace,
    subrace: defaults.resolvedSubrace,
    background: defaults.resolvedBackground || undefined,
    level,
    stats: defaults.finalStats,
    skills: autoFillSkills(defaults.finalStats),
    skillProficiencies: backgroundMechanics.skillProficiencies,
    savingThrows: normalized.savingThrows,
    proficiencyBonus: proficiency,
    hp: { max: hpMax, current: hpCurrent, temp: 0 },
    hitDice: normalized.hitDice.trim() || defaults.defaultHitDice,
    ac: parseInteger(normalized.ac, 10),
    speed: parseInteger(normalized.speed, defaults.defaultSpeed),
    initiative: parseInteger(normalized.initiative, defaults.defaultInitiative),
    proficiencies,
    tools: splitLines(normalized.toolsText).concat(backgroundMechanics.tools),
    inventory: buildInventory(normalized, defaults.selectedGear),
    equipment: {
      armor: normalized.armor.trim() || undefined,
      shield: normalized.shield ? 'Щит' : undefined,
    },
    weapons: splitLines(normalized.weaponsText).map((name) => ({ name, attackBonus: 0, damage: '1d6' })),
    coins: {
      gold: Math.max(0, parseInteger(normalized.currencyGold, 0)),
      silver: Math.max(0, parseInteger(normalized.currencySilver, 0)),
      copper: Math.max(0, parseInteger(normalized.currencyCopper, 0)),
    },
    spells: defaults.showMagic
      ? {
          spellcastingAbility: normalized.spellcastingAbility,
          spellSaveDC: parseInteger(normalized.spellSaveDC, 8 + proficiency + abilityMod(defaults.finalStats[normalized.spellcastingAbility])),
          spellAttackBonus: parseInteger(normalized.spellAttackBonus, proficiency + abilityMod(defaults.finalStats[normalized.spellcastingAbility])),
          spellSlots: parseSpellSlots(normalized.spellSlotsText),
          cantrips: splitLines(normalized.cantripsText),
          knownSpells: splitLines(normalized.knownSpellsText),
          preparedSpells: splitLines(normalized.preparedSpellsText),
        }
      : undefined,
    alignment: normalized.alignment.trim() || undefined,
    traits: {
      personality: normalized.notes.trim(),
      ideals: normalized.ideals.trim(),
      bonds: normalized.bonds.trim(),
      flaws: normalized.flaws.trim(),
    },
    notes: buildNotes(normalized),
    backstory: normalized.backstory.trim() || undefined,
    campaign: normalized.campaign.trim() || undefined,
    alliesAndOrganizations: normalized.playerName.trim() ? `Гравець: ${normalized.playerName.trim()}` : undefined,
    photoUri: normalized.photoUri,
    characterTemplateId: templatePatch.characterTemplateId,
    customFields: [...templateCustomFields(normalized), ...(templatePatch.customResources.length ? [] : [])],
    customResources: [...templatePatch.customResources, ...textToResources(normalized.customResourcesText), ...textToResources(normalized.customTrackersText)],
    customSections: [...(templatePatch.customSections || []), ...textToSections(normalized.customSectionsText)],
    homebrewEntries: [...templatePatch.homebrewEntries, ...textToHomebrewEntries(normalized.customAbilitiesText)],
  });

  return character;
}

function createEmptyStats(): Record<AbilityKey, number> {
  return {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  };
}

function parseStatsText(stats: Record<AbilityKey, string>, fallback: Record<AbilityKey, number>): Record<AbilityKey, number> {
  const out = createEmptyStats();
  ABILITY_KEYS.forEach((ability) => {
    out[ability] = clampNumber(parseInteger(stats[ability], fallback[ability]), 1, 30);
  });
  return out;
}

function autoFillSkills(stats: Record<AbilityKey, number>): CharacterEntity['skills'] {
  const base: CharacterEntity['skills'] = {
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
    base[skill] = abilityMod(stats[ability]);
  });

  return base;
}

function parseInteger(value: string | number | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.floor(parsed);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildInventory(draft: CreateCharacterDraft, selectedGear: string[]): string[] {
  const inventory = [
    ...selectedGear,
    ...splitLines(draft.startingPack),
    ...(draft.armor.trim() ? [draft.armor.trim()] : []),
    ...(draft.shield ? ['Щит'] : []),
  ];
  return Array.from(new Set(inventory.filter(Boolean)));
}

function buildNotes(draft: CreateCharacterDraft): string | undefined {
  const lines = [
    draft.notes.trim(),
    draft.customFieldsText.trim() ? `Власні поля:\n${draft.customFieldsText.trim()}` : '',
    draft.customTrackersText.trim() ? `Власні трекери:\n${draft.customTrackersText.trim()}` : '',
  ].filter(Boolean);
  return lines.length ? lines.join('\n\n') : undefined;
}

function parseSpellSlots(value: string): CharacterEntity['spells']['spellSlots'] {
  const slots: CharacterEntity['spells']['spellSlots'] = {};
  splitLines(value).forEach((entry) => {
    const match = entry.match(/^(\d+)\s*[:x-]\s*(\d+)$/);
    if (!match) return;
    slots[Number(match[1])] = { max: Math.max(0, Number(match[2])), used: 0 };
  });
  return slots;
}

function templateCustomFields(draft: CreateCharacterDraft): CharacterCustomField[] {
  return splitLines(draft.customFieldsText).map((label, index) => ({
    id: `custom-field-${Date.now()}-${index}`,
    label,
    type: 'text',
    value: '',
  }));
}

function textToResources(value: string): CharacterCustomResource[] {
  return splitLines(value).map((label, index) => ({
    id: `custom-resource-${Date.now()}-${index}`,
    label,
    current: 0,
    resetRule: 'none',
  }));
}

function textToSections(value: string): CharacterCustomSection[] {
  return splitLines(value).map((title, index) => ({
    id: `custom-section-${Date.now()}-${index}`,
    title,
    content: '',
  }));
}

function textToHomebrewEntries(value: string): CharacterHomebrewEntry[] {
  return splitLines(value).map((name, index) => ({
    id: `custom-ability-${Date.now()}-${index}`,
    kind: 'ability',
    name,
    description: '',
    tags: ['homebrew'],
  }));
}

function looksLikeWeapon(value: string): boolean {
  const lower = value.toLowerCase();
  return ['збро', 'меч', 'сокир', 'лук', 'арбалет', 'кинджал', 'дротик', 'булава', 'рапіра', 'спис'].some((token) =>
    lower.includes(token),
  );
}

function looksLikeArmor(value: string): boolean {
  const lower = value.toLowerCase();
  return ['обладунок', 'брон', 'кольчуга', 'шкіряний'].some((token) => lower.includes(token));
}
