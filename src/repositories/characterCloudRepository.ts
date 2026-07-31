import { db, fbAuth, now, hasDoc, arrayUnion } from '@/services/firebase';
import { ensureConnection } from '@/services/connections';
import { findUserByEmail } from '@/services/users';
import type { CharacterDto } from '@/domain/types';
import { characterMapper } from '@/domain/mappers';
import { LATEST_SCHEMA_VERSION, migratePayloadToLatest } from '@/domain/migrations';
import { mapSyncPathsToFieldPaths } from '@/repositories/syncPathFieldMap';
import { classifySyncError } from '@/shared/helpers/sync/syncErrorClassification';

export type CharacterTabKey = 'Overview' | 'Combat' | 'Magic' | 'Inventory' | 'Notes' | 'Homebrew';
export type CharacterActorRole = 'DM' | 'Player';

export type CharacterChangeHistoryEntry = {
  id: string;
  uid: string;
  actorRole?: CharacterActorRole;
  tab: CharacterTabKey;
  paths: string[];
  summary?: string;
  atMs: number;
};

export type CharacterSheet = {
  id: string;
  schemaVersion?: number;
  ownerUid: string;
  owners: string[];
  editors: string[];

  name: string;
  class: string;
  subclass?: string;
  classId?: CharacterDto['classId'];
  race: string;
  subrace?: string;
  raceId?: CharacterDto['raceId'];
  subraceId?: CharacterDto['subraceId'];
  backgroundId?: CharacterDto['backgroundId'];
  contentSources?: CharacterDto['contentSources'];

  level: number;
  experience: number;

  stats: CharacterDto['stats'];
  hp: CharacterDto['hp'];
  hitDice: CharacterDto['hitDice'];
  ac: number;
  armorClassDetails?: CharacterDto['armorClassDetails'];
  initiative?: number;
  speed?: number;
  proficiencyBonus?: number;
  alignment?: CharacterDto['alignment'];
  currency?: CharacterDto['currency'];

  weapons: CharacterDto['weapons'];
  tools?: CharacterDto['tools'];
  proficiencies: CharacterDto['proficiencies'];
  inventory: CharacterDto['inventory'];
  skills: CharacterDto['skills'];
  savingThrows: CharacterDto['savingThrows'];
  deathSaves: CharacterDto['deathSaves'];
  traits: CharacterDto['traits'];
  featuresAndTraits?: CharacterDto['featuresAndTraits'];
  spells: CharacterDto['spells'];

  notes?: string;
  background?: CharacterDto['background'];
  alliesAndOrganizations?: string;
  backstory?: string;
  campaign?: string;
  campaignId?: string;

  coins?: CharacterDto['coins'];
  customCoins?: CharacterDto['customCoins'];
  sessionMode?: CharacterDto['sessionMode'];
  conditions?: CharacterDto['conditions'];
  characterTemplateId?: CharacterDto['characterTemplateId'];
  customFields?: CharacterDto['customFields'];
  customTrackers?: CharacterDto['customTrackers'];
  customSections?: CharacterDto['customSections'];
  customResources?: CharacterDto['customResources'];
  customNotesGroups?: CharacterDto['customNotesGroups'];
  homebrewEntries?: CharacterDto['homebrewEntries'];
  customResetRules?: CharacterDto['customResetRules'];
  customFeatureBlocks?: CharacterDto['customFeatureBlocks'];
  customSpellLists?: CharacterDto['customSpellLists'];
  notesBlocks?: CharacterDto['notesBlocks'];
  combatTemplates?: CharacterDto['combatTemplates'];
  changeHistory?: CharacterChangeHistoryEntry[];

  photoUri?: string;

  createdAt: unknown;
  updatedAt: unknown;
  lastChangeAt?: unknown;
};

type CharacterSheetPatch = Partial<CharacterSheet>;
export type CharacterCloudDto = CharacterDto & { acDetails?: string };

export interface CharacterCloudRepository {
  upsertFromLocal: (
    dto: CharacterCloudDto,
    options?: { historyPaths?: string[]; actorRole?: CharacterActorRole },
  ) => Promise<{ id: string | null; created?: boolean; updated?: boolean }>;
  fetchById: (id: string) => Promise<CharacterSheet | null>;
  subscribeById: (id: string, cb: (doc: CharacterSheet | null) => void) => () => void;
  subscribeMine: (cb: (list: CharacterSheet[]) => void) => () => void;
  subscribeSharedWithMe: (cb: (list: CharacterSheet[]) => void) => () => void;
  update: (id: string, patch: CharacterSheetPatch) => Promise<void>;
  delete: (id: string) => Promise<void>;
  addEditorByEmail: (sheetId: string, email: string) => Promise<string>;
  removeEditor: (sheetId: string, editorUid: string) => Promise<void>;
  transferOwnership: (sheetId: string, newOwnerUid: string) => Promise<void>;
  getEditorsForSheet: (uids: string[]) => Promise<Array<{ uid: string; email: string }>>;
}

const DEFAULT_STATS: CharacterDto['stats'] = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

const DEFAULT_HP: CharacterDto['hp'] = {
  current: 10,
  max: 10,
  temp: 0,
};

const DEFAULT_SKILLS: CharacterDto['skills'] = {
  acrobatics: 0,
  animalHandling: 0,
  arcana: 0,
  athletics: 0,
  deception: 0,
  history: 0,
  insight: 0,
  intimidation: 0,
  investigation: 0,
  medicine: 0,
  nature: 0,
  perception: 0,
  performance: 0,
  persuasion: 0,
  religion: 0,
  sleightOfHand: 0,
  stealth: 0,
  survival: 0,
};

const DEFAULT_SAVING_THROWS: CharacterDto['savingThrows'] = {
  strength: false,
  dexterity: false,
  constitution: false,
  intelligence: false,
  wisdom: false,
  charisma: false,
};

const DEFAULT_TRAITS: CharacterDto['traits'] = {
  personality: '',
  ideals: '',
  bonds: '',
  flaws: '',
};

const DEFAULT_SPELLS: CharacterDto['spells'] = {
  spellcastingAbility: '',
  spellSaveDC: 0,
  spellAttackBonus: 0,
  spellSlots: {},
  knownSpells: [],
  preparedSpells: [],
  cantrips: [],
};

function uid(): string {
  const user = fbAuth.currentUser;
  if (!user) throw new Error('Not signed in');
  return user.uid;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function toSheetSnapshotDoc(id: string, raw: unknown): CharacterSheet {
  const source = isRecord(raw) ? raw : {};
  const migratedDoc = migratePayloadToLatest<Record<string, unknown>>('character', { id, ...source }).data;
  const doc = isRecord(migratedDoc) ? migratedDoc : { id };
  const normalizedDto = characterMapper.entityToDto(characterMapper.cloudDocToEntity(doc));

  return {
    id,
    schemaVersion: LATEST_SCHEMA_VERSION,
    ownerUid: typeof doc.ownerUid === 'string' ? doc.ownerUid : '',
    owners: toStringArray(doc.owners),
    editors: toStringArray(doc.editors),

    name: normalizedDto.name,
    class: normalizedDto.class,
    subclass: normalizedDto.subclass,
    classId: normalizedDto.classId,
    race: normalizedDto.race,
    subrace: normalizedDto.subrace,
    raceId: normalizedDto.raceId,
    subraceId: normalizedDto.subraceId,
    backgroundId: normalizedDto.backgroundId,
    contentSources: normalizedDto.contentSources,

    level: normalizedDto.level,
    experience: normalizedDto.experience,

    stats: normalizedDto.stats,
    hp: normalizedDto.hp,
    hitDice: normalizedDto.hitDice,
    ac: normalizedDto.ac,
    armorClassDetails: normalizedDto.armorClassDetails,
    initiative: normalizedDto.initiative,
    speed: normalizedDto.speed,
    proficiencyBonus: normalizedDto.proficiencyBonus,
    alignment: normalizedDto.alignment,
    currency: normalizedDto.currency,

    weapons: normalizedDto.weapons,
    tools: normalizedDto.tools,
    proficiencies: normalizedDto.proficiencies,
    inventory: normalizedDto.inventory,
    skills: normalizedDto.skills,
    savingThrows: normalizedDto.savingThrows,
    deathSaves: normalizedDto.deathSaves,
    traits: normalizedDto.traits,
    featuresAndTraits: normalizedDto.featuresAndTraits,
    spells: normalizedDto.spells,

    notes: normalizedDto.notes,
    background: normalizedDto.background,
    alliesAndOrganizations: normalizedDto.alliesAndOrganizations,
    backstory: normalizedDto.backstory,
    campaign: normalizedDto.campaign,
    campaignId: normalizedDto.campaignId,

    coins: normalizedDto.coins,
    customCoins: normalizedDto.customCoins,
    sessionMode: normalizedDto.sessionMode,
    conditions: normalizedDto.conditions,
    characterTemplateId: normalizedDto.characterTemplateId,
    customFields: normalizedDto.customFields,
    customTrackers: normalizedDto.customTrackers,
    customSections: normalizedDto.customSections,
    customResources: normalizedDto.customResources,
    customNotesGroups: normalizedDto.customNotesGroups,
    homebrewEntries: normalizedDto.homebrewEntries,
    customResetRules: normalizedDto.customResetRules,
    customFeatureBlocks: normalizedDto.customFeatureBlocks,
    customSpellLists: normalizedDto.customSpellLists,
    notesBlocks: normalizedDto.notesBlocks,
    combatTemplates: normalizedDto.combatTemplates,
    changeHistory: Array.isArray(doc.changeHistory) ? (doc.changeHistory as CharacterChangeHistoryEntry[]) : undefined,
    photoUri: normalizedDto.photoUri,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastChangeAt: doc.lastChangeAt,
  };
}

function dtoToSheet(dto: CharacterCloudDto): CharacterSheet {
  const normalizedDto = characterMapper.entityToDto(characterMapper.dtoToEntity(dto));
  const me = uid();
  return {
    id: normalizedDto.id,
    schemaVersion: LATEST_SCHEMA_VERSION,
    ownerUid: me,
    owners: [me],
    editors: [],

    name: normalizedDto.name,
    class: normalizedDto.class,
    subclass: normalizedDto.subclass,
    classId: normalizedDto.classId,
    race: normalizedDto.race,
    subrace: normalizedDto.subrace,
    raceId: normalizedDto.raceId,
    subraceId: normalizedDto.subraceId,
    backgroundId: normalizedDto.backgroundId,
    contentSources: normalizedDto.contentSources,

    level: normalizedDto.level,
    experience: normalizedDto.experience,

    stats: normalizedDto.stats || DEFAULT_STATS,
    hp: normalizedDto.hp || DEFAULT_HP,
    hitDice: normalizedDto.hitDice || '1d6',
    ac: normalizedDto.ac || 10,
    armorClassDetails: normalizedDto.armorClassDetails,
    initiative: normalizedDto.initiative,
    speed: normalizedDto.speed,
    proficiencyBonus: normalizedDto.proficiencyBonus,
    alignment: normalizedDto.alignment,
    currency: normalizedDto.currency,

    weapons: normalizedDto.weapons ?? [],
    tools: normalizedDto.tools ?? [],
    proficiencies: normalizedDto.proficiencies ?? [],
    inventory: normalizedDto.inventory ?? [],
    skills: normalizedDto.skills ?? DEFAULT_SKILLS,
    savingThrows: normalizedDto.savingThrows ?? DEFAULT_SAVING_THROWS,
    deathSaves: normalizedDto.deathSaves ?? { successes: 0, failures: 0 },
    traits: normalizedDto.traits ?? DEFAULT_TRAITS,
    featuresAndTraits: normalizedDto.featuresAndTraits ?? [],
    spells: normalizedDto.spells ?? DEFAULT_SPELLS,

    notes: normalizedDto.notes ?? '',
    background: normalizedDto.background,
    alliesAndOrganizations: normalizedDto.alliesAndOrganizations,
    backstory: normalizedDto.backstory,
    campaign: normalizedDto.campaign,
    campaignId: normalizedDto.campaignId,

    coins: normalizedDto.coins ?? { gold: 0, silver: 0, copper: 0 },
    customCoins: normalizedDto.customCoins,
    sessionMode: normalizedDto.sessionMode ?? false,
    conditions: normalizedDto.conditions ?? [],
    characterTemplateId: normalizedDto.characterTemplateId ?? 'standard-5e',
    customFields: normalizedDto.customFields ?? [],
    customTrackers: normalizedDto.customTrackers,
    customSections: normalizedDto.customSections ?? [],
    customResources: normalizedDto.customResources ?? [],
    customNotesGroups: normalizedDto.customNotesGroups ?? [],
    homebrewEntries: normalizedDto.homebrewEntries ?? [],
    customResetRules: normalizedDto.customResetRules ?? [],
    customFeatureBlocks: normalizedDto.customFeatureBlocks ?? [],
    customSpellLists: normalizedDto.customSpellLists ?? [],
    notesBlocks: normalizedDto.notesBlocks,
    combatTemplates: normalizedDto.combatTemplates ?? { actions: [], bonusActions: [], reactions: [] },

    photoUri: normalizedDto.photoUri,

    createdAt: now(),
    updatedAt: now(),
  };
}

function mapPathToTab(path: string): CharacterTabKey {
  if (path.startsWith('overview.')) return 'Overview';
  if (path.startsWith('combat.')) return 'Combat';
  if (path.startsWith('magic.')) return 'Magic';
  if (path.startsWith('inventory.')) return 'Inventory';
  if (path.startsWith('notes.')) return 'Notes';
  if (path.startsWith('homebrew.')) return 'Homebrew';
  return 'Overview';
}

function summarizePaths(paths: string[]): string {
  const clean = paths.map((path) => String(path || '').trim()).filter(Boolean);
  if (!clean.length) return 'No path details';
  if (clean.length <= 2) return clean.join(', ');
  return `${clean.slice(0, 2).join(', ')} +${clean.length - 2}`;
}

function buildHistoryEntries(
  uidValue: string,
  paths: string[],
  atMs: number,
  actorRole?: CharacterActorRole,
): CharacterChangeHistoryEntry[] {
  const byTab = new Map<CharacterTabKey, string[]>();
  for (const path of paths) {
    const trimmed = String(path || '').trim();
    if (!trimmed) continue;
    const tab = mapPathToTab(trimmed);
    const existing = byTab.get(tab) || [];
    if (!existing.includes(trimmed)) existing.push(trimmed);
    byTab.set(tab, existing);
  }

  const out: CharacterChangeHistoryEntry[] = [];
  byTab.forEach((tabPaths, tab) => {
    out.push({
      id: `${uidValue}-${tab}-${atMs}`,
      uid: uidValue,
      actorRole,
      tab,
      paths: tabPaths,
      summary: summarizePaths(tabPaths),
      atMs,
    });
  });

  return out;
}

function getValueAtPath(source: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (!isRecord(acc)) return undefined;
    return acc[segment];
  }, source);
}

/**
 * Content-only payload for an EXISTING document: never carries ownerUid/owners/editors
 * (access changes only happen through addEditorByEmail/removeEditor's own transactions)
 * and never carries createdAt (immutable once set). See COL-1/2/3 fix plan.
 */
function buildContentPayload(dto: CharacterCloudDto): Record<string, unknown> {
  const { ownerUid: _ownerUid, owners: _owners, editors: _editors, createdAt: _createdAt, ...content } = dtoToSheet(dto);

  const full = {
    ...content,
    schemaVersion: LATEST_SCHEMA_VERSION,
    updatedAt: now(),
    ac: dto.ac ?? 10,
    armorClassDetails: dto.armorClassDetails ?? dto.acDetails,
  };

  return stripUndefinedDeep(full) as Record<string, unknown>;
}

export async function upsertCharacterSheetFromLocal(
  dto: CharacterCloudDto,
  options?: { historyPaths?: string[]; actorRole?: CharacterActorRole },
) {
  const me = fbAuth.currentUser?.uid;
  if (!me) throw new Error('Not signed in');

  const ref = db.collection('characterSheets').doc(dto.id);
  const historyPaths = options?.historyPaths || [];
  const additions = historyPaths.length ? buildHistoryEntries(me, historyPaths, Date.now(), options?.actorRole) : [];

  const snap = await ref.get();

  if (!hasDoc(snap)) {
    // New document: dtoToSheet already sets ownerUid/owners/editors/createdAt for `me` —
    // this is the only place those fields are written for a brand-new sheet.
    const payload = stripUndefinedDeep(dtoToSheet(dto)) as Record<string, unknown>;
    if (additions.length) {
      payload.changeHistory = additions;
      payload.lastChangeAt = now();
    }
    await ref.set(payload);
    return { id: dto.id, created: true };
  }

  const fieldMap = mapSyncPathsToFieldPaths(historyPaths);

  if (fieldMap.kind === 'narrow') {
    const contentPayload = buildContentPayload(dto);
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const fieldPath of fieldMap.fieldPaths) {
      const value = getValueAtPath(contentPayload, fieldPath);
      if (value !== undefined) patch[fieldPath] = value;
    }
    if (additions.length) {
      patch.changeHistory = arrayUnion(...additions);
      patch.lastChangeAt = now();
    }
    await ref.update(patch);
    return { id: dto.id, updated: true };
  }

  // Unknown/tab-default path set: fall back to a transactional read-modify-write so the
  // read and write happen atomically instead of racing another client's write (COL-1).
  await db.runTransaction(async (tx) => {
    await tx.get(ref);
    const payload = buildContentPayload(dto);
    if (additions.length) {
      payload.changeHistory = arrayUnion(...additions);
      payload.lastChangeAt = now();
    }
    tx.set(ref, payload, { merge: true });
  });

  return { id: dto.id, updated: true };
}

export type BulkUpsertFailure = { id: string; code: string; message: string };

// COL-7: no longer swallows per-character failures — callers need the list to decide what
// to retry or surface, instead of silently believing every character made it to the cloud.
export async function bulkUpsertFromLocal(list: CharacterDto[]): Promise<BulkUpsertFailure[]> {
  const failures: BulkUpsertFailure[] = [];

  for (const character of list) {
    try {
      await upsertCharacterSheetFromLocal(character);
    } catch (error) {
      const classified = classifySyncError(error);
      failures.push({
        id: character.id,
        code: classified.code || 'unknown',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return failures;
}

export function subscribeCharacterSheet(id: string, cb: (doc: CharacterSheet | null) => void) {
  const cleanId = String(id || '').trim();
  if (!cleanId) {
    cb(null);
    return () => {};
  }

  try {
    return db
      .collection('characterSheets')
      .doc(cleanId)
      .onSnapshot(
        (snap) => {
          if (!hasDoc(snap)) return cb(null);
          cb(toSheetSnapshotDoc(snap.id, snap.data?.() || snap.data()));
        },
        () => cb(null),
      );
  } catch {
    cb(null);
    return () => {};
  }
}

export async function updateCharacterSheet(id: string, patch: CharacterSheetPatch) {
  await db
    .collection('characterSheets')
    .doc(id)
    .update({ ...patch, updatedAt: now() });
}

export async function deleteCharacterSheet(id: string) {
  await db.collection('characterSheets').doc(id).delete();
}

function assertCallerIsOwner(data: CharacterSheet, callerUid: string, action: string): void {
  const isCallerOwner = data.ownerUid === callerUid || (data.owners || []).includes(callerUid);
  if (!isCallerOwner) throw new Error(`Only an owner can ${action}`);
}

/**
 * Access-write operation: reads the sheet inside a transaction, checks the caller is
 * an owner, and writes only ownerUid/owners/editors/updatedAt — never sheet content.
 * See docs/collaborative-editing.md §3.1 and the P2.2 fix plan.
 */
export async function addEditorByEmail(sheetId: string, email: string) {
  const me = uid();
  const toUid = await findUserByEmail(email);
  if (!toUid) throw new Error('User not found by email');

  const ref = db.collection('characterSheets').doc(sheetId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!hasDoc(snap)) throw new Error('Sheet not found');
    const data = toSheetSnapshotDoc(snap.id, snap.data?.() || snap.data());
    assertCallerIsOwner(data, me, 'add an editor');

    const nextEditors = Array.from(new Set([...(data.editors || []), toUid]));
    tx.update(ref, { editors: nextEditors, updatedAt: now() });
  });

  await ensureConnection(toUid);
  return toUid;
}

export async function removeEditor(sheetId: string, editorUid: string) {
  const me = uid();
  const ref = db.collection('characterSheets').doc(sheetId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!hasDoc(snap)) throw new Error('Sheet not found');
    const data = toSheetSnapshotDoc(snap.id, snap.data?.() || snap.data());
    assertCallerIsOwner(data, me, 'remove an editor');

    const nextEditors = (data.editors || []).filter((entry) => entry !== editorUid);
    tx.update(ref, { editors: nextEditors, updatedAt: now() });
  });
}

/**
 * Voluntary ownership hand-off (not to be confused with the account-deletion cascade
 * in functions/src/deleteMyAccount.ts, which has different semantics for a different
 * reason: there the departing user is leaving the sheet entirely). Here the outgoing
 * owner stays on the sheet as a plain editor; `newOwnerUid` must already be an editor
 * or co-owner (promotion only, not an arbitrary uid).
 */
export async function transferOwnership(sheetId: string, newOwnerUid: string): Promise<void> {
  const me = uid();
  const ref = db.collection('characterSheets').doc(sheetId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!hasDoc(snap)) throw new Error('Sheet not found');
    const data = toSheetSnapshotDoc(snap.id, snap.data?.() || snap.data());
    assertCallerIsOwner(data, me, 'transfer ownership');

    if (newOwnerUid === me) return;

    const owners = data.owners || [];
    const editors = data.editors || [];
    const isEligible = owners.includes(newOwnerUid) || editors.includes(newOwnerUid);
    if (!isEligible) throw new Error('New owner must already be an editor or co-owner of this sheet');

    const nextOwners = Array.from(new Set([...owners.filter((entry) => entry !== me), newOwnerUid]));
    const nextEditors = Array.from(new Set([...editors.filter((entry) => entry !== newOwnerUid), me]));

    tx.update(ref, {
      ownerUid: newOwnerUid,
      owners: nextOwners,
      editors: nextEditors,
      updatedAt: now(),
    });
  });
}

export async function saveCharacterSheetAsNew(dto: CharacterCloudDto) {
  try {
    const ref = db.collection('characterSheets').doc();
    const content = stripUndefinedDeep(dtoToSheet(dto));
    await ref.set(content);
    if (__DEV__) console.log('LOG  [save] create ok for id', ref.id);
    return ref.id;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (__DEV__) console.warn('WARN [save] save-as-new failed', message);
    return null;
  }
}

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter((entry) => entry !== undefined).map((entry) => stripUndefinedDeep(entry)) as unknown as T;
  }

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested === undefined) continue;
      out[key] = stripUndefinedDeep(nested);
    }
    return out as T;
  }

  return value;
}

export function subscribeMySheets(cb: (list: CharacterSheet[]) => void) {
  try {
    const me = uid();
    return db
      .collection('characterSheets')
      .where('owners', 'array-contains', me)
      .onSnapshot(
        (snap) => {
          const out: CharacterSheet[] = [];
          snap?.forEach?.((doc) => {
            out.push(toSheetSnapshotDoc(doc.id, doc.data?.() || doc.data()));
          });
          cb(out);
        },
        () => cb([]),
      );
  } catch {
    cb([]);
    return () => {};
  }
}

export function subscribeSharedWithMe(cb: (list: CharacterSheet[]) => void) {
  try {
    const me = uid();
    return db
      .collection('characterSheets')
      .where('editors', 'array-contains', me)
      .onSnapshot(
        (snap) => {
          const out: CharacterSheet[] = [];
          snap?.forEach?.((doc) => {
            out.push(toSheetSnapshotDoc(doc.id, doc.data?.() || doc.data()));
          });
          cb(out);
        },
        () => cb([]),
      );
  } catch {
    cb([]);
    return () => {};
  }
}

export async function fetchCharacterSheet(id: string): Promise<CharacterSheet | null> {
  try {
    const ref = db.collection('characterSheets').doc(id);
    const snap = await ref.get();
    if (!hasDoc(snap)) return null;
    return toSheetSnapshotDoc(snap.id, snap.data?.() || snap.data());
  } catch {
    return null;
  }
}

export async function autosaveCharacter(dto: CharacterCloudDto) {
  return upsertCharacterSheetFromLocal(dto);
}

function splitChunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

export async function getEditorsForSheet(uids: string[]): Promise<Array<{ uid: string; email: string }>> {
  const cleanUids = Array.from(new Set((uids || []).map((item) => String(item || '').trim()).filter(Boolean)));
  if (!cleanUids.length) return [];

  try {
    const chunks = splitChunks(cleanUids, 10);
    const usersByUid = new Map<string, { uid: string; email: string }>();

    for (const chunk of chunks) {
      const snapshot = await db.collection('users').where('uid', 'in', chunk).limit(10).get();
      snapshot.docs.forEach((doc) => {
        const data = doc.data?.() || doc.data();
        const uidValue = String(data?.uid || '');
        if (!uidValue) return;
        usersByUid.set(uidValue, {
          uid: uidValue,
          email: String(data?.email || data?.emailLower || uidValue),
        });
      });
    }

    return cleanUids.map((uidValue) => usersByUid.get(uidValue) || { uid: uidValue, email: uidValue });
  } catch {
    return cleanUids.map((uidValue) => ({ uid: uidValue, email: uidValue }));
  }
}

export async function upsertFromLocal(dto: CharacterCloudDto, options?: { historyPaths?: string[]; actorRole?: CharacterActorRole }) {
  return upsertCharacterSheetFromLocal(dto, options);
}

export async function fetchById(id: string) {
  return fetchCharacterSheet(id);
}

export function subscribeById(id: string, cb: (doc: CharacterSheet | null) => void) {
  return subscribeCharacterSheet(id, cb);
}

export function subscribeMine(cb: (list: CharacterSheet[]) => void) {
  return subscribeMySheets(cb);
}

export function subscribeShared(cb: (list: CharacterSheet[]) => void) {
  return subscribeSharedWithMe(cb);
}

export async function updateById(id: string, patch: CharacterSheetPatch) {
  return updateCharacterSheet(id, patch);
}

export async function deleteById(id: string) {
  return deleteCharacterSheet(id);
}

export const characterCloudRepository: CharacterCloudRepository = {
  upsertFromLocal,
  fetchById,
  subscribeById,
  subscribeMine,
  subscribeSharedWithMe: subscribeShared,
  update: updateById,
  delete: deleteById,
  addEditorByEmail,
  removeEditor,
  transferOwnership,
  getEditorsForSheet,
};
