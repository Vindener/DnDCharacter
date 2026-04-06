import type { Stats } from '@/types/Stats';
import type { HitPoints } from '@/types/HitPoints';
import { parseDice } from '@/shared/helpers/dice';

export const MIN_CHARACTER_LEVEL = 1;
export const MAX_CHARACTER_LEVEL = 20;

export type LevelChangeDraftValues = {
  stats: Stats;
  hp: Pick<HitPoints, 'current' | 'max'>;
  ac: number;
  initiative: number;
  proficiencyBonus: number;
};

export type LevelChangeCurrentValues = {
  level: number;
  experience: number;
  hitDice: string;
  hpTemp: number;
};

export type LevelChangeResult = {
  level: number;
  experience: number;
  hitDice: string;
  stats: Stats;
  hp: HitPoints;
  ac: number;
  initiative: number;
  proficiencyBonus: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeStat(value: number): number {
  return Math.max(1, Math.round(value));
}

function normalizeStats(stats: Stats): Stats {
  return {
    strength: normalizeStat(stats.strength),
    dexterity: normalizeStat(stats.dexterity),
    constitution: normalizeStat(stats.constitution),
    intelligence: normalizeStat(stats.intelligence),
    wisdom: normalizeStat(stats.wisdom),
    charisma: normalizeStat(stats.charisma),
  };
}

export function buildNextHitDice(currentHitDice: string, currentLevel: number, targetLevel: number): string {
  const parsed = parseDice(String(currentHitDice || ''));
  const safeCurrentLevel = clamp(Math.round(currentLevel || MIN_CHARACTER_LEVEL), MIN_CHARACTER_LEVEL, MAX_CHARACTER_LEVEL);
  const safeTargetLevel = clamp(Math.round(targetLevel || safeCurrentLevel), MIN_CHARACTER_LEVEL, MAX_CHARACTER_LEVEL);
  const delta = safeTargetLevel - safeCurrentLevel;
  const currentCount = parsed.count > 0 ? parsed.count : safeCurrentLevel;
  const sides = parsed.sides > 0 ? parsed.sides : 6;
  const nextCount = clamp(currentCount + delta, 0, safeTargetLevel);
  return `${nextCount}d${sides}`;
}

export function applyLevelChange(
  current: LevelChangeCurrentValues,
  targetLevel: number,
  draft: LevelChangeDraftValues,
): LevelChangeResult {
  const safeTargetLevel = clamp(Math.round(targetLevel || current.level), MIN_CHARACTER_LEVEL, MAX_CHARACTER_LEVEL);
  const safeHpMax = Math.max(1, Math.round(draft.hp.max || 0));
  const safeHpCurrent = clamp(Math.round(draft.hp.current || 0), 0, safeHpMax);

  return {
    level: safeTargetLevel,
    experience: Math.max(0, Math.round(current.experience || 0)),
    hitDice: buildNextHitDice(current.hitDice, current.level, safeTargetLevel),
    stats: normalizeStats(draft.stats),
    hp: {
      max: safeHpMax,
      current: safeHpCurrent,
      temp: Math.max(0, Math.round(current.hpTemp || 0)),
    },
    ac: Math.max(0, Math.round(draft.ac || 0)),
    initiative: Math.max(0, Math.round(draft.initiative || 0)),
    proficiencyBonus: clamp(Math.round(draft.proficiencyBonus || 0), 1, 10),
  };
}
