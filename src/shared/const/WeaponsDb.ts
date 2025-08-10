export interface WeaponMeta {
  name: string;
  damage: string; // e.g. "1d8"
  damageType: string; // рубаюча, колюча, дробильна
  properties?: string[]; // фехтувальна, дворучна, легка, метальна, універсальна...
  aliases?: string[];
}

const normalize = (s?: string) => (s || '').toLowerCase().trim();

export const WEAPONS_DB: WeaponMeta[] = [
  { name: 'Короткий меч', damage: '1d6', damageType: 'колюча', properties: ['легка','фехтувальна'], aliases: ['shortsword'] },
  { name: 'Довгий меч', damage: '1d8', damageType: 'рублюча', properties: ['універсальна 1d10'], aliases: ['longsword'] },
  { name: 'Рапіра', damage: '1d8', damageType: 'колюча', properties: ['фехтувальна'], aliases: ['rapier'] },
  { name: 'Велика сокира', damage: '1d12', damageType: 'рублюча', properties: ['двуручна'], aliases: ['greataxe'] },
  { name: 'Спис', damage: '1d6', damageType: 'колюча', properties: ['метальна','універсальна 1d8'], aliases: ['spear'] },
  { name: 'Короткий лук', damage: '1d6', damageType: 'колюча', properties: ['дальня','двуручна'], aliases: ['shortbow'] },
];

export const findWeapon = (name?: string): WeaponMeta | undefined => {
  const n = normalize(name);
  if (!n) return undefined;
  return WEAPONS_DB.find(w => normalize(w.name) === n || (w.aliases || []).some(a => normalize(a) === n));
};

export const isWeaponName = (name?: string): boolean => !!findWeapon(name);