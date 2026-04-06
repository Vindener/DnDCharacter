import { z } from 'zod';
import type {
  CharacterCustomField,
  CharacterCustomNotesGroup,
  CharacterCustomResource,
  CharacterCustomSection,
  CharacterCustomResetRule,
  CharacterDto,
  CharacterEntity,
  CharacterHomebrewEntry,
  CharacterTracker,
  CharacterTemplateId,
  CustomFieldType,
  TrackerResetRule,
  TrackerVisibility,
} from '@/domain/types';
import { asRecord, toBoolean, toNumber, toString, toStringArray, toTrimmedString, safeParseWithIssues } from './utils';

export type HomebrewEntitySlice = Pick<
  CharacterEntity,
  | 'characterTemplateId'
  | 'customFields'
  | 'customTrackers'
  | 'customSections'
  | 'customResources'
  | 'customResetRules'
  | 'customNotesGroups'
  | 'homebrewEntries'
  | 'customSpellLists'
  | 'customFeatureBlocks'
  | 'notesBlocks'
>;

type HomebrewDraft = Partial<HomebrewEntitySlice>;

const NOTE_GROUP_SEED: Array<{ key: keyof NonNullable<CharacterDto['notesBlocks']>; title: string; order: number }> = [
  { key: 'session', title: 'Сесія', order: 0 },
  { key: 'campaign', title: 'Кампанія', order: 1 },
  { key: 'goals', title: 'Цілі', order: 2 },
  { key: 'relationships', title: 'Зв’язки', order: 3 },
  { key: 'quests', title: 'Квести', order: 4 },
];

const TEMPLATE_IDS: CharacterTemplateId[] = [
  'standard-5e',
  'homebrew-light',
  'homebrew-heavy',
  'caster',
  'martial',
  'custom-blank',
];
const FIELD_TYPES: CustomFieldType[] = ['text', 'number', 'boolean', 'select'];
const RESET_RULES: TrackerResetRule[] = ['none', 'short-rest', 'long-rest', 'session'];
const VISIBILITY_RULES: TrackerVisibility[] = ['player', 'dm', 'both'];
const HOMEBREW_KINDS: CharacterHomebrewEntry['kind'][] = ['spell', 'ability', 'feat'];
const HOMEBREW_ACTIVATION: Array<NonNullable<CharacterHomebrewEntry['activation']>> = [
  'action',
  'bonus',
  'reaction',
  'passive',
  'special',
];
const CUSTOM_RESET_TRIGGER: CharacterCustomResetRule['trigger'][] = ['short-rest', 'long-rest', 'session-start'];
const CUSTOM_RESET_MODE: CharacterCustomResetRule['mode'][] = ['set', 'increment', 'decrement'];

function selectTemplateId(value: unknown): CharacterTemplateId {
  const id = toTrimmedString(value);
  if (TEMPLATE_IDS.includes(id as CharacterTemplateId)) return id as CharacterTemplateId;
  return 'standard-5e';
}

function selectResetRule(value: unknown): TrackerResetRule {
  const rule = toTrimmedString(value);
  if (RESET_RULES.includes(rule as TrackerResetRule)) return rule as TrackerResetRule;
  return 'none';
}

function selectVisibility(value: unknown): TrackerVisibility | undefined {
  const visibility = toTrimmedString(value);
  if (VISIBILITY_RULES.includes(visibility as TrackerVisibility)) return visibility as TrackerVisibility;
  return undefined;
}

function selectCustomFieldType(value: unknown): CustomFieldType {
  const fieldType = toTrimmedString(value);
  if (FIELD_TYPES.includes(fieldType as CustomFieldType)) return fieldType as CustomFieldType;
  return 'text';
}

function coerceFieldValue(type: CustomFieldType, value: unknown, options?: string[]): string | number | boolean {
  if (type === 'number') return toNumber(value, 0);
  if (type === 'boolean') return toBoolean(value, false);
  if (type === 'select') {
    const current = toTrimmedString(value);
    if (!options?.length) return current;
    return options.includes(current) ? current : options[0];
  }
  return toString(value, '');
}

function normalizeCustomField(raw: unknown, index: number): CharacterCustomField | null {
  const record = asRecord(raw);
  const type = selectCustomFieldType(record.type);
  const options =
    type === 'select'
      ? toStringArray(record.options, { dedupe: true })
      : undefined;
  return {
    id: toTrimmedString(record.id) || `custom-field-${index}`,
    label: toTrimmedString(record.label) || `Поле ${index + 1}`,
    type,
    value: coerceFieldValue(type, record.value, options),
    options,
  };
}

function normalizeResource(raw: unknown, index: number): CharacterCustomResource | null {
  const record = asRecord(raw);
  return {
    id: toTrimmedString(record.id) || `resource-${index}`,
    label: toTrimmedString(record.label) || 'Ресурс',
    current: Math.max(0, toNumber(record.current, 0)),
    max: record.max === undefined || record.max === null ? undefined : Math.max(0, toNumber(record.max, 0)),
    resetRule: selectResetRule(record.resetRule),
    visibility: selectVisibility(record.visibility),
    color: toTrimmedString(record.color) || undefined,
  };
}

function normalizeCustomSection(raw: unknown, index: number): CharacterCustomSection | null {
  const record = asRecord(raw);
  return {
    id: toTrimmedString(record.id) || `custom-section-${index}`,
    title: toTrimmedString(record.title) || `Власний розділ ${index + 1}`,
    content: toString(record.content, ''),
  };
}

function normalizeCustomResetRule(raw: unknown, index: number): CharacterCustomResetRule | null {
  const record = asRecord(raw);
  const trigger = toTrimmedString(record.trigger);
  const mode = toTrimmedString(record.mode);
  if (!CUSTOM_RESET_TRIGGER.includes(trigger as CharacterCustomResetRule['trigger'])) return null;
  if (!CUSTOM_RESET_MODE.includes(mode as CharacterCustomResetRule['mode'])) return null;
  const targetId = toTrimmedString(record.targetId);
  if (!targetId) return null;
  return {
    id: toTrimmedString(record.id) || `custom-reset-rule-${index}`,
    targetId,
    trigger: trigger as CharacterCustomResetRule['trigger'],
    mode: mode as CharacterCustomResetRule['mode'],
    value: toNumber(record.value, 0),
  };
}

function normalizeTracker(raw: unknown, index: number): CharacterTracker | null {
  const record = asRecord(raw);
  return {
    id: toTrimmedString(record.id) || `legacy-tracker-${index}`,
    label: toTrimmedString(record.label) || 'Ресурс',
    current: Math.max(0, toNumber(record.current, 0)),
    max: record.max === undefined || record.max === null ? undefined : Math.max(0, toNumber(record.max, 0)),
    resetRule: selectResetRule(record.resetRule),
    visibility: selectVisibility(record.visibility),
    color: toTrimmedString(record.color) || undefined,
  };
}

function trackerToResource(tracker: CharacterTracker): CharacterCustomResource {
  return {
    id: tracker.id,
    label: tracker.label,
    current: tracker.current,
    max: tracker.max,
    resetRule: tracker.resetRule,
    visibility: tracker.visibility,
    color: tracker.color,
  };
}

function normalizeNotesGroup(raw: unknown, index: number): CharacterCustomNotesGroup | null {
  const record = asRecord(raw);
  const origin = toTrimmedString(record.origin);
  return {
    id: toTrimmedString(record.id) || `notes-group-${index}`,
    title: toTrimmedString(record.title) || `Група ${index + 1}`,
    content: toString(record.content, ''),
    order: toNumber(record.order, index),
    origin: origin === 'custom' ? 'custom' : 'seeded',
  };
}

function normalizeHomebrewEntry(raw: unknown, index: number): CharacterHomebrewEntry | null {
  const record = asRecord(raw);
  const kind = toTrimmedString(record.kind);
  const name = toTrimmedString(record.name);
  if (!name) return null;

  const activationValue = toTrimmedString(record.activation);
  const activation = HOMEBREW_ACTIVATION.includes(activationValue as NonNullable<CharacterHomebrewEntry['activation']>)
    ? (activationValue as NonNullable<CharacterHomebrewEntry['activation']>)
    : undefined;

  return {
    id: toTrimmedString(record.id) || `homebrew-entry-${index}`,
    kind: HOMEBREW_KINDS.includes(kind as CharacterHomebrewEntry['kind'])
      ? (kind as CharacterHomebrewEntry['kind'])
      : 'ability',
    name,
    description: toString(record.description, ''),
    tags: toStringArray(record.tags, { dedupe: true }),
    activation,
    linkedResourceId: toTrimmedString(record.linkedResourceId) || undefined,
  };
}

function buildSeededNotesGroups(notesBlocks: HomebrewDraft['notesBlocks']): CharacterCustomNotesGroup[] {
  return NOTE_GROUP_SEED.map((seed) => ({
    id: `seed-${seed.key}`,
    title: seed.title,
    content: toString(notesBlocks?.[seed.key], ''),
    order: seed.order,
    origin: 'seeded',
  }));
}

function normalizeLegacySpellListEntries(rawLists: unknown): CharacterHomebrewEntry[] {
  if (!Array.isArray(rawLists)) return [];
  const entries: CharacterHomebrewEntry[] = [];
  rawLists.forEach((list, listIndex) => {
    const listRecord = asRecord(list);
    const listId = toTrimmedString(listRecord.id) || `legacy-spell-list-${listIndex}`;
    const listTitle = toTrimmedString(listRecord.title);
    const spells = Array.isArray(listRecord.spells) ? listRecord.spells : [];
    spells.forEach((spell, spellIndex) => {
      const name = toTrimmedString(spell);
      if (!name) return;
      entries.push({
        id: `legacy-spell-${listId}-${spellIndex}`,
        kind: 'spell',
        name,
        description: listTitle ? `Із застарілого списку заклять: ${listTitle}` : 'Перенесено із застарілого списку заклять',
        tags: listTitle ? [listTitle] : [],
      });
    });
  });
  return entries;
}

function normalizeLegacyFeatureEntries(rawBlocks: unknown): CharacterHomebrewEntry[] {
  if (!Array.isArray(rawBlocks)) return [];
  const entries: CharacterHomebrewEntry[] = [];
  rawBlocks.forEach((block, blockIndex) => {
    const blockRecord = asRecord(block);
    const blockId = toTrimmedString(blockRecord.id) || `legacy-feature-block-${blockIndex}`;
    const blockTitle = toTrimmedString(blockRecord.title);
    const featureEntries = Array.isArray(blockRecord.entries) ? blockRecord.entries : [];
    featureEntries.forEach((entry, entryIndex) => {
      const name = toTrimmedString(entry);
      if (!name) return;
      entries.push({
        id: `legacy-feature-${blockId}-${entryIndex}`,
        kind: 'ability',
        name,
        description: blockTitle
          ? `Із застарілого блоку особливостей: ${blockTitle}`
          : 'Перенесено із застарілого блоку особливостей',
        tags: blockTitle ? [blockTitle] : [],
      });
    });
  });
  return entries;
}

function mergeUniqueById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  list.forEach((item) => {
    if (!item?.id || seen.has(item.id)) return;
    seen.add(item.id);
    out.push(item);
  });
  return out;
}

function normalizeHomebrewDraft(input: unknown): HomebrewEntitySlice {
  const record = asRecord(input);
  const customTrackers = Array.isArray(record.customTrackers)
    ? record.customTrackers.map((item, index) => normalizeTracker(item, index)).filter((item): item is CharacterTracker => Boolean(item))
    : [];
  const customResources = Array.isArray(record.customResources)
    ? record.customResources
        .map((item, index) => normalizeResource(item, index))
        .filter((item): item is CharacterCustomResource => Boolean(item))
    : [];
  const resourcesFromTrackers = customTrackers.map(trackerToResource);
  const mergedResources = mergeUniqueById([...customResources, ...resourcesFromTrackers]);

  const notesBlocksRecord = asRecord(record.notesBlocks);
  const notesBlocks: NonNullable<HomebrewDraft['notesBlocks']> = {
    session: toString(notesBlocksRecord.session, ''),
    campaign: toString(notesBlocksRecord.campaign, ''),
    goals: toString(notesBlocksRecord.goals, ''),
    relationships: toString(notesBlocksRecord.relationships, ''),
    quests: toString(notesBlocksRecord.quests, ''),
  };

  const notesGroups = Array.isArray(record.customNotesGroups)
    ? record.customNotesGroups
        .map((item, index) => normalizeNotesGroup(item, index))
        .filter((item): item is CharacterCustomNotesGroup => Boolean(item))
        .sort((a, b) => a.order - b.order)
    : [];
  const canonicalNotesGroups = notesGroups.length ? notesGroups : buildSeededNotesGroups(notesBlocks);

  const customEntries = Array.isArray(record.homebrewEntries)
    ? record.homebrewEntries
        .map((item, index) => normalizeHomebrewEntry(item, index))
        .filter((item): item is CharacterHomebrewEntry => Boolean(item))
    : [];
  const legacyEntries = [
    ...normalizeLegacySpellListEntries(record.customSpellLists),
    ...normalizeLegacyFeatureEntries(record.customFeatureBlocks),
  ];
  const canonicalEntries = mergeUniqueById([...customEntries, ...legacyEntries]);

  const customFields = Array.isArray(record.customFields)
    ? record.customFields
        .map((item, index) => normalizeCustomField(item, index))
        .filter((item): item is CharacterCustomField => Boolean(item))
    : [];

  const customSections = Array.isArray(record.customSections)
    ? record.customSections
        .map((item, index) => normalizeCustomSection(item, index))
        .filter((item): item is CharacterCustomSection => Boolean(item))
    : [];

  const customResetRules = Array.isArray(record.customResetRules)
    ? record.customResetRules
        .map((item, index) => normalizeCustomResetRule(item, index))
        .filter((item): item is CharacterCustomResetRule => Boolean(item))
    : [];

  return {
    characterTemplateId: selectTemplateId(record.characterTemplateId),
    customFields,
    customTrackers: [],
    customSections,
    customResources: mergedResources,
    customResetRules,
    customNotesGroups: canonicalNotesGroups,
    homebrewEntries: canonicalEntries,
    customSpellLists: [],
    customFeatureBlocks: [],
    notesBlocks: undefined,
  };
}

export const homebrewSchema: z.ZodType<HomebrewEntitySlice> = z.any().transform((value) => normalizeHomebrewDraft(value));

export function parseHomebrew(input: unknown): HomebrewEntitySlice {
  return homebrewSchema.parse(input);
}

export function safeParseHomebrew(input: unknown) {
  return safeParseWithIssues(homebrewSchema, input);
}

export function normalizeHomebrew(input: unknown): HomebrewEntitySlice {
  return parseHomebrew(input);
}
