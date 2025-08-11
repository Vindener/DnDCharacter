
import { CharacterDto } from '@/types/Character';
import { findWeapon, WeaponData } from '@/shared/const/Weapons';
import { CLASS_PRESETS } from '@/shared/const/ClassPresets';

export function abilityMod(score: number) {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number) {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9)  return 4;
  if (level >= 5)  return 3;
  return 2;
}

function isProficientWithWeapon(charClass: string, weapon: WeaponData): boolean {
  const preset = CLASS_PRESETS[charClass];
  if (!preset) return false;
  const profs = preset.proficiencies.map((s) => s.toLowerCase());
  if (weapon.category === 'simple' && profs.includes('проста зброя')) return true;
  if (weapon.category === 'martial' && profs.includes('військова зброя')) return true;
  // direct weapon name match
  if (profs.includes(weapon.name.toLowerCase())) return true;
  return false;
}

export function computeAttackBonus(character: CharacterDto, weaponName: string) {
  const w = findWeapon(weaponName);
  const level = (character as any).level || 1;
  const stats = (character as any).stats || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };

  let ability = 'strength';
  if (w?.ranged) ability = 'dexterity';
  if (w?.finesse) {
    // choose better of STR/DEX
    ability = abilityMod(stats.dexterity) >= abilityMod(stats.strength) ? 'dexterity' : 'strength';
  }
  const mod = abilityMod(stats[ability as keyof typeof stats] || 10);
  const prof = w && isProficientWithWeapon((character as any).class, w) ? proficiencyBonus(level) : 0;
  return { bonus: mod + prof, usedAbility: ability as 'strength' | 'dexterity' };
}

export function defaultDamageString(weaponName: string) {
  const w = findWeapon(weaponName);
  if (!w) return '1d6';
  return w.damage; // use one-handed by default if versatile
}

export function damageAbilityMod(weaponName: string, usedAbility: 'strength' | 'dexterity', character: CharacterDto) {
  // In 5e, damage adds the same ability mod as the attack (for most weapons, except off-hand etc.)
  const stats = (character as any).stats || { strength: 10, dexterity: 10 };
  return abilityMod(stats[usedAbility]);
}
