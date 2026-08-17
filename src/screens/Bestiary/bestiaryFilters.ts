import type { MonsterDto } from '@/types/Monster';
import { getLocalizedMonsterSearchText } from '@/domain/srd/localization';

export type CRFilter = 'all' | '0-1' | '2-4' | '5-10' | '11+';

export interface BestiaryFilters {
  search: string;
  cr: CRFilter;
  type: string;
  environment: string;
  size: string;
  source: string;
  favoritesOnly: boolean;
}

export const DEFAULT_BESTIARY_FILTERS: BestiaryFilters = {
  search: '',
  cr: 'all',
  type: 'all',
  environment: 'all',
  size: 'all',
  source: 'all',
  favoritesOnly: false,
};

export const parseChallengeToNumber = (challenge?: string): number => {
  if (!challenge) return 0;
  const normalized = challenge.trim().split(' ')[0];
  if (normalized.includes('/')) {
    const [a, b] = normalized.split('/');
    const numerator = Number(a);
    const denominator = Number(b);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) return numerator / denominator;
    return 0;
  }
  const direct = Number(normalized.replace(',', '.'));
  return Number.isFinite(direct) ? direct : 0;
};

export const passCRFilter = (monster: MonsterDto, filter: CRFilter): boolean => {
  if (filter === 'all') return true;
  const cr = parseChallengeToNumber(monster.challenge);
  if (filter === '0-1') return cr <= 1;
  if (filter === '2-4') return cr >= 2 && cr <= 4;
  if (filter === '5-10') return cr >= 5 && cr <= 10;
  return cr >= 11;
};

export const collectUnique = (list: string[]): string[] =>
  Array.from(new Set(list.map((item) => item.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'uk'));

export const getMonsterSearchText = (monster: MonsterDto): string =>
  [
    monster.name,
    monster.size,
    monster.type,
    monster.alignment,
    monster.challenge,
    monster.environment,
    monster.source,
    monster.tags?.join(' '),
    monster.speed,
    monster.savingThrows,
    monster.skills,
    monster.senses,
    monster.languages,
    monster.traits,
    monster.actions,
    monster.reactions,
    monster.legendaryActions,
    monster.mainAttack,
    monster.attackBonus,
    monster.damage,
    monster.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export const filterMonsters = (
  monsters: MonsterDto[],
  filters: BestiaryFilters,
  favoriteMonsterIds: string[],
  language = 'en',
): MonsterDto[] => {
  const searchText = filters.search.trim().toLowerCase();
  const favoriteSet = new Set(favoriteMonsterIds);

  return monsters.filter((monster) => {
    if (filters.favoritesOnly && !favoriteSet.has(monster.id)) return false;
    const searchableText = `${getMonsterSearchText(monster)} ${getLocalizedMonsterSearchText(monster, language)}`.toLowerCase();
    if (searchText && !searchableText.includes(searchText)) return false;
    if (!passCRFilter(monster, filters.cr)) return false;
    if (filters.type !== 'all' && (monster.type || '').toLowerCase() !== filters.type.toLowerCase()) return false;
    if (filters.environment !== 'all' && (monster.environment || '').toLowerCase() !== filters.environment.toLowerCase()) return false;
    if (filters.size !== 'all' && (monster.size || '').toLowerCase() !== filters.size.toLowerCase()) return false;
    if (filters.source !== 'all' && (monster.source || '').toLowerCase() !== filters.source.toLowerCase()) return false;
    return true;
  });
};

export const getActiveBestiaryFilterCount = (filters: BestiaryFilters): number =>
  Number(Boolean(filters.search.trim())) +
  Number(filters.cr !== 'all') +
  Number(filters.type !== 'all') +
  Number(filters.environment !== 'all') +
  Number(filters.size !== 'all') +
  Number(filters.source !== 'all') +
  Number(filters.favoritesOnly);
