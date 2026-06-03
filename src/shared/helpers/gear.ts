import { splitGearIntoWeaponsAndItems } from '@/shared/helpers/weapons';
import type { CharacterEntity } from '@/domain/types';
import type { Weapon } from '@/types/Weapon';
import { findWeapon } from '@/shared/const/WeaponsDb';

export const mergeGearIntoCharacter = (character: CharacterEntity, gear: string[]): CharacterEntity => {
  const { weapons: weaponNames, items } = splitGearIntoWeaponsAndItems(gear);
  const weapons: Weapon[] = weaponNames.map((name) => {
    const meta = findWeapon(name);
    return {
      name,
      attackBonus: 0,
      damage: meta?.damage || '1d6',
    };
  });
  return {
    ...character,
    weapons: [...(character.weapons || []), ...weapons],
    inventory: [...(character.inventory || []), ...items],
  };
};
