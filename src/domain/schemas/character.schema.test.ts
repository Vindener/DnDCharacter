import { describe, expect, it } from 'vitest';
import { parseCharacter } from '@/domain/schemas';
import { LATEST_SCHEMA_VERSION } from '@/domain/migrations';

describe('character.schema', () => {
  it('normalizes legacy death save fields and defaults', () => {
    const parsed = parseCharacter({
      id: 'char-1',
      name: 'Aria',
      deathSaves: { success: 2, fail: 1 },
      hp: { current: 7, max: 12 },
      inventory: ['rope', '', 'torch'],
    });

    expect(parsed.id).toBe('char-1');
    expect(parsed.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(parsed.deathSaves).toEqual({ successes: 2, failures: 1 });
    expect(parsed.hp).toEqual({ current: 7, max: 12, temp: 0 });
    expect(parsed.speed).toBe(30);
    expect(parsed.ac).toBe(10);
    expect(parsed.inventory).toEqual(['rope', 'torch']);
  });

  it('normalizes homebrew slice and migrates legacy trackers', () => {
    const parsed = parseCharacter({
      id: 'char-2',
      name: 'Brom',
      customTrackers: [{ id: 'trk-1', label: 'Mana', current: 2, max: 5, resetRule: 'none' }],
      customResources: [{ id: 'res-1', label: 'Ki', current: 1, max: 4, resetRule: 'none' }],
      customSpellLists: [{ id: 'list-1', title: 'Circle', spells: ['Moon Beam'] }],
    });

    expect(parsed.customTrackers).toEqual([]);
    expect(parsed.customResources.some((resource) => resource.id === 'trk-1')).toBe(true);
    expect(parsed.homebrewEntries.some((entry) => entry.id === 'legacy-spell-list-1-0')).toBe(true);
  });

  it('keeps old numeric skills while accepting optional skill metadata and equipment', () => {
    const parsed = parseCharacter({
      id: 'char-3',
      name: 'Nia',
      skills: { stealth: 4, perception: 5 },
      skillProficiencies: {
        stealth: 'expertise',
        perception: 'half',
        arcana: 'invalid',
      },
      equipment: {
        armor: 'Leather',
        shield: 'Buckler',
        attunedItems: ['Ring', '', 'Ring'],
        carryingCapacity: 150,
      },
    });

    expect(parsed.skills.stealth).toBe(4);
    expect(parsed.skills.perception).toBe(5);
    expect(parsed.skillProficiencies).toEqual({ stealth: 'expertise', perception: 'half' });
    expect(parsed.equipment).toEqual({
      armor: 'Leather',
      shield: 'Buckler',
      attunedItems: ['Ring'],
      carryingCapacity: 150,
    });
  });
});
