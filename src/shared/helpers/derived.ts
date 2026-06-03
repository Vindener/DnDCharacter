
import { Skills } from '@/types/Skills';

export const abilityMod = (score: number): number => Math.floor((score - 10) / 2);

export const skillAbilityMap: Record<keyof Skills, keyof any> = {
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
} as any;

export function computeSkills(stats: any): Skills {
  const skills: any = {};
  (Object.keys(skillAbilityMap) as (keyof Skills)[]).forEach((sk) => {
    const abil = skillAbilityMap[sk] as any;
    skills[sk] = abilityMod(stats?.[abil] ?? 10);
  });
  return skills as Skills;
}

export function computeAC(stats: any, cls: string): number {
  const dex = abilityMod(stats?.dexterity ?? 10);
  const base = 10 + dex;
  const c = (cls || '').toLowerCase();
  if (c === 'barbarian') {
    const con = abilityMod(stats?.constitution ?? 10);
    return Math.max(base, 10 + dex + con);
  }
  if (c === 'monk') {
    const wis = abilityMod(stats?.wisdom ?? 10);
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
  let max = hitDie + conMod; // level 1
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
