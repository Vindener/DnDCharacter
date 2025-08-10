import { splitGearIntoWeaponsAndItems } from '@/shared/helpers/weapons';

export const mergeGearIntoCharacter = (character: any, gear: string[]) => {
  const { weapons, items } = splitGearIntoWeaponsAndItems(gear);
  return {
    ...character,
    weapons: [...(character.weapons || []), ...weapons],
    inventory: [...(character.inventory || []), ...items],
  };
};
