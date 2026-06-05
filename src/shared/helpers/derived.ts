import type { Stats } from '@/types/Stats';
import type { Skills } from '@/types/Skills';
import type { SkillProficiencyRank } from '@/types/Character';

export const abilityMod = (score: number): number => Math.floor((score - 10) / 2);

type AbilityKey = keyof Stats;
type SkillKey = keyof Skills;

const DEFAULT_STATS: Stats = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

const SKILL_KEYS: SkillKey[] = [
  'acrobatics',
  'animalHandling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleightOfHand',
  'stealth',
  'survival',
];

export const skillAbilityMap: Record<SkillKey, AbilityKey> = {
  acrobatics: 'dexterity',
  animalHandling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
};

export const skillKeys: SkillKey[] = SKILL_KEYS;

function normalizeStats(stats?: Partial<Stats>): Stats {
  return {
    ...DEFAULT_STATS,
    ...(stats || {}),
  };
}

export function computeSkills(stats?: Partial<Stats>): Skills {
  const safeStats = normalizeStats(stats);
  const skills = {} as Skills;
  for (const skillKey of SKILL_KEYS) {
    const abilityKey = skillAbilityMap[skillKey];
    skills[skillKey] = abilityMod(safeStats[abilityKey]);
  }
  return skills;
}

export function getSkillProficiencyBonus(rank: SkillProficiencyRank | undefined, proficiencyBonus: number): number {
  if (rank === 'expertise') return proficiencyBonus * 2;
  if (rank === 'proficient') return proficiencyBonus;
  if (rank === 'half') return Math.floor(proficiencyBonus / 2);
  return 0;
}

export function computeSkillBonus(args: {
  stats?: Partial<Stats>;
  skill: SkillKey;
  rank?: SkillProficiencyRank;
  proficiencyBonus: number;
  fallbackValue?: number;
}): number {
  if (!args.rank && typeof args.fallbackValue === 'number') return args.fallbackValue;

  const safeStats = normalizeStats(args.stats);
  const abilityKey = skillAbilityMap[args.skill];
  return abilityMod(safeStats[abilityKey]) + getSkillProficiencyBonus(args.rank, args.proficiencyBonus);
}

export function computeAC(stats: Partial<Stats> | undefined, cls: string): number {
  const safeStats = normalizeStats(stats);
  const dex = abilityMod(safeStats.dexterity);
  const base = 10 + dex;
  const classKey = (cls || '').toLowerCase();

  if (classKey === 'barbarian') {
    const con = abilityMod(safeStats.constitution);
    return Math.max(base, 10 + dex + con);
  }

  if (classKey === 'monk') {
    const wis = abilityMod(safeStats.wisdom);
    return Math.max(base, 10 + dex + wis);
  }

  return base;
}

export function getHitDieForClass(cls: string): number {
  const c = (cls || '').toLowerCase();
  switch (c) {
    case 'barbarian': return 12;
    case 'fighter':
    case 'paladin':
    case 'ranger': return 10;
    case 'bard':
    case 'cleric':
    case 'druid':
    case 'monk':
    case 'rogue':
    case 'warlock':
    case 'artificer': return 8;
    case 'wizard':
    case 'sorcerer': return 6;
    default: return 8;
  }
}

export function computeHP(level: number, cls: string, conScore: number): { max: number, current: number, temp: number, hitDice: string } {
  const hitDie = getHitDieForClass(cls);
  const conMod = abilityMod(conScore ?? 10);
  let max = hitDie + conMod;
  if (level > 1) {
    const perLevel = Math.floor(hitDie / 2) + 1 + conMod;
    max += perLevel * (level - 1);
  }
  if (max < 1) max = 1;
  return { max, current: max, temp: 0, hitDice: `${level}d${hitDie}` };
}

export function computeSpeed(defaultSpeed: number | undefined, raceSpeed: number | undefined): number {
  if (typeof raceSpeed === 'number') return raceSpeed;
  if (typeof defaultSpeed === 'number') return defaultSpeed;
  return 30;
}
