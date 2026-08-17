import type { CharacterViewModel } from '@/domain/types';
import { findWeapon, WeaponData } from '@/shared/const/Weapons';
import { CLASS_PRESETS } from '@/shared/const/ClassPresets';

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

function isProficientWithWeapon(charClass: string, weapon: WeaponData): boolean {
  const preset = CLASS_PRESETS[charClass];
  if (!preset) return false;
  const profs = preset.proficiencies.map((entry) => entry.toLowerCase());
  if (weapon.category === 'simple' && profs.includes('проста зброя')) return true;
  if (weapon.category === 'martial' && profs.includes('військова зброя')) return true;
  if (profs.includes(weapon.name.toLowerCase())) return true;
  return false;
}

export function computeAttackBonus(character: CharacterViewModel, weaponName: string) {
  const weapon = findWeapon(weaponName);
  const level = character.level || 1;
  const stats = {
    strength: character.stats?.strength ?? 10,
    dexterity: character.stats?.dexterity ?? 10,
  };

  let ability: 'strength' | 'dexterity' = 'strength';
  if (weapon?.ranged) ability = 'dexterity';
  if (weapon?.finesse) {
    ability = abilityMod(stats.dexterity) >= abilityMod(stats.strength) ? 'dexterity' : 'strength';
  }

  const mod = abilityMod(stats[ability]);
  const prof = weapon && isProficientWithWeapon(character.class, weapon) ? proficiencyBonus(level) : 0;
  return { bonus: mod + prof, usedAbility: ability };
}

export function defaultDamageString(weaponName: string): string {
  const weapon = findWeapon(weaponName);
  if (!weapon) return '1d6';
  return weapon.damage;
}

export function damageAbilityMod(weaponName: string, usedAbility: 'strength' | 'dexterity', character: CharacterViewModel): number {
  void weaponName;
  return abilityMod(character.stats?.[usedAbility] ?? 10);
}
