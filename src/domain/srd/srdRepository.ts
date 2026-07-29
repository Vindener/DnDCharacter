import {
  loadBackgroundsJson,
  loadClassesJson,
  loadClassProgressionJson,
  loadConditionsJson,
  loadEquipmentJson,
  loadLanguagesJson,
  loadMonstersJson,
  loadRacesJson,
  loadReferencesJson,
  loadSkillsJson,
  loadSpellsJson,
} from '@/data/srd';
import {
  parseSrdArray,
  srdBackgroundSchema,
  srdClassProgressionSchema,
  srdClassSchema,
  srdConditionSchema,
  srdEquipmentItemSchema,
  srdLanguageSchema,
  srdMonsterSchema,
  srdRaceSchema,
  srdReferenceEntrySchema,
  srdSkillSchema,
  srdSpellSchema,
} from './schemas';
import type {
  SrdBackground,
  SrdClass,
  SrdClassProgression,
  SrdClassProgressionLevel,
  SrdCondition,
  SrdEquipmentItem,
  SrdLanguage,
  SrdMonster,
  SrdRace,
  SrdReferenceEntry,
  SrdSkill,
  SrdSpell,
} from './types';

// Each collection is parsed at most once, on first access, instead of at module-evaluation
// time — the JSON `require()` + typed cast only run once a consumer actually needs
// that specific SRD table (PERF-1). Zod itself moved to build-time (see
// validateAllSrdCollections below + scripts/validate-srd.mjs); the runtime path here is a
// typed cast, since the source JSON is validated before it ever ships.

let racesCache: SrdRace[] | undefined;
function loadRaces(): SrdRace[] {
  if (racesCache === undefined) racesCache = loadRacesJson() as SrdRace[];
  return racesCache;
}

let classesCache: SrdClass[] | undefined;
function loadClasses(): SrdClass[] {
  if (classesCache === undefined) classesCache = loadClassesJson() as SrdClass[];
  return classesCache;
}

let classProgressionsCache: SrdClassProgression[] | undefined;
function loadClassProgressions(): SrdClassProgression[] {
  if (classProgressionsCache === undefined) classProgressionsCache = loadClassProgressionJson() as SrdClassProgression[];
  return classProgressionsCache;
}

let backgroundsCache: SrdBackground[] | undefined;
function loadBackgrounds(): SrdBackground[] {
  if (backgroundsCache === undefined) backgroundsCache = loadBackgroundsJson() as SrdBackground[];
  return backgroundsCache;
}

let conditionsCache: SrdCondition[] | undefined;
function loadConditions(): SrdCondition[] {
  if (conditionsCache === undefined) conditionsCache = loadConditionsJson() as SrdCondition[];
  return conditionsCache;
}

let equipmentCache: SrdEquipmentItem[] | undefined;
function loadEquipment(): SrdEquipmentItem[] {
  if (equipmentCache === undefined) equipmentCache = loadEquipmentJson() as SrdEquipmentItem[];
  return equipmentCache;
}

let languagesCache: SrdLanguage[] | undefined;
function loadLanguages(): SrdLanguage[] {
  if (languagesCache === undefined) languagesCache = loadLanguagesJson() as SrdLanguage[];
  return languagesCache;
}

let monstersCache: SrdMonster[] | undefined;
function loadMonsters(): SrdMonster[] {
  if (monstersCache === undefined) monstersCache = loadMonstersJson() as SrdMonster[];
  return monstersCache;
}

let referencesCache: SrdReferenceEntry[] | undefined;
function loadReferences(): SrdReferenceEntry[] {
  if (referencesCache === undefined) referencesCache = loadReferencesJson() as SrdReferenceEntry[];
  return referencesCache;
}

let skillsCache: SrdSkill[] | undefined;
function loadSkills(): SrdSkill[] {
  if (skillsCache === undefined) skillsCache = loadSkillsJson() as SrdSkill[];
  return skillsCache;
}

let spellsCache: SrdSpell[] | undefined;
function loadSpells(): SrdSpell[] {
  if (spellsCache === undefined) spellsCache = loadSpellsJson() as SrdSpell[];
  return spellsCache;
}

export function getSrdRaces(): SrdRace[] {
  return loadRaces();
}

export function getSrdRaceById(id: string): SrdRace | undefined {
  return loadRaces().find((race) => race.id === id);
}

export function getSrdClasses(): SrdClass[] {
  return loadClasses();
}

export function getSrdClassById(id: string): SrdClass | undefined {
  return loadClasses().find((item) => item.id === id);
}

export function getClassProgression(classId: string, level: number): SrdClassProgressionLevel | undefined {
  const progression = loadClassProgressions().find((item) => item.classId === classId);
  return progression?.levels.find((item) => item.level === level);
}

export function getSrdClassProgressions(): SrdClassProgression[] {
  return loadClassProgressions();
}

export function getAvailableSkillsForClass(classId: string): SrdSkill[] {
  const srdClass = getSrdClassById(classId);
  if (!srdClass) return [];
  const allowed = new Set<string>(srdClass.skillChoices.from);
  return loadSkills().filter((skill) => allowed.has(skill.id));
}

export function getStartingEquipmentForClass(classId: string) {
  return getSrdClassById(classId)?.startingEquipment;
}

export function getConditions(): SrdCondition[] {
  return loadConditions();
}

export function getEquipment(): SrdEquipmentItem[] {
  return loadEquipment();
}

export function getSrdSpells(): SrdSpell[] {
  return loadSpells();
}

export function getSrdSpellById(id: string): SrdSpell | undefined {
  return loadSpells().find((spell) => spell.id === id);
}

export function getSrdMonsters(): SrdMonster[] {
  return loadMonsters();
}

export function getSrdMonsterById(id: string): SrdMonster | undefined {
  return loadMonsters().find((monster) => monster.id === id);
}

export function getSrdReferences(): SrdReferenceEntry[] {
  return loadReferences();
}

export function getSrdReferenceById(id: string): SrdReferenceEntry | undefined {
  return loadReferences().find((entry) => entry.id === id);
}

export function getSrdBackgrounds(): SrdBackground[] {
  return loadBackgrounds();
}

export function getSrdBackgroundById(id: string): SrdBackground | undefined {
  return loadBackgrounds().find((item) => item.id === id);
}

export function getSrdLanguages(): SrdLanguage[] {
  return loadLanguages();
}

export function getSrdSkills(): SrdSkill[] {
  return loadSkills();
}

// Build-time validation entry point (see scripts/validate-srd.mjs). Deliberately re-reads
// the raw JSON via the same lazy loaders rather than the caches above, so this always
// validates the actual on-disk data regardless of whether the runtime caches were
// already populated by an earlier getSrdX() call in the same process.
export function validateAllSrdCollections(): void {
  parseSrdArray(srdRaceSchema, loadRacesJson());
  parseSrdArray(srdClassSchema, loadClassesJson());
  parseSrdArray(srdClassProgressionSchema, loadClassProgressionJson());
  parseSrdArray(srdBackgroundSchema, loadBackgroundsJson());
  parseSrdArray(srdConditionSchema, loadConditionsJson());
  parseSrdArray(srdEquipmentItemSchema, loadEquipmentJson());
  parseSrdArray(srdLanguageSchema, loadLanguagesJson());
  parseSrdArray(srdMonsterSchema, loadMonstersJson());
  parseSrdArray(srdReferenceEntrySchema, loadReferencesJson());
  parseSrdArray(srdSkillSchema, loadSkillsJson());
  parseSrdArray(srdSpellSchema, loadSpellsJson());
}
