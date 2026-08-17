import { describe, expect, it } from 'vitest';
import { cloudDocToDraft, cloudDocToEntity } from '@/domain/mappers/character.mapper';
import { LATEST_SCHEMA_VERSION } from '@/domain/migrations';

describe('character.mapper', () => {
  it('maps cloud docs with legacy death save fields and defaults', () => {
    const draft = cloudDocToDraft({
      id: 'c-1',
      name: 'Aria',
      deathSaves: { success: 2, fail: 1 },
      hp: { current: 7, max: 12 },
      inventory: ['rope', '', 'torch'],
    });

    expect(draft.id).toBe('c-1');
    expect(draft.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(draft.deathSaves).toEqual({ successes: 2, failures: 1 });
    expect(draft.hp).toEqual({ current: 7, max: 12, temp: 0 });
    expect(draft.speed).toBe(30);
    expect(draft.ac).toBe(10);
    expect(draft.inventory).toEqual(['rope', 'torch']);
  });

  it('normalizes migrated homebrew fields in cloudDocToEntity', () => {
    const entity = cloudDocToEntity({
      id: 'c-2',
      name: 'Brom',
      customTrackers: [{ id: 'trk-1', label: 'Mana', current: 2, max: 5, resetRule: 'none' }],
    });

    expect(entity.customTrackers).toEqual([]);
    expect(entity.customResources).toHaveLength(1);
    expect(entity.customResources[0]).toMatchObject({
      id: 'trk-1',
      label: 'Mana',
      current: 2,
      max: 5,
    });
  });

  it('maps cloud docs to canonical entity', () => {
    const entity = cloudDocToEntity({
      id: 'c-3',
      name: 'Cloud Hero',
      deathSaves: { successes: 1, failures: 0 },
      spells: {
        spellcastingAbility: 'wisdom',
      },
    });

    expect(entity.id).toBe('c-3');
    expect(entity.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(entity.name).toBe('Cloud Hero');
    expect(entity.deathSaves).toEqual({ successes: 1, failures: 0 });
    expect(entity.spells.knownSpells).toEqual([]);
    expect(entity.characterTemplateId).toBe('standard-5e');
  });
});
