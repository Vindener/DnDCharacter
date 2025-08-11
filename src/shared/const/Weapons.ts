
export type WeaponCategory = 'simple' | 'martial';
export type DamageType = 'рубальна' | 'колюча' | 'дробильна';
export interface WeaponData {
  name: string;
  key: string;
  category: WeaponCategory;
  damage: string; // e.g., "1d6"
  versatileDamage?: string; // e.g., "1d10"
  damageType: DamageType;
  properties: string[]; // e.g., ['фехтувальна','легка','метальна','дворучна','перезарядка']
  ranged?: boolean;
  finesse?: boolean;
  thrown?: boolean;
}

export const WEAPONS: Record<string, WeaponData> = {
  'короткий меч': { name: 'Короткий меч', key: 'shortsword', category: 'martial', damage: '1d6', damageType: 'колюча', properties: ['фехтувальна', 'легка'], finesse: true },
  'рапіра': { name: 'Рапіра', key: 'rapier', category: 'martial', damage: '1d8', damageType: 'колюча', properties: ['фехтувальна'], finesse: true },
  'довгий меч': { name: 'Довгий меч', key: 'longsword', category: 'martial', damage: '1d8', versatileDamage: '1d10', damageType: 'рубальна', properties: ['універсальна'] },
  'бойова сокира': { name: 'Бойова сокира', key: 'battleaxe', category: 'martial', damage: '1d8', versatileDamage: '1d10', damageType: 'рубальна', properties: ['універсальна'] },
  'кинджал': { name: 'Кинджал', key: 'dagger', category: 'simple', damage: '1d4', damageType: 'колюча', properties: ['фехтувальна', 'легка', 'метальна'], finesse: true, thrown: true },
  'палиця': { name: 'Палиця', key: 'club', category: 'simple', damage: '1d4', damageType: 'дробильна', properties: ['легка'] },
  'булива': { name: 'Булава', key: 'mace', category: 'simple', damage: '1d6', damageType: 'дробильна', properties: [] },
  'сокира': { name: 'Сокира', key: 'handaxe', category: 'simple', damage: '1d6', damageType: 'рубальна', properties: ['легка', 'метальна'], thrown: true },
  'серп': { name: 'Серп', key: 'sickle', category: 'simple', damage: '1d4', damageType: 'рубальна', properties: ['легка'] },
  'посох': { name: 'Посох', key: 'quarterstaff', category: 'simple', damage: '1d6', versatileDamage: '1d8', damageType: 'дробильна', properties: ['універсальна'] },
  'спис': { name: 'Спис', key: 'spear', category: 'simple', damage: '1d6', versatileDamage: '1d8', damageType: 'колюча', properties: ['метальна', 'універсальна'], thrown: true },
  'легкий арбалет': { name: 'Легкий арбалет', key: 'light-crossbow', category: 'simple', damage: '1d8', damageType: 'колюча', properties: ['боєприпаси', 'перезарядка', 'дворучна'], ranged: true },
  'ручний арбалет': { name: 'Ручний арбалет', key: 'hand-crossbow', category: 'martial', damage: '1d6', damageType: 'колюча', properties: ['боєприпаси', 'перезарядка', 'легка'], ranged: true },
  'довгий лук': { name: 'Довгий лук', key: 'longbow', category: 'martial', damage: '1d8', damageType: 'колюча', properties: ['боєприпаси', 'дворучна'], ranged: true },
  'короткий лук': { name: 'Короткий лук', key: 'shortbow', category: 'simple', damage: '1d6', damageType: 'колюча', properties: ['боєприпаси', 'дворучна'], ranged: true },
};

export function findWeapon(name: string): WeaponData | undefined {
  const key = name.trim().toLowerCase();
  return WEAPONS[key];
}
