import type { CharacterCustomResource, CharacterEntity, CharacterHomebrewEntry, CharacterTemplateId } from '@/domain/types';

type HomebrewTemplatePreset = {
  id: CharacterTemplateId;
  title: string;
  description: string;
  resources: CharacterCustomResource[];
  sections: CharacterEntity['customSections'];
  entries: CharacterHomebrewEntry[];
};

const mkId = (prefix: string, index: number): string => `${prefix}-${index + 1}`;

const BASE_PRESETS: HomebrewTemplatePreset[] = [
  {
    id: 'standard-5e',
    title: 'Standard 5e',
    description: 'Класичний лист без homebrew prefill.',
    resources: [],
    sections: [],
    entries: [],
  },
  {
    id: 'homebrew-light',
    title: 'Homebrew Light',
    description: 'Легке розширення: пара ресурсів і секцій.',
    resources: [
      { id: mkId('hb-light-res', 0), label: 'Focus', current: 3, max: 3, resetRule: 'long-rest' },
      { id: mkId('hb-light-res', 1), label: 'Momentum', current: 1, max: 2, resetRule: 'short-rest' },
    ],
    sections: [
      { id: mkId('hb-light-sec', 0), title: 'House Rules', content: '' },
      { id: mkId('hb-light-sec', 1), title: 'Custom Mechanics', content: '' },
    ],
    entries: [],
  },
  {
    id: 'homebrew-heavy',
    title: 'Homebrew Heavy',
    description: 'Розширений старт з ресурсами, секціями і порожніми homebrew entries.',
    resources: [
      { id: mkId('hb-heavy-res', 0), label: 'Resolve', current: 4, max: 4, resetRule: 'long-rest' },
      { id: mkId('hb-heavy-res', 1), label: 'Technique Dice', current: 2, max: 2, resetRule: 'short-rest' },
      { id: mkId('hb-heavy-res', 2), label: 'Danger', current: 0, max: 6, resetRule: 'session' },
    ],
    sections: [
      { id: mkId('hb-heavy-sec', 0), title: 'Subsystem: Crafting', content: '' },
      { id: mkId('hb-heavy-sec', 1), title: 'Subsystem: Downtime', content: '' },
    ],
    entries: [
      { id: mkId('hb-heavy-entry', 0), kind: 'spell', name: 'Custom Spell', description: '', tags: [] },
      { id: mkId('hb-heavy-entry', 1), kind: 'ability', name: 'Custom Ability', description: '', tags: [] },
      { id: mkId('hb-heavy-entry', 2), kind: 'feat', name: 'Custom Feat', description: '', tags: [] },
    ],
  },
  {
    id: 'caster',
    title: 'Caster',
    description: 'Профіль для кастер-орієнтованих homebrew кампаній.',
    resources: [
      { id: mkId('caster-res', 0), label: 'Arcane Charges', current: 3, max: 3, resetRule: 'long-rest' },
      { id: mkId('caster-res', 1), label: 'Ritual Uses', current: 1, max: 2, resetRule: 'short-rest' },
    ],
    sections: [{ id: mkId('caster-sec', 0), title: 'Spell Tweaks', content: '' }],
    entries: [{ id: mkId('caster-entry', 0), kind: 'spell', name: 'Custom Spell', description: '', tags: ['caster'] }],
  },
  {
    id: 'martial',
    title: 'Martial',
    description: 'Профіль для martial-орієнтованих homebrew кампаній.',
    resources: [
      { id: mkId('martial-res', 0), label: 'Stamina', current: 4, max: 4, resetRule: 'short-rest' },
      { id: mkId('martial-res', 1), label: 'Combo', current: 0, max: 3, resetRule: 'none' },
    ],
    sections: [{ id: mkId('martial-sec', 0), title: 'Maneuver Notes', content: '' }],
    entries: [
      { id: mkId('martial-entry', 0), kind: 'ability', name: 'Custom Maneuver', description: '', tags: ['martial'] },
      { id: mkId('martial-entry', 1), kind: 'feat', name: 'Custom Feat', description: '', tags: ['martial'] },
    ],
  },
  {
    id: 'custom-blank',
    title: 'Custom Blank',
    description: 'Майже порожній старт під власну систему.',
    resources: [],
    sections: [],
    entries: [],
  },
];

export const CHARACTER_TEMPLATE_PRESETS = BASE_PRESETS;

function cloneResource(resource: CharacterCustomResource, index: number): CharacterCustomResource {
  return {
    ...resource,
    id: `${resource.id}-${Date.now()}-${index}`,
  };
}

function cloneSection(
  section: NonNullable<CharacterEntity['customSections']>[number],
  index: number,
): NonNullable<CharacterEntity['customSections']>[number] {
  return {
    ...section,
    id: `${section.id}-${Date.now()}-${index}`,
  };
}

function cloneEntry(entry: CharacterHomebrewEntry, index: number): CharacterHomebrewEntry {
  return {
    ...entry,
    id: `${entry.id}-${Date.now()}-${index}`,
    tags: [...entry.tags],
  };
}

export function buildTemplatePatch(
  templateId: CharacterTemplateId,
): Pick<CharacterEntity, 'characterTemplateId' | 'customResources' | 'customSections' | 'homebrewEntries'> {
  const preset = CHARACTER_TEMPLATE_PRESETS.find((item) => item.id === templateId) || CHARACTER_TEMPLATE_PRESETS[0];
  return {
    characterTemplateId: preset.id,
    customResources: preset.resources.map(cloneResource),
    customSections: preset.sections?.map(cloneSection) || [],
    homebrewEntries: preset.entries.map(cloneEntry),
  };
}
