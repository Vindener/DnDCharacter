export interface DifficultyThreshold {
  easy: number;
  medium: number;
  hard: number;
  deadly: number;
}

export interface EncounterPrepPlayer {
  id: string;
  characterId: string;
  name: string;
  level: number;
  initiativeMod: number;
  selected: boolean;
}

export interface EncounterPrepMonster {
  id: string;
  monsterId?: string;
  name: string;
  challenge: string;
  count: number;
  hitPoints?: number;
  selected: boolean;
}

export interface EncounterPrepMonsterSeed {
  monsterId?: string;
  name: string;
  challenge?: string;
  count?: number;
  hitPoints?: number;
}

export interface EncounterPrepDraft {
  campaignId: string;
  players: EncounterPrepPlayer[];
  monsters: EncounterPrepMonster[];
}

export interface InitiativeSeedItem {
  id: string;
  name: string;
  roll: string;
  hits?: string;
}

export interface InitiativeSeed {
  source: 'dm-encounter-prep';
  campaignId: string;
  entries: InitiativeSeedItem[];
}

export interface EncounterDifficultyResult {
  thresholds: DifficultyThreshold & { partySize: number };
  baseXP: number;
  adjustedXP: number;
  xpPerPlayer: number;
  difficulty: 'Немає даних' | 'Дуже легко' | 'Легко' | 'Середньо' | 'Складно' | 'Смертельно';
  monstersCount: number;
  multiplier: number;
}

export interface EncounterMonsterInput {
  challenge: string;
  count: number;
}

export interface EncounterPlayerInput {
  level: number;
}

export interface TrackerTemplateResource {
  label: string;
  current: number;
  max?: number;
  resetRule: 'none' | 'short-rest' | 'long-rest' | 'session';
  visibility?: 'player' | 'dm' | 'both';
  color?: string;
}

export type ResourceTemplate = {
  id: string;
  name: string;
  resource: TrackerTemplateResource;
  source: 'system' | 'user';
};
