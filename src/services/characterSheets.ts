
import { db, fbAuth, now, hasDoc } from './firebase';
import { ensureConnection } from './connections';
import { findUserByEmail } from './users';
import type { CharacterDto } from '@/types/Character';

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

function uid() {
  const u = fbAuth.currentUser;
  if (!u) throw new Error('Not signed in');
  return u.uid;
}

export type CharacterSheet = {
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
  ac: number;
  initiative?: number;
  speed?: number;
  proficiencyBonus?: number;

  weapons: CharacterDto['weapons'];
  inventory: CharacterDto['inventory'];
  skills: CharacterDto['skills'];
  savingThrows: CharacterDto['savingThrows'];
  deathSaves: CharacterDto['deathSaves'];
  traits: CharacterDto['traits'];
  spells: CharacterDto['spells'];

  notes?: string;
  alliesAndOrganizations?: string;
  backstory?: string;
  campaign?: string;

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

  createdAt: any;
  updatedAt: any;
};

function dtoToSheet(dto: CharacterDto): CharacterSheet {
  const u = uid();
  return {
    ownerUid: u,
    owners: [u],
    editors: [],

    name: dto.name ?? '',
    class: dto.class ?? '',
    subclass: dto.subclass,
    race: dto.race ?? '',
    subrace: dto.subrace,

    level: dto.level ?? 1,
    // ВАЖЛИВО: раніше тут стояло dto.race — це ламало дані
    experience: dto.experience ?? 0,

    stats: dto.stats ?? { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    hp: dto.hp ?? { current: 10, max: 10, temp: 0 },
    ac: dto.ac ?? 10,
    initiative: dto.initiative,
    speed: dto.speed,
    proficiencyBonus: dto.proficiencyBonus,

    weapons: dto.weapons ?? [],
    inventory: dto.inventory ?? [],
    skills: dto.skills ?? ({} as any),
    savingThrows: dto.savingThrows ?? ({} as any),
    deathSaves: dto.deathSaves ?? { successes: 0, failures: 0 },
    traits: dto.traits ?? ({} as any),
    spells: dto.spells ?? ({} as any),

    notes: dto.notes ?? '',
    alliesAndOrganizations: dto.alliesAndOrganizations,
    backstory: dto.backstory,
    campaign: dto.campaign,

    coins: dto.coins ?? { gold: 0, silver: 0, copper: 0 },
    customCoins: dto.customCoins, // якщо порожньо — просто не відправляємо undefined
    sessionMode: dto.sessionMode ?? false,
    conditions: dto.conditions ?? [],
    characterTemplateId: dto.characterTemplateId ?? 'standard-5e',
    customFields: dto.customFields ?? [],
    customTrackers: dto.customTrackers,
    customSections: dto.customSections ?? [],
    customResources: dto.customResources ?? [],
    customNotesGroups: dto.customNotesGroups ?? [],
    homebrewEntries: dto.homebrewEntries ?? [],
    customResetRules: dto.customResetRules ?? [],
    customFeatureBlocks: dto.customFeatureBlocks ?? [],
    customSpellLists: dto.customSpellLists ?? [],
    notesBlocks: dto.notesBlocks,
    combatTemplates: dto.combatTemplates ?? { actions: [], bonusActions: [], reactions: [] },

    photoUri: dto.photoUri,

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
  const clean = (paths || []).map((path) => String(path || '').trim()).filter(Boolean);
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
  dto: CharacterDto,
  options?: { historyPaths?: string[]; actorRole?: CharacterActorRole },
) {
  const me = fbAuth.currentUser?.uid;
  if (!me) throw new Error('Not signed in');

  const ref = db.collection('characterSheets').doc(dto.id);

  try {
    let existingMeta: any = null;
    try {
      const snap = await ref.get();
      const e: any = (snap as any)?.exists;
      const exists = typeof e === 'function' ? !!e.call(snap) : !!e;
      if (exists) existingMeta = snap.data();
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
    } else {
      return { id: dto.id, created: true };
    }
  } catch (e) {
    const newId = await saveCharacterSheetAsNew(dto);
    return { id: newId, created: true };
  }
}

export async function bulkUpsertFromLocal(list: CharacterDto[]) {
  for (const c of list) {
    try { await upsertCharacterSheetFromLocal(c); } catch {}
  }
}

export function subscribeCharacterSheet(id: string, cb: (doc: any | null) => void) {
  return db.collection('characterSheets').doc(id).onSnapshot(snap => {
    if (!hasDoc(snap)) return cb(null);
    cb({ id: snap.id, ...(snap.data() as any) });
  });
}

export async function updateCharacterSheet(id: string, patch: Partial<CharacterSheet>) {
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
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!hasDoc(snap)) throw new Error('Sheet not found');
    const data = snap.data() as any;
    const next = Array.from(new Set([...(data.editors || []), toUid]));
    tx.update(ref, { editors: next, updatedAt: now() });
  });
  return toUid;
}

export async function removeEditor(sheetId: string, editorUid: string) {
  const ref = db.collection('characterSheets').doc(sheetId);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!hasDoc(snap)) return;
    const data = snap.data() as any;
    const next = (data.editors || []).filter((x: string) => x !== editorUid);
    tx.update(ref, { editors: next, updatedAt: now() });
  });
}


export async function saveCharacterSheetAsNew(dto: CharacterDto) {
  try {
    const ref = db.collection('characterSheets').doc();
    const content = stripUndefinedDeep(dtoToSheet(dto));
    await ref.set(content);
    console.log('LOG  [save] create ok for id', ref.id);
    return ref.id;
  } catch (err: any) {
    console.warn('WARN [save] save-as-new failed', err?.message ?? err);
    return null;
  }
}

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter((v) => v !== undefined).map((v) => stripUndefinedDeep(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value as any)) {
      if (v === undefined) continue;
      out[k] = stripUndefinedDeep(v);
    }
    return out;
  }
  return value;
}

export function subscribeMySheets(cb: (list: any[]) => void) {
  try {
    const me = uid();
    return db.collection('characterSheets')
      .where('owners', 'array-contains', me)
      .onSnapshot((snap) => {
        const out: any[] = [];
        snap?.forEach?.((d: any) => out.push({ id: d.id, ...(d.data?.() || d.data()) }));
        cb(out);
      }, () => cb([]));
  } catch {
    cb([]);
    return () => {};
  }
}

export function subscribeSharedWithMe(cb: (list: any[]) => void) {
  try {
    const me = uid();
    return db.collection('characterSheets')
      .where('editors', 'array-contains', me)
      .onSnapshot((snap) => {
        const out: any[] = [];
        snap?.forEach?.((d: any) => out.push({ id: d.id, ...(d.data?.() || d.data()) }));
        cb(out);
      }, () => cb([]));
  } catch {
    cb([]);
    return () => {};
  }
}


export async function fetchCharacterSheet(id: string) {
  try {
    const ref = db.collection('characterSheets').doc(id);
    const snap = await ref.get();
    const e = (snap as any)?.exists;
    const exists = typeof e === 'function' ? !!e.call(snap) : !!e;
    if (!exists) return null;
    return { id: snap.id, ...(snap.data() as any) };
  } catch (e) {
    return null;
  }
}



function __cleanUndefined(obj: any): any {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(__cleanUndefined);
  if (typeof obj === 'object') {
    const out: any = {};
    for (const k of Object.keys(obj)) {
      const v = (obj as any)[k];
      if (v === undefined) continue; // Firestore не приймає undefined
      out[k] = __cleanUndefined(v);
    }
    return out;
  }
  return obj;
}


function buildCloudDocFromLocal(dto: CharacterDto, ownerUid: string, existing?: any) {
  const baseMeta = existing ? {
    ownerUid: existing.ownerUid || ownerUid,
    owners: Array.isArray(existing.owners) && existing.owners.length ? existing.owners : [ownerUid],
    editors: Array.isArray(existing.editors) ? existing.editors : [],
    createdAt: existing.createdAt || now(),
  } : {
    ownerUid,
    owners: [ownerUid],
    createdAt: now(),
  };

  const full: any = {
    ...baseMeta,
    updatedAt: now(),

    id: dto.id,
    name: dto.name,
    class: (dto as any).class,
    race: dto.race,
    level: dto.level,
    experience: (dto as any).experience,
    stats: dto.stats,
    hp: dto.hp,
    ac: (dto as any).ac,
    acDetails: (dto as any).armorClassDetails ?? (dto as any).acDetails,
    initiative: (dto as any).initiative,
    speed: (dto as any).speed,
    hitDice: (dto as any).hitDice,
    deathSaves: (dto as any).deathSaves,
    coins: (dto as any).coins,
    currency: (dto as any).currency,
    inventory: (dto as any).inventory,
    weapons: (dto as any).weapons,
    tools: (dto as any).tools,
    proficiencies: (dto as any).proficiencies,
    savingThrows: (dto as any).savingThrows,
    skills: (dto as any).skills,
    traits: (dto as any).traits,
    featuresAndTraits: (dto as any).featuresAndTraits,
    spells: (dto as any).spells,
    notes: (dto as any).notes,
    background: (dto as any).background,
    backstory: (dto as any).backstory,
    subclass: (dto as any).subclass,
    subrace: (dto as any).subrace,
    campaign: (dto as any).campaign,
    alliesAndOrganizations: (dto as any).alliesAndOrganizations,
    photoUri: (dto as any).photoUri,
    sessionMode: (dto as any).sessionMode,
    conditions: (dto as any).conditions,
    characterTemplateId: (dto as any).characterTemplateId,
    customFields: (dto as any).customFields,
    customTrackers: (dto as any).customTrackers,
    customSections: (dto as any).customSections,
    customResources: (dto as any).customResources,
    customNotesGroups: (dto as any).customNotesGroups,
    homebrewEntries: (dto as any).homebrewEntries,
    customResetRules: (dto as any).customResetRules,
    customFeatureBlocks: (dto as any).customFeatureBlocks,
    customSpellLists: (dto as any).customSpellLists,
    notesBlocks: (dto as any).notesBlocks,
    combatTemplates: (dto as any).combatTemplates,
  };

  return __cleanUndefined(full);
}


export async function autosaveCharacter(dto: CharacterDto) {
  return upsertCharacterSheetFromLocal(dto);









}
