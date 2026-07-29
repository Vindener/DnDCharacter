import { getClassProgression, getSrdBackgroundById, getSrdClassById, getSrdClasses, getSrdRaceById, getSrdRaces } from './srdRepository';
import type { SrdAbilityId, SrdClassFeature, SrdFeatureBase, SrdRace, SrdSubrace } from './types';

export function getSrdSubraces(raceId: string): SrdSubrace[] {
  return getSrdRaceById(raceId)?.subraces ?? [];
}

export function getSrdSubraceById(raceId: string, subraceId: string): SrdSubrace | undefined {
  return getSrdSubraces(raceId).find((item) => item.id === subraceId);
}

export function getSrdRaceSpeed(raceId: string): number | undefined {
  return getSrdRaceById(raceId)?.speed;
}

export function getSrdRaceAbilityIncreases(raceId: string, subraceId?: string): Partial<Record<SrdAbilityId, number>> {
  const race = getSrdRaceById(raceId);
  const subrace = subraceId ? getSrdSubraceById(raceId, subraceId) : undefined;
  return {
    ...(race?.abilityScoreIncreases ?? {}),
    ...(subrace?.abilityScoreIncreases ?? {}),
  };
}

export function getSrdRaceFlexibleIncrease(raceId: string, subraceId?: string) {
  const race = getSrdRaceById(raceId);
  const subrace = subraceId ? getSrdSubraceById(raceId, subraceId) : undefined;
  return subrace?.flexibleAbilityScoreIncrease ?? race?.flexibleAbilityScoreIncrease;
}

export function getSrdRaceTraits(raceId?: string, subraceId?: string): SrdFeatureBase[] {
  if (!raceId) return [];
  const race = getSrdRaceById(raceId);
  const subrace = subraceId ? getSrdSubraceById(raceId, subraceId) : undefined;
  return [...(race?.traits ?? []), ...(subrace?.traits ?? [])];
}

export function getSrdRaceLanguages(raceId?: string, subraceId?: string): string[] {
  if (!raceId) return [];
  const race = getSrdRaceById(raceId);
  const subrace = subraceId ? getSrdSubraceById(raceId, subraceId) : undefined;
  return [...(race?.languages ?? []), ...(subrace?.languages ?? [])];
}

export function getSrdClassFeaturesAtLevel(classId: string | undefined, level: number): SrdClassFeature[] {
  if (!classId) return [];
  const srdClass = getSrdClassById(classId);
  if (!srdClass) return [];
  return srdClass.features.filter((feature) => feature.level <= level);
}

export function getSrdProgressionFeatureNames(classId: string | undefined, level: number): string[] {
  if (!classId) return [];
  const names: string[] = [];
  for (let current = 1; current <= level; current += 1) {
    names.push(...(getClassProgression(classId, current)?.features ?? []));
  }
  return Array.from(new Set(names.filter(Boolean)));
}

export function getSrdClassDisplayName(classId?: string): string | undefined {
  return classId ? getSrdClassById(classId)?.name : undefined;
}

export function getSrdRaceDisplayName(raceId?: string): string | undefined {
  return raceId ? getSrdRaceById(raceId)?.name : undefined;
}

export function getSrdSubraceDisplayName(raceId?: string, subraceId?: string): string | undefined {
  return raceId && subraceId ? getSrdSubraceById(raceId, subraceId)?.name : undefined;
}

export function getSrdBackgroundDisplayName(backgroundId?: string): string | undefined {
  return backgroundId ? getSrdBackgroundById(backgroundId)?.name : undefined;
}

export function isSrdRaceId(value: string | undefined): value is string {
  return Boolean(value && getSrdRaceById(value));
}

export function isSrdClassId(value: string | undefined): value is string {
  return Boolean(value && getSrdClassById(value));
}

export function isSrdBackgroundId(value: string | undefined): value is string {
  return Boolean(value && getSrdBackgroundById(value));
}

export function findSrdRaceByName(value: string | undefined): SrdRace | undefined {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (!normalized) return undefined;
  return getSrdRaces().find((race) => race.id === normalized || race.name.toLowerCase() === normalized);
}

export function findSrdClassByName(value: string | undefined) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (!normalized) return undefined;
  return getSrdClasses().find((srdClass) => srdClass.id === normalized || srdClass.name.toLowerCase() === normalized);
}
