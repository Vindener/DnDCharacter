import type {
  CharacterCustomField,
  CharacterCustomNotesGroup,
  CharacterCustomResource,
  CharacterDto,
  CharacterEntity,
  CharacterHomebrewEntry,
  CharacterTracker,
  CustomFieldType,
} from '@/domain/types';

type HomebrewEntitySlice = Pick<
  CharacterEntity,
  | 'characterTemplateId'
  | 'customFields'
  | 'customTrackers'
  | 'customResources'
  | 'customNotesGroups'
  | 'homebrewEntries'
  | 'customSpellLists'
  | 'customFeatureBlocks'
  | 'notesBlocks'
>;

type HomebrewDraft = Partial<HomebrewEntitySlice>;

const NOTE_GROUP_SEED: Array<{ key: keyof NonNullable<HomebrewEntitySlice['notesBlocks']>; title: string; order: number }> = [
  { key: 'session', title: 'Сесія', order: 0 },
  { key: 'campaign', title: 'Кампанія', order: 1 },
  { key: 'goals', title: 'Цілі', order: 2 },
  { key: 'relationships', title: 'Зв’язки', order: 3 },
  { key: 'quests', title: 'Квести', order: 4 },
];

const FIELD_TYPES: CustomFieldType[] = ['text', 'number', 'boolean', 'select'];

function coerceFieldValue(type: CustomFieldType, value: unknown, options?: string[]): string | number | boolean {
  if (type === 'number') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (type === 'boolean') {
    if (typeof value === 'boolean') return value;
    const text = String(value || '').toLowerCase();
    return text === 'true' || text === '1' || text === 'yes';
  }

  if (type === 'select') {
    const safeOptions = Array.isArray(options) ? options.filter(Boolean) : [];
    const current = String(value ?? '');
    if (!safeOptions.length) return current;
    return safeOptions.includes(current) ? current : safeOptions[0];
  }

  return String(value ?? '');
}

function normalizeCustomField(field: CharacterCustomField): CharacterCustomField {
  const nextType: CustomFieldType = FIELD_TYPES.includes(field.type) ? field.type : 'text';
  const safeOptions =
    nextType === 'select' ? (field.options || []).map((entry) => String(entry || '').trim()).filter(Boolean) : undefined;

  return {
    ...field,
    type: nextType,
    options: safeOptions,
    value: coerceFieldValue(nextType, field.value, safeOptions),
  };
}

function normalizeResource(resource: CharacterCustomResource): CharacterCustomResource {
  return {
    ...resource,
    current: Math.max(0, Number(resource.current) || 0),
    max: typeof resource.max === 'number' ? Math.max(0, resource.max) : undefined,
  };
}

function trackerToResource(tracker: CharacterTracker): CharacterCustomResource {
  return normalizeResource({
    id: tracker.id || `${Date.now()}-${Math.random()}`,
    label: tracker.label || 'Ресурс',
    current: tracker.current ?? 0,
    max: tracker.max,
    resetRule: tracker.resetRule || 'none',
    visibility: tracker.visibility,
    color: tracker.color,
  });
}

function buildSeededNotesGroups(notes: HomebrewEntitySlice['notesBlocks']): CharacterCustomNotesGroup[] {
  return NOTE_GROUP_SEED.map((seed) => ({
    id: `seed-${seed.key}`,
    title: seed.title,
    content: String(notes?.[seed.key] || ''),
    order: seed.order,
    origin: 'seeded',
  }));
}

function normalizeNotesGroups(groups: HomebrewEntitySlice['customNotesGroups']): CharacterCustomNotesGroup[] {
  if (!Array.isArray(groups) || !groups.length) return [];

  return groups
    .map((group, index) => ({
      id: String(group.id || `notes-group-${index}`),
      title: String(group.title || `Група ${index + 1}`),
      content: String(group.content || ''),
      order: typeof group.order === 'number' ? group.order : index,
      origin: (group.origin === 'custom' ? 'custom' : 'seeded') as CharacterCustomNotesGroup['origin'],
    }))
    .sort((a, b) => a.order - b.order);
}

function legacyToEntries(character: HomebrewDraft): CharacterHomebrewEntry[] {
  const entries: CharacterHomebrewEntry[] = [];

  (character.customSpellLists || []).forEach((list) => {
    (list.spells || []).forEach((spell, index) => {
      const name = String(spell || '').trim();
      if (!name) return;
      entries.push({
        id: `legacy-spell-${list.id}-${index}`,
        kind: 'spell',
        name,
        description: list.title
          ? `Із застарілого списку заклять: ${list.title}`
          : 'Перенесено із застарілого списку заклять',
        tags: list.title ? [list.title] : [],
      });
    });
  });

  (character.customFeatureBlocks || []).forEach((block) => {
    (block.entries || []).forEach((entry, index) => {
      const name = String(entry || '').trim();
      if (!name) return;
      entries.push({
        id: `legacy-feature-${block.id}-${index}`,
        kind: 'ability',
        name,
        description: block.title
          ? `Із застарілого блоку особливостей: ${block.title}`
          : 'Перенесено із застарілого блоку особливостей',
        tags: block.title ? [block.title] : [],
      });
    });
  });

  return entries;
}

function normalizeHomebrewEntries(entries: HomebrewEntitySlice['homebrewEntries']): CharacterHomebrewEntry[] {
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry, index) => ({
      id: String(entry.id || `homebrew-entry-${index}`),
      kind: (entry.kind === 'spell' || entry.kind === 'feat' ? entry.kind : 'ability') as CharacterHomebrewEntry['kind'],
      name: String(entry.name || '').trim(),
      description: String(entry.description || ''),
      tags: Array.isArray(entry.tags) ? entry.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [],
      activation: entry.activation,
      linkedResourceId: entry.linkedResourceId || undefined,
    }))
    .filter((entry) => entry.name.length > 0);
}

function mergeUniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];

  items.forEach((item) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    out.push(item);
  });

  return out;
}

export function dtoToEntity(dto: HomebrewDraft): HomebrewEntitySlice {
  const resourcesFromTrackers = (dto.customTrackers || []).map(trackerToResource);
  const canonicalResources = mergeUniqueById([...(dto.customResources || []).map(normalizeResource), ...resourcesFromTrackers]);

  const notesGroups = normalizeNotesGroups(dto.customNotesGroups);
  const canonicalNotesGroups = notesGroups.length ? notesGroups : buildSeededNotesGroups(dto.notesBlocks);

  const canonicalEntries = mergeUniqueById([...normalizeHomebrewEntries(dto.homebrewEntries), ...legacyToEntries(dto)]);

  const canonicalFields = (dto.customFields || []).map(normalizeCustomField);

  return {
    characterTemplateId: dto.characterTemplateId || 'standard-5e',
    customFields: canonicalFields,
    customResources: canonicalResources,
    customTrackers: [],
    customNotesGroups: canonicalNotesGroups,
    homebrewEntries: canonicalEntries,
    customSpellLists: [],
    customFeatureBlocks: [],
    notesBlocks: undefined,
  };
}

export function entityToDto(entity: HomebrewEntitySlice): Pick<
  CharacterDto,
  | 'characterTemplateId'
  | 'customFields'
  | 'customTrackers'
  | 'customResources'
  | 'customNotesGroups'
  | 'homebrewEntries'
  | 'customSpellLists'
  | 'customFeatureBlocks'
  | 'notesBlocks'
> {
  return dtoToEntity(entity);
}

export function draftToEntity(draft: HomebrewDraft): HomebrewEntitySlice {
  return dtoToEntity(draft);
}
