
import { db, fbAuth, now, hasDoc, arrayUnion } from './firebase';
import { ensureConnection } from './connections';
import { findUserByEmail } from './users';
import type { CharacterDto } from '@/types/Character';

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
  customFields?: CharacterDto['customFields'];
  customTrackers?: CharacterDto['customTrackers'];
  notesBlocks?: CharacterDto['notesBlocks'];

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

    stats: dto.stats ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    hp: dto.hp ?? { current: 10, max: 10 },
    ac: dto.ac ?? 10,
    initiative: dto.initiative,
    speed: dto.speed,
    proficiencyBonus: dto.proficiencyBonus,

    weapons: dto.weapons ?? [],
    inventory: dto.inventory ?? [],
    skills: dto.skills ?? ({} as any),
    savingThrows: dto.savingThrows ?? ({} as any),
    deathSaves: dto.deathSaves ?? { success: 0, fail: 0 },
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
    customFields: dto.customFields ?? [],
    customTrackers: dto.customTrackers ?? [],
    notesBlocks: dto.notesBlocks ?? {},

    photoUri: dto.photoUri,

    createdAt: now(),
    updatedAt: now(),
  };
}

export async function upsertCharacterSheetFromLocal(dto: CharacterDto) {
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
    customFields: (dto as any).customFields,
    customTrackers: (dto as any).customTrackers,
    notesBlocks: (dto as any).notesBlocks,
  };

  return __cleanUndefined(full);
}


export async function autosaveCharacter(dto: CharacterDto) {
  return upsertCharacterSheetFromLocal(dto);









}
