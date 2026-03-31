import { db, fbAuth, now, hasDoc } from './firebase';
import { ensureConnection } from './connections';
import { findUserByEmail } from './users';
import type { CharacterDto } from '@/domain/types';
import { characterMapper } from '@/domain/mappers';

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
  ownerUid: string;
  owners: string[];
  editors: string[];

  name: string;
  class: string;
  subclass?: string;
  race: string;
  subrace?: string;

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
};

type CharacterSheetPatch = Partial<CharacterSheet>;
type CharacterCloudDto = CharacterDto & { acDetails?: string };

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
  const doc = isRecord(raw) ? raw : {};
  const normalizedDto = characterMapper.entityToDto(characterMapper.cloudDocToEntity(doc));

  return {
    id,
    ownerUid: typeof doc.ownerUid === 'string' ? doc.ownerUid : '',
    owners: toStringArray(doc.owners),
    editors: toStringArray(doc.editors),

    name: normalizedDto.name,
    class: normalizedDto.class,
    subclass: normalizedDto.subclass,
    race: normalizedDto.race,
    subrace: normalizedDto.subrace,

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
    changeHistory: Array.isArray(doc.changeHistory)
      ? (doc.changeHistory as CharacterChangeHistoryEntry[])
      : undefined,
    photoUri: normalizedDto.photoUri,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function dtoToSheet(dto: CharacterCloudDto): CharacterSheet {
  const normalizedDto = characterMapper.entityToDto(characterMapper.dtoToEntity(dto));
  const me = uid();
  return {
    id: normalizedDto.id,
    ownerUid: me,
    owners: [me],
    editors: [],

    name: normalizedDto.name,
    class: normalizedDto.class,
    subclass: normalizedDto.subclass,
    race: normalizedDto.race,
    subrace: normalizedDto.subrace,

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

function mergeBoundedHistory(existing: unknown, additions: CharacterChangeHistoryEntry[], maxItems = 50): CharacterChangeHistoryEntry[] {
  const base = Array.isArray(existing) ? (existing as CharacterChangeHistoryEntry[]) : [];
  const merged = [...base, ...additions]
    .filter((item) => item && typeof item.uid === 'string' && typeof item.tab === 'string')
    .sort((a, b) => (a.atMs || 0) - (b.atMs || 0));

  if (merged.length <= maxItems) return merged;
  return merged.slice(merged.length - maxItems);
}

export async function upsertCharacterSheetFromLocal(
  dto: CharacterCloudDto,
  options?: { historyPaths?: string[]; actorRole?: CharacterActorRole },
) {
  const me = fbAuth.currentUser?.uid;
  if (!me) throw new Error('Not signed in');

  const ref = db.collection('characterSheets').doc(dto.id);

  try {
    let existingMeta: CharacterSheet | null = null;
    try {
      const snap = await ref.get();
      if (hasDoc(snap)) {
        existingMeta = toSheetSnapshotDoc(snap.id, snap.data?.() || snap.data());
      }
    } catch {}

    const payload = buildCloudDocFromLocal(dto, me, existingMeta || undefined);
    const historyPaths = options?.historyPaths || [];
    if (historyPaths.length) {
      const atMs = Date.now();
      const additions = buildHistoryEntries(me, historyPaths, atMs, options?.actorRole);
      payload.changeHistory = mergeBoundedHistory(existingMeta?.changeHistory, additions, 50);
    }

    if (existingMeta) {
      payload.owners = existingMeta.owners || [me];
      payload.editors = existingMeta.editors || [];
    } else {
      payload.owners = [me];
      payload.editors = [];
    }

    await ref.set(payload, { merge: true });

    if (existingMeta) {
      return { id: dto.id, updated: true };
    }

    return { id: dto.id, created: true };
  } catch {
    const newId = await saveCharacterSheetAsNew(dto);
    return { id: newId, created: true };
  }
}

export async function bulkUpsertFromLocal(list: CharacterDto[]) {
  for (const character of list) {
    try {
      await upsertCharacterSheetFromLocal(character);
    } catch {}
  }
}

export function subscribeCharacterSheet(id: string, cb: (doc: CharacterSheet | null) => void) {
  return db.collection('characterSheets').doc(id).onSnapshot((snap) => {
    if (!hasDoc(snap)) return cb(null);
    cb(toSheetSnapshotDoc(snap.id, snap.data?.() || snap.data()));
  });
}

export async function updateCharacterSheet(id: string, patch: CharacterSheetPatch) {
  await db.collection('characterSheets').doc(id).update({ ...patch, updatedAt: now() });
}

export async function deleteCharacterSheet(id: string) {
  await db.collection('characterSheets').doc(id).delete();
}

export async function addEditorByEmail(sheetId: string, email: string) {
  const toUid = await findUserByEmail(email);
  if (!toUid) throw new Error('User not found by email');
  await ensureConnection(toUid);
  const ref = db.collection('characterSheets').doc(sheetId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!hasDoc(snap)) throw new Error('Sheet not found');
    const data = toSheetSnapshotDoc(snap.id, snap.data?.() || snap.data());
    const next = Array.from(new Set([...(data.editors || []), toUid]));
    tx.update(ref, { editors: next, updatedAt: now() });
  });
  return toUid;
}

export async function removeEditor(sheetId: string, editorUid: string) {
  const ref = db.collection('characterSheets').doc(sheetId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!hasDoc(snap)) return;
    const data = toSheetSnapshotDoc(snap.id, snap.data?.() || snap.data());
    const next = (data.editors || []).filter((entry) => entry !== editorUid);
    tx.update(ref, { editors: next, updatedAt: now() });
  });
}

export async function saveCharacterSheetAsNew(dto: CharacterCloudDto) {
  try {
    const ref = db.collection('characterSheets').doc();
    const content = stripUndefinedDeep(dtoToSheet(dto));
    await ref.set(content);
    console.log('LOG  [save] create ok for id', ref.id);
    return ref.id;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('WARN [save] save-as-new failed', message);
    return null;
  }
}

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== undefined)
      .map((entry) => stripUndefinedDeep(entry)) as unknown as T;
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

function buildCloudDocFromLocal(dto: CharacterCloudDto, ownerUid: string, existing?: CharacterSheet) {
  const baseMeta = existing
    ? {
        ownerUid: existing.ownerUid || ownerUid,
        owners: Array.isArray(existing.owners) && existing.owners.length ? existing.owners : [ownerUid],
        editors: Array.isArray(existing.editors) ? existing.editors : [],
        createdAt: existing.createdAt || now(),
      }
    : {
        ownerUid,
        owners: [ownerUid],
        editors: [] as string[],
        createdAt: now(),
      };

  const full: CharacterSheet = {
    ...dtoToSheet(dto),
    ...baseMeta,
    updatedAt: now(),
    ac: dto.ac ?? 10,
    armorClassDetails: dto.armorClassDetails ?? dto.acDetails,
  };

  return stripUndefinedDeep(full);
}

export async function autosaveCharacter(dto: CharacterCloudDto) {
  return upsertCharacterSheetFromLocal(dto);
}
