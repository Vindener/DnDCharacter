import { describe, expect, it } from 'vitest';
import { dtoToEntity, entityToDto } from '@/domain/mappers/homebrew.mapper';

describe('homebrew.mapper migration and roundtrip', () => {
  it('migrates trackers, notesBlocks and legacy entries', () => {
    const mapped = dtoToEntity({
      characterTemplateId: 'standard-5e',
      customTrackers: [{ id: 'res-1', label: 'Ki', current: 3, max: 5, resetRule: 'none' }],
      customResources: [{ id: 'res-1', label: 'Ki Local', current: 2, max: 4, resetRule: 'none' }],
      notesBlocks: {
        session: 'session note',
        campaign: 'campaign note',
        goals: '',
        relationships: '',
        quests: '',
      },
      customSpellLists: [{ id: 'list-a', title: 'Circle', spells: ['Moon Beam', ''] }],
      customFeatureBlocks: [{ id: 'feat-a', title: 'Class Features', entries: ['Rage'] }],
      homebrewEntries: [{ id: 'legacy-spell-list-a-0', kind: 'spell', name: 'Moon Beam', description: 'override', tags: [] }],
    });

    expect(mapped.characterTemplateId).toBe('standard-5e');
    expect(mapped.customTrackers).toEqual([]);
    expect(mapped.customResources).toHaveLength(1);
    expect(mapped.customResources[0]).toMatchObject({ id: 'res-1', label: 'Ki Local', current: 2, max: 4 });

    expect(mapped.customNotesGroups.map((g) => g.id)).toEqual([
      'seed-session',
      'seed-campaign',
      'seed-goals',
      'seed-relationships',
      'seed-quests',
    ]);
    expect(mapped.customNotesGroups[0].content).toBe('session note');

    expect(mapped.homebrewEntries.find((entry) => entry.id === 'legacy-spell-list-a-0')).toBeTruthy();
    expect(mapped.homebrewEntries.find((entry) => entry.id === 'legacy-feature-feat-a-0')).toBeTruthy();
    expect(mapped.homebrewEntries.filter((entry) => entry.id === 'legacy-spell-list-a-0')).toHaveLength(1);
  });

  it('keeps canonical shape stable in entityToDto -> dtoToEntity roundtrip', () => {
    const canonical = dtoToEntity({
      characterTemplateId: 'custom-blank',
      customFields: [{ id: 'field-1', label: 'Renown', type: 'number', value: '5' }],
      customResources: [{ id: 'res-2', label: 'Grit', current: 1, max: 3, resetRule: 'none' }],
      customNotesGroups: [{ id: 'custom-1', title: 'Journal', content: 'Entry', order: 0, origin: 'custom' }],
      homebrewEntries: [{ id: 'entry-1', kind: 'feat', name: 'Custom Feat', description: 'Desc', tags: ['feat'] }],
    });

    const dto = entityToDto(canonical);
    const roundtrip = dtoToEntity(dto);

    expect(roundtrip).toEqual(canonical);
  });
});
