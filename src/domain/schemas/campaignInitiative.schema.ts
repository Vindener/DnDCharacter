import { z } from 'zod';
import type { InitiativeCombatant, InitiativeCombatantSource, InitiativeTracker, InitiativeTrackerSyncStatus } from '@/domain/types';
import { asRecord, safeParseWithIssues, toBoolean, toNumber, toString, toStringArray, toTrimmedString } from './utils';
import { migratePayloadToLatest } from '@/domain/migrations';

const MAX_NAME_LENGTH = 200;
const MAX_COMBATANTS = 40;
const MAX_CONDITIONS = 10;

const COMBATANT_SOURCES: InitiativeCombatantSource[] = ['player', 'monster'];
const SYNC_STATUSES: InitiativeTrackerSyncStatus[] = ['Local only', 'Synced', 'Pending sync'];

function selectSource(value: unknown): InitiativeCombatantSource {
  const raw = toTrimmedString(value);
  if ((COMBATANT_SOURCES as string[]).includes(raw)) return raw as InitiativeCombatantSource;
  return 'monster';
}

function selectSyncStatus(value: unknown): InitiativeTrackerSyncStatus {
  const raw = toTrimmedString(value);
  if ((SYNC_STATUSES as string[]).includes(raw)) return raw as InitiativeTrackerSyncStatus;
  return 'Local only';
}

function parseCombatant(raw: unknown): InitiativeCombatant | null {
  const cast = asRecord(raw);
  const id = toTrimmedString(cast.id);
  const name = toString(cast.name, '').trim();
  if (!id || !name) return null;

  return {
    id,
    name: name.slice(0, MAX_NAME_LENGTH),
    source: selectSource(cast.source),
    characterId: toTrimmedString(cast.characterId) || undefined,
    monsterId: toTrimmedString(cast.monsterId) || undefined,
    roll: toNumber(cast.roll, 0),
    initiativeMod: toNumber(cast.initiativeMod, 0),
    hpCurrent: toNumber(cast.hpCurrent, 0),
    hpMax: cast.hpMax === undefined || cast.hpMax === null ? undefined : toNumber(cast.hpMax, 0),
    conditions: toStringArray(cast.conditions).slice(0, MAX_CONDITIONS),
    defeated: toBoolean(cast.defeated, false),
    order: toNumber(cast.order, 0),
  };
}

function clampCombatants(value: unknown): InitiativeCombatant[] {
  if (!Array.isArray(value)) return [];
  const out: InitiativeCombatant[] = [];
  for (const item of value) {
    const parsed = parseCombatant(item);
    if (!parsed) continue;
    out.push(parsed);
    if (out.length >= MAX_COMBATANTS) break;
  }
  return out;
}

function normalizeCampaignInitiativePayload(raw: unknown): InitiativeTracker {
  const migrated = migratePayloadToLatest<Record<string, unknown>>('dmCampaignInitiative', raw).data;
  const cast = asRecord(migrated);
  const now = Date.now();
  const campaignId = toTrimmedString(cast.campaignId);

  return {
    schemaVersion: Number.isFinite(Number(cast.schemaVersion)) ? Math.max(1, Math.floor(Number(cast.schemaVersion))) : undefined,
    id: toTrimmedString(cast.id) || campaignId,
    campaignId,
    ownerUid: toTrimmedString(cast.ownerUid),
    round: Math.max(1, toNumber(cast.round, 1)),
    activeCombatantId: toTrimmedString(cast.activeCombatantId) || null,
    combatants: clampCombatants(cast.combatants),
    source: toTrimmedString(cast.source) === 'manual' ? 'manual' : 'dm-encounter-prep',
    createdAtMs: toNumber(cast.createdAtMs, now),
    updatedAtMs: toNumber(cast.updatedAtMs, now),
    baseUpdatedAtMs: toNumber(cast.baseUpdatedAtMs, toNumber(cast.updatedAtMs, now)),
    syncStatus: selectSyncStatus(cast.syncStatus),
  };
}

export const campaignInitiativeSchema: z.ZodType<InitiativeTracker> = z
  .any()
  .transform((value) => normalizeCampaignInitiativePayload(value));

export function parseCampaignInitiative(value: unknown): InitiativeTracker {
  return campaignInitiativeSchema.parse(value);
}

export function safeParseCampaignInitiative(value: unknown) {
  return safeParseWithIssues(campaignInitiativeSchema, value);
}
