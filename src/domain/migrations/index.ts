type AnyRecord = Record<string, unknown>;

export const LATEST_SCHEMA_VERSION = 4;

export type MigrationKind =
  | 'character'
  | 'dmCampaigns'
  | 'dmCampaignNotes'
  | 'dmNotesQueue'
  | 'dmCampaignEncounters'
  | 'dmCampaignEncountersQueue'
  | 'dmCampaignInitiative'
  | 'dmMonsters'
  | 'dmPins'
  | 'dmMonsterFavorites'
  | 'dmUserTemplates'
  | 'appRole'
  | 'dmDefaultCampaign'
  | 'spellbookSpells'
  | 'spellbookFavorites'
  | 'spellbookPins'
  | 'spellbookNotes';

export type VersionedStorageEnvelope<T> = {
  schemaVersion: number;
  data: T;
};

export type PayloadMigrationResult<T> = {
  data: T;
  schemaVersion: number;
  fromSchemaVersion: number;
  migrated: boolean;
};

export type StorageReadResult<T> = {
  data: T;
  schemaVersion: number;
  migrated: boolean;
  usedLegacyFormat: boolean;
};

const NOTE_GROUP_SEED: Array<{ key: string; title: string; order: number }> = [
  { key: 'session', title: 'Сесія', order: 0 },
  { key: 'campaign', title: 'Кампанія', order: 1 },
  { key: 'goals', title: 'Цілі', order: 2 },
  { key: 'relationships', title: 'Зв’язки', order: 3 },
  { key: 'quests', title: 'Квести', order: 4 },
];

const APP_ROLES = new Set(['Player', 'DM', 'Hybrid']);

const SRD_CLASS_NAME_TO_ID: Record<string, string> = {
  barbarian: 'barbarian',
  варвар: 'barbarian',
  bard: 'bard',
  бард: 'bard',
  cleric: 'cleric',
  клірик: 'cleric',
  druid: 'druid',
  друїд: 'druid',
  fighter: 'fighter',
  боєць: 'fighter',
  paladin: 'paladin',
  паладин: 'paladin',
  ranger: 'ranger',
  рейнджер: 'ranger',
  monk: 'monk',
  монах: 'monk',
  rogue: 'rogue',
  розбійник: 'rogue',
  warlock: 'warlock',
  чаклун: 'warlock',
  wizard: 'wizard',
  чарівник: 'wizard',
  sorcerer: 'sorcerer',
  чародій: 'sorcerer',
};

const SRD_RACE_NAME_TO_ID: Record<string, string> = {
  dragonborn: 'dragonborn',
  драконороджений: 'dragonborn',
  dwarf: 'dwarf',
  дварф: 'dwarf',
  elf: 'elf',
  ельф: 'elf',
  gnome: 'gnome',
  гном: 'gnome',
  'half-elf': 'half-elf',
  halfelf: 'half-elf',
  'half elf': 'half-elf',
  напівельф: 'half-elf',
  'half-orc': 'half-orc',
  halforc: 'half-orc',
  'half orc': 'half-orc',
  напіворк: 'half-orc',
  halfling: 'halfling',
  галфлінг: 'halfling',
  напіврослик: 'halfling',
  human: 'human',
  людина: 'human',
  tiefling: 'tiefling',
  тіфлінг: 'tiefling',
};

const SRD_BACKGROUND_NAME_TO_ID: Record<string, string> = {
  acolyte: 'acolyte',
};

function asRecord(value: unknown): AnyRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as AnyRecord;
}

function toTrimmedString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function normalizeLookupKey(value: unknown): string {
  return toTrimmedString(value).toLowerCase();
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function readSchemaVersion(value: unknown): number {
  const numeric = Math.floor(toNumber(value, 1));
  if (!Number.isFinite(numeric) || numeric < 1) return 1;
  return numeric;
}

function isEnvelope(value: unknown): value is VersionedStorageEnvelope<unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const cast = value as AnyRecord;
  return 'data' in cast && 'schemaVersion' in cast;
}

function cloneArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  return [...value];
}

function mergeUniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function normalizeTrackerToResource(raw: unknown, index: number) {
  const cast = asRecord(raw);
  return {
    id: toTrimmedString(cast.id) || `legacy-tracker-${index}`,
    label: toTrimmedString(cast.label) || 'Ресурс',
    current: Math.max(0, toNumber(cast.current, 0)),
    max: cast.max === undefined || cast.max === null ? undefined : Math.max(0, toNumber(cast.max, 0)),
    resetRule: toTrimmedString(cast.resetRule) || 'none',
    visibility: toTrimmedString(cast.visibility) || undefined,
    color: toTrimmedString(cast.color) || undefined,
  };
}

function buildSeededNotesGroups(notesBlocks: AnyRecord) {
  return NOTE_GROUP_SEED.map((seed) => ({
    id: `seed-${seed.key}`,
    title: seed.title,
    content: toTrimmedString(notesBlocks[seed.key], ''),
    order: seed.order,
    origin: 'seeded' as const,
  }));
}

function normalizeLegacySpellEntries(rawLists: unknown) {
  if (!Array.isArray(rawLists)) return [];
  const entries: Array<AnyRecord & { id: string }> = [];
  rawLists.forEach((list, listIndex) => {
    const listRecord = asRecord(list);
    const listId = toTrimmedString(listRecord.id) || `legacy-spell-list-${listIndex}`;
    const listTitle = toTrimmedString(listRecord.title);
    const spells = Array.isArray(listRecord.spells) ? listRecord.spells : [];
    spells.forEach((spell, spellIndex) => {
      const spellName = toTrimmedString(spell);
      if (!spellName) return;
      entries.push({
        id: `legacy-spell-${listId}-${spellIndex}`,
        kind: 'spell',
        name: spellName,
        description: listTitle ? `Із застарілого списку заклять: ${listTitle}` : 'Перенесено із застарілого списку заклять',
        tags: listTitle ? [listTitle] : [],
      });
    });
  });
  return entries;
}

function normalizeLegacyFeatureEntries(rawBlocks: unknown) {
  if (!Array.isArray(rawBlocks)) return [];
  const entries: Array<AnyRecord & { id: string }> = [];
  rawBlocks.forEach((block, blockIndex) => {
    const blockRecord = asRecord(block);
    const blockId = toTrimmedString(blockRecord.id) || `legacy-feature-block-${blockIndex}`;
    const blockTitle = toTrimmedString(blockRecord.title);
    const featureEntries = Array.isArray(blockRecord.entries) ? blockRecord.entries : [];
    featureEntries.forEach((entry, entryIndex) => {
      const entryName = toTrimmedString(entry);
      if (!entryName) return;
      entries.push({
        id: `legacy-feature-${blockId}-${entryIndex}`,
        kind: 'ability',
        name: entryName,
        description: blockTitle ? `Із застарілого блоку особливостей: ${blockTitle}` : 'Перенесено із застарілого блоку особливостей',
        tags: blockTitle ? [blockTitle] : [],
      });
    });
  });
  return entries;
}

function migrateCharacterV1toV2(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload.map((item) => migrateCharacterV1toV2(item));

  const record = asRecord(payload);
  const next: AnyRecord = { ...record };

  const customResources = Array.isArray(record.customResources) ? cloneArray(record.customResources) : [];
  const customTrackers = Array.isArray(record.customTrackers) ? record.customTrackers : [];
  if (customTrackers.length) {
    const resourcesFromTrackers = customTrackers.map((tracker, index) => normalizeTrackerToResource(tracker, index));
    next.customResources = mergeUniqueById([...(customResources as Array<{ id: string }>), ...resourcesFromTrackers]);
    next.customTrackers = [];
  }

  if (!Array.isArray(record.customNotesGroups)) {
    const notesBlocks = asRecord(record.notesBlocks);
    next.customNotesGroups = buildSeededNotesGroups(notesBlocks);
  }
  if ('notesBlocks' in next) {
    delete next.notesBlocks;
  }

  return next;
}

function migrateCharacterV2toV3(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload.map((item) => migrateCharacterV2toV3(item));

  const record = asRecord(payload);
  const next: AnyRecord = { ...record };

  const existingEntries = Array.isArray(record.homebrewEntries) ? record.homebrewEntries : [];
  const legacySpellEntries = normalizeLegacySpellEntries(record.customSpellLists);
  const legacyFeatureEntries = normalizeLegacyFeatureEntries(record.customFeatureBlocks);

  next.homebrewEntries = mergeUniqueById([...(existingEntries as Array<{ id: string }>), ...legacySpellEntries, ...legacyFeatureEntries]);
  next.customSpellLists = [];
  next.customFeatureBlocks = [];
  next.customTrackers = [];

  return next;
}

function buildSrdContentSource(id: string, name: string) {
  return {
    origin: 'srd-5.1',
    source: 'srd-5.1',
    license: 'ogl-1.0a',
    id,
    name,
    legacyCustom: false,
  };
}

function buildHomebrewContentSource(id: string, name: string) {
  return {
    origin: 'homebrew',
    source: 'homebrew',
    license: 'custom',
    id,
    name,
    legacyCustom: false,
  };
}

function buildLegacyCustomContentSource(name: string) {
  return {
    origin: 'legacy-custom',
    source: 'user-custom',
    license: 'unknown',
    name,
    legacyCustom: true,
  };
}

function migrateCharacterV3toV4(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload.map((item) => migrateCharacterV3toV4(item));

  const record = asRecord(payload);
  const next: AnyRecord = { ...record };
  const contentSources = { ...asRecord(record.contentSources) };

  const classText = toTrimmedString(record.class);
  const classKey = normalizeLookupKey(classText);
  if (!toTrimmedString(record.classId)) {
    const classId = SRD_CLASS_NAME_TO_ID[classKey];
    if (classId) {
      next.classId = classId;
      contentSources.class = buildSrdContentSource(classId, classText || classId);
    } else if (classKey === 'artificer' || classKey === 'артифісер' || classKey === 'винахідник') {
      contentSources.class = buildHomebrewContentSource('artificer', classText || 'Artificer');
    } else if (classText) {
      contentSources.class = buildLegacyCustomContentSource(classText);
    }
  }

  const raceText = toTrimmedString(record.race);
  const raceId = SRD_RACE_NAME_TO_ID[normalizeLookupKey(raceText)];
  if (!toTrimmedString(record.raceId)) {
    if (raceId) {
      next.raceId = raceId;
      contentSources.race = buildSrdContentSource(raceId, raceText || raceId);
    } else if (raceText) {
      contentSources.race = buildLegacyCustomContentSource(raceText);
    }
  }

  const backgroundText = toTrimmedString(record.background);
  const backgroundId = SRD_BACKGROUND_NAME_TO_ID[normalizeLookupKey(backgroundText)];
  if (!toTrimmedString(record.backgroundId)) {
    if (backgroundId) {
      next.backgroundId = backgroundId;
      contentSources.background = buildSrdContentSource(backgroundId, backgroundText || backgroundId);
    } else if (backgroundText) {
      contentSources.background = buildLegacyCustomContentSource(backgroundText);
    }
  }

  if (Object.keys(contentSources).length) {
    next.contentSources = contentSources;
  }

  return next;
}

function normalizeAppRole(payload: unknown): string {
  const role = toTrimmedString(payload);
  if (APP_ROLES.has(role)) return role;
  return 'Hybrid';
}

function ensureStringArray(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  payload.forEach((item) => {
    const value = toTrimmedString(item);
    if (!value || seen.has(value)) return;
    seen.add(value);
    out.push(value);
  });
  return out;
}

function stampPersistedSchemaVersion(kind: MigrationKind, payload: unknown): unknown {
  if (
    kind === 'appRole' ||
    kind === 'dmDefaultCampaign' ||
    kind === 'dmPins' ||
    kind === 'dmMonsterFavorites' ||
    kind === 'dmMonsters' ||
    kind === 'dmUserTemplates' ||
    kind === 'dmNotesQueue' ||
    kind === 'spellbookSpells' ||
    kind === 'spellbookFavorites' ||
    kind === 'spellbookPins' ||
    kind === 'spellbookNotes'
  ) {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => {
      const cast = asRecord(item);
      return { ...cast, schemaVersion: LATEST_SCHEMA_VERSION };
    });
  }

  const cast = asRecord(payload);
  return { ...cast, schemaVersion: LATEST_SCHEMA_VERSION };
}

function migrateKindV1toV2(kind: MigrationKind, payload: unknown): unknown {
  if (kind === 'character') return migrateCharacterV1toV2(payload);
  if (kind === 'dmPins' || kind === 'dmMonsterFavorites' || kind === 'spellbookPins') return ensureStringArray(payload);
  if (kind === 'appRole') return normalizeAppRole(payload);
  if (
    kind === 'dmMonsters' ||
    kind === 'dmUserTemplates' ||
    kind === 'dmCampaigns' ||
    kind === 'dmCampaignNotes' ||
    kind === 'dmNotesQueue' ||
    kind === 'dmCampaignEncounters' ||
    kind === 'dmCampaignEncountersQueue' ||
    kind === 'spellbookSpells' ||
    kind === 'spellbookFavorites' ||
    kind === 'spellbookNotes'
  ) {
    return payload;
  }
  return payload;
}

function migrateKindV2toV3(kind: MigrationKind, payload: unknown): unknown {
  if (kind === 'character') return migrateCharacterV2toV3(payload);
  if (kind === 'dmPins' || kind === 'dmMonsterFavorites' || kind === 'spellbookPins') return ensureStringArray(payload);
  if (kind === 'appRole') return normalizeAppRole(payload);
  if (
    kind === 'dmMonsters' ||
    kind === 'dmUserTemplates' ||
    kind === 'dmCampaigns' ||
    kind === 'dmCampaignNotes' ||
    kind === 'dmNotesQueue' ||
    kind === 'dmCampaignEncounters' ||
    kind === 'dmCampaignEncountersQueue' ||
    kind === 'spellbookSpells' ||
    kind === 'spellbookFavorites' ||
    kind === 'spellbookNotes'
  ) {
    return payload;
  }
  return payload;
}

export function migrateV1toV2(kind: MigrationKind, payload: unknown): unknown {
  return migrateKindV1toV2(kind, payload);
}

export function migrateV2toV3(kind: MigrationKind, payload: unknown): unknown {
  return migrateKindV2toV3(kind, payload);
}

export function migrateV3toV4(kind: MigrationKind, payload: unknown): unknown {
  if (kind === 'character') return migrateCharacterV3toV4(payload);
  return payload;
}

export function migrateToLatest(kind: MigrationKind, payload: unknown, fromSchemaVersion = 1): unknown {
  const safeFrom = readSchemaVersion(fromSchemaVersion);
  let next = payload;

  if (safeFrom <= 1) {
    next = migrateV1toV2(kind, next);
  }
  if (safeFrom <= 2) {
    next = migrateV2toV3(kind, next);
  }
  if (safeFrom <= 3) {
    next = migrateV3toV4(kind, next);
  }

  return stampPersistedSchemaVersion(kind, next);
}

export function migratePayloadToLatest<T>(kind: MigrationKind, payload: unknown): PayloadMigrationResult<T> {
  const payloadRecord = asRecord(payload);
  const fromSchemaVersion = readSchemaVersion(payloadRecord.schemaVersion);
  const data = migrateToLatest(kind, payload, fromSchemaVersion) as T;
  return {
    data,
    schemaVersion: LATEST_SCHEMA_VERSION,
    fromSchemaVersion,
    migrated: fromSchemaVersion !== LATEST_SCHEMA_VERSION,
  };
}

export function normalizeStorageEnvelope<T>(kind: MigrationKind, storedValue: unknown, fallbackData: T): StorageReadResult<T> {
  if (storedValue === null || storedValue === undefined) {
    return {
      data: fallbackData,
      schemaVersion: LATEST_SCHEMA_VERSION,
      migrated: false,
      usedLegacyFormat: false,
    };
  }

  if (isEnvelope(storedValue)) {
    const fromSchemaVersion = readSchemaVersion(storedValue.schemaVersion);
    const data = migrateToLatest(kind, storedValue.data, fromSchemaVersion) as T;
    return {
      data,
      schemaVersion: LATEST_SCHEMA_VERSION,
      migrated: fromSchemaVersion !== LATEST_SCHEMA_VERSION,
      usedLegacyFormat: false,
    };
  }

  const fromSchemaVersion = readSchemaVersion(asRecord(storedValue).schemaVersion);
  const data = migrateToLatest(kind, storedValue, fromSchemaVersion) as T;
  return {
    data,
    schemaVersion: LATEST_SCHEMA_VERSION,
    migrated: true,
    usedLegacyFormat: true,
  };
}

export function createStorageEnvelope<T>(kind: MigrationKind, payload: T): VersionedStorageEnvelope<T> {
  return {
    schemaVersion: LATEST_SCHEMA_VERSION,
    data: migrateToLatest(kind, payload, LATEST_SCHEMA_VERSION) as T,
  };
}
