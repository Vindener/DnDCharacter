export type SpellbookTabParam = 'all' | 'prepared' | 'known' | 'favorites' | 'custom';

export type SpellbookRouteParams = {
  characterId?: string;
  initialTab?: SpellbookTabParam;
  mode?: 'player' | 'dm';
  initialSpellId?: string;
  quickView?: boolean;
} | undefined;
