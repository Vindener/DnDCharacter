import { isWeaponName } from '@/shared/const/WeaponsDb';

export const splitGearIntoWeaponsAndItems = (gear: string[]) => {
  const weapons: string[] = [];
  const items: string[] = [];
  (gear || []).forEach((g) => {
    if (isWeaponName(g)) weapons.push(g);
    else items.push(g);
  });
  return { weapons, items };
};
