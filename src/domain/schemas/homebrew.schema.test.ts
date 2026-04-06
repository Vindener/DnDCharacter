import { describe, expect, it } from 'vitest';
import { parseHomebrew } from '@/domain/schemas';

describe('homebrew.schema', () => {
  it('normalizes resources, notes groups and legacy entries', () => {
    const parsed = parseHomebrew({
      characterTemplateId: 'custom-blank',
      customTrackers: [{ id: 'trk-1', label: 'Ki', current: 3, max: 5, resetRule: 'none' }],
      customResources: [{ id: 'res-1', label: 'Rage', current: 1, max: 2, resetRule: 'long-rest' }],
      notesBlocks: {
        session: 'session note',
        campaign: 'campaign note',
      },
      customSpellLists: [{ id: 'list-a', title: 'Circle', spells: ['Moon Beam', ''] }],
      customFeatureBlocks: [{ id: 'feat-a', title: 'Class Features', entries: ['Rage'] }],
      customSections: [{ id: 'section-1', title: 'Custom', content: 'Text' }],
    });

    expect(parsed.characterTemplateId).toBe('custom-blank');
    expect(parsed.customTrackers).toEqual([]);
    expect(parsed.customResources.some((resource) => resource.id === 'trk-1')).toBe(true);
    expect(parsed.customNotesGroups.map((group) => group.id)).toEqual([
      'seed-session',
      'seed-campaign',
      'seed-goals',
      'seed-relationships',
      'seed-quests',
    ]);
    expect(parsed.homebrewEntries.find((entry) => entry.id === 'legacy-spell-list-a-0')).toBeTruthy();
    expect(parsed.homebrewEntries.find((entry) => entry.id === 'legacy-feature-feat-a-0')).toBeTruthy();
    expect(parsed.customSections).toHaveLength(1);
  });
});
