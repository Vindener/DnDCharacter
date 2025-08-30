
import { db, fbAuth, now, hasDoc, arrayUnion } from './firebase';
import { ensureConnection } from './connections';
import { findUserByEmail } from './users';
import type { CharacterDto } from '@/types/Character';

function uid() { const u = fbAuth.currentUser; if (!u) throw new Error('Not signed in'); return u.uid; }

export type CharacterSheet = {
  ownerUid: string;
  owners: string[];
  editors: string[];
  name: string;
  class?: string;
  race?: string;
  level?: number;
  experience: number;
  stats?: Record<string, number>;
  hp?: { current: number; max: number; temp?: number };
  ac?: number;
  inventory?: any[];
  notes?: string;
  createdAt: any;
  updatedAt: any;
};

function dtoToSheet(dto: CharacterDto): CharacterSheet {
  return {
    ownerUid: uid(),
    owners: [uid()],
    editors: [],
    name: dto.name,
    class: (dto as any).class || '',
    race: (dto as any).race || '',
    experience: (dto as any).race || 0,
    level: (dto as any).level || 1,
    stats: (dto as any).stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    hp: (dto as any).hp || { current: 10, max: 10 },
    ac: (dto as any).ac || 10,
    inventory: (dto as any).inventory || [],
    notes: (dto as any).notes || '',
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
    await ref.set(payload, { merge: true });
    return dto.id;
  } catch (e) {
    const newId = await saveCharacterSheetAsNew(dto);
    return newId;
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
  const me = fbAuth.currentUser?.uid;
  if (!me) throw new Error('Not signed in');
  const ref = db.collection('characterSheets').doc(); // auto id
  const toWrite = buildCloudDocFromLocal({ ...(dto as any), id: ref.id } as any, me);
  await ref.set(toWrite);
  return ref.id;
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


import type { CharacterDto } from '@/types/Character';

function buildCloudDocFromLocal(dto: CharacterDto, ownerUid: string, existing?: any) {
  const baseMeta = existing ? {
    ownerUid: existing.ownerUid || ownerUid,
    owners: Array.isArray(existing.owners) && existing.owners.length ? existing.owners : [ownerUid],
    editors: Array.isArray(existing.editors) ? existing.editors : [],
    createdAt: existing.createdAt || now(),
  } : {
    ownerUid,
    owners: [ownerUid],
    editors: [],
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
  };

  return __cleanUndefined(full);
}


export async function autosaveCharacter(dto: CharacterDto): Promise<{ id: string, created?: boolean } | null> {
  const me = fbAuth.currentUser?.uid;
  if (!me || !dto?.id) return null;
  const ref = db.collection('characterSheets').doc(dto.id);
  const content = buildCloudDocFromLocal(dto, me);
  try {
    await ref.set(content, { merge: true });
    return { id: dto.id };
  } catch {
    try {
      const newId = await saveCharacterSheetAsNew(dto);
      return { id: newId, created: true };
    } catch {
      return null;
    }
  }
}


