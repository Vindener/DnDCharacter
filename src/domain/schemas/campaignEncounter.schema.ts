import { z } from 'zod';
import type {
  DMCampaignEncounter,
  DMCampaignEncounterConflictRemote,
  DMCampaignEncounterQueueItem,
  DMNoteSyncDisplayStatus,
  EncounterDifficultyResult,
  EncounterPrepMonster,
  EncounterPrepPlayer,
} from '@/domain/types';
import { asRecord, safeParseWithIssues, toBoolean, toNumber, toString, toStringArray, toTrimmedString } from './utils';
import { migratePayloadToLatest } from '@/domain/migrations';
import { NOTE_SYNC_STATUS } from './campaignNote.schema';

const MAX_LABEL_LENGTH = 200;
const MAX_LIST_ITEMS = 30;

const ENCOUNTER_STATUSES: DMCampaignEncounter['status'][] = ['planned', 'run', 'archived'];

function selectSyncStatus(value: unknown): DMNoteSyncDisplayStatus {
  const raw = toTrimmedString(value);
  if (NOTE_SYNC_STATUS.includes(raw as DMNoteSyncDisplayStatus)) return raw as DMNoteSyncDisplayStatus;
  return 'Local only';
}

function selectStatus(value: unknown): DMCampaignEncounter['status'] {
  const raw = toTrimmedString(value);
  if ((ENCOUNTER_STATUSES as string[]).includes(raw)) return raw as DMCampaignEncounter['status'];
  return 'planned';
}

function parsePlayer(raw: unknown): EncounterPrepPlayer | null {
  const cast = asRecord(raw);
  const id = toTrimmedString(cast.id);
  const characterId = toTrimmedString(cast.characterId);
  if (!id || !characterId) return null;
  return {
    id,
    characterId,
    name: toString(cast.name, ''),
    level: toNumber(cast.level, 1),
    initiativeMod: toNumber(cast.initiativeMod, 0),
    selected: toBoolean(cast.selected, true),
  };
}

function parseMonster(raw: unknown): EncounterPrepMonster | null {
  const cast = asRecord(raw);
  const id = toTrimmedString(cast.id);
  const name = toString(cast.name, '').trim();
  if (!id || !name) return null;
  return {
    id,
    monsterId: toTrimmedString(cast.monsterId) || undefined,
    name,
    challenge: toString(cast.challenge, '0'),
    count: Math.max(1, toNumber(cast.count, 1)),
    hitPoints: cast.hitPoints === undefined || cast.hitPoints === null ? undefined : toNumber(cast.hitPoints, 0),
    selected: toBoolean(cast.selected, true),
  };
}

function clampList<T>(value: unknown, parser: (raw: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    const parsed = parser(item);
    if (!parsed) continue;
    out.push(parsed);
    if (out.length >= MAX_LIST_ITEMS) break;
  }
  return out;
}

function parseDifficulty(raw: unknown): EncounterDifficultyResult | null {
  const cast = asRecord(raw);
  if (typeof cast.adjustedXP !== 'number' && typeof cast.xpPerPlayer !== 'number') return null;
  const thresholdsCast = asRecord(cast.thresholds);
  return {
    thresholds: {
      easy: toNumber(thresholdsCast.easy, 0),
      medium: toNumber(thresholdsCast.medium, 0),
      hard: toNumber(thresholdsCast.hard, 0),
      deadly: toNumber(thresholdsCast.deadly, 0),
      partySize: toNumber(thresholdsCast.partySize, 0),
    },
    baseXP: toNumber(cast.baseXP, 0),
    adjustedXP: toNumber(cast.adjustedXP, 0),
    xpPerPlayer: toNumber(cast.xpPerPlayer, 0),
    difficulty: (toTrimmedString(cast.difficulty) || 'Немає даних') as EncounterDifficultyResult['difficulty'],
    monstersCount: toNumber(cast.monstersCount, 0),
    multiplier: toNumber(cast.multiplier, 1),
  };
}

function parseConflictRemote(raw: unknown): DMCampaignEncounterConflictRemote | undefined {
  const cast = asRecord(raw);
  const label = toString(cast.label, '');
  if (!label && !Array.isArray(cast.players) && !Array.isArray(cast.monsters)) return undefined;
  return {
    label,
    players: clampList(cast.players, parsePlayer),
    monsters: clampList(cast.monsters, parseMonster),
    updatedAtMs: toNumber(cast.updatedAtMs, Date.now()),
  };
}

function normalizeCampaignEncounterPayload(raw: unknown): DMCampaignEncounter {
  const migrated = migratePayloadToLatest<Record<string, unknown>>('dmCampaignEncounters', raw).data;
  const cast = asRecord(migrated);
  const now = Date.now();
  const owners = toStringArray(cast.owners, { dedupe: true });
  const me = toTrimmedString(cast.ownerUid) || owners[0] || 'local';

  return {
    schemaVersion: Number.isFinite(Number(cast.schemaVersion)) ? Math.max(1, Math.floor(Number(cast.schemaVersion))) : undefined,
    id: toTrimmedString(cast.id) || `encounter-${now}`,
    campaignId: toTrimmedString(cast.campaignId),
    label: toString(cast.label, '').trim().slice(0, MAX_LABEL_LENGTH),
    players: clampList(cast.players, parsePlayer),
    monsters: clampList(cast.monsters, parseMonster),
    difficulty: parseDifficulty(cast.difficulty),
    status: selectStatus(cast.status),
    ownerUid: me,
    owners: owners.length ? owners : [me],
    editors: toStringArray(cast.editors, { dedupe: true }),
    createdAtMs: toNumber(cast.createdAtMs, now),
    updatedAtMs: toNumber(cast.updatedAtMs, now),
    baseUpdatedAtMs: toNumber(cast.baseUpdatedAtMs, toNumber(cast.updatedAtMs, now)),
    syncStatus: selectSyncStatus(cast.syncStatus),
    conflictRemote: parseConflictRemote(cast.conflictRemote),
  };
}

function parseQueueItem(raw: unknown): DMCampaignEncounterQueueItem | null {
  const cast = asRecord(raw);
  const type = toTrimmedString(cast.type);
  if (type !== 'upsert' && type !== 'delete') return null;

  const encounterId = toTrimmedString(cast.encounterId);
  const campaignId = toTrimmedString(cast.campaignId);
  if (!encounterId || !campaignId) return null;

  return {
    id: toTrimmedString(cast.id) || `${type}-${encounterId}-${Date.now()}`,
    type,
    encounterId,
    campaignId,
    atMs: toNumber(cast.atMs, Date.now()),
  };
}

export const campaignEncounterConflictRemoteSchema: z.ZodType<DMCampaignEncounterConflictRemote | undefined> = z
  .any()
  .transform((value) => parseConflictRemote(value));

export const campaignEncounterSchema: z.ZodType<DMCampaignEncounter> = z
  .any()
  .transform((value) => normalizeCampaignEncounterPayload(value));

export const campaignEncounterQueueItemSchema: z.ZodType<DMCampaignEncounterQueueItem | null> = z
  .any()
  .transform((value) => parseQueueItem(value));

export function parseCampaignEncounterConflictRemote(value: unknown): DMCampaignEncounterConflictRemote | undefined {
  return campaignEncounterConflictRemoteSchema.parse(value);
}

export function parseCampaignEncounter(value: unknown): DMCampaignEncounter {
  return campaignEncounterSchema.parse(value);
}

export function parseCampaignEncounterQueueItem(value: unknown): DMCampaignEncounterQueueItem | null {
  return campaignEncounterQueueItemSchema.parse(value);
}

export function safeParseCampaignEncounter(value: unknown) {
  return safeParseWithIssues(campaignEncounterSchema, value);
}
