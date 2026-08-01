export type InitiativeCombatantSource = 'player' | 'monster';

export interface InitiativeCombatant {
  id: string;
  name: string;
  source: InitiativeCombatantSource;
  characterId?: string;
  monsterId?: string;
  roll: number;
  initiativeMod: number;
  hpCurrent: number;
  hpMax?: number;
  conditions: string[];
  defeated: boolean;
  order: number;
}

export type InitiativeTrackerSyncStatus = 'Local only' | 'Synced' | 'Pending sync';

export interface InitiativeTracker {
  schemaVersion?: number;
  id: string;
  campaignId: string;
  ownerUid: string;
  round: number;
  activeCombatantId: string | null;
  combatants: InitiativeCombatant[];
  source: 'dm-encounter-prep' | 'manual';
  createdAtMs: number;
  updatedAtMs: number;
  baseUpdatedAtMs: number;
  syncStatus: InitiativeTrackerSyncStatus;
}
