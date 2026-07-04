import { describe, expect, it } from 'vitest';
import type { MonsterDto } from '@/types/Monster';
import { DEFAULT_BESTIARY_FILTERS, filterMonsters } from './bestiaryFilters';

const monsters: MonsterDto[] = [
  {
    id: 'goblin',
    name: 'Goblin',
    size: 'Small',
    type: 'Humanoid',
    challenge: '1/4 (50 XP)',
    armorClass: 15,
    hitPoints: 7,
    speed: '30 ft.',
    environment: 'Forest',
    source: 'user-custom',
    license: 'custom',
    tags: ['goblinoid'],
    actions: '**Scimitar.** Melee Weapon Attack: +4 to hit. Hit: 1d6+2.',
    stats: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
  },
  {
    id: 'dragon',
    name: 'Young Red Dragon',
    size: 'Large',
    type: 'Dragon',
    challenge: '10 (5,900 XP)',
    armorClass: 18,
    hitPoints: 178,
    speed: '40 ft., fly 80 ft.',
    environment: 'Mountain',
    source: 'srd-5.1',
    license: 'ogl-1.0a',
    legendaryActions: 'Detect. The dragon makes a Wisdom check.',
    stats: { strength: 23, dexterity: 10, constitution: 21, intelligence: 14, wisdom: 11, charisma: 19 },
  },
];

describe('bestiaryFilters', () => {
  it('searches monster name, type, source, tags, and action text', () => {
    expect(filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, search: 'scimitar' }, [])).toHaveLength(1);
    expect(filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, search: 'dragon' }, [])[0].id).toBe('dragon');
    expect(filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, search: 'user-custom' }, [])[0].id).toBe('goblin');
    expect(filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, search: 'goblinoid' }, [])[0].id).toBe('goblin');
  });

  it('filters by CR and type', () => {
    expect(filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, cr: '0-1' }, []).map((monster) => monster.id)).toEqual(['goblin']);
    expect(filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, cr: '5-10' }, []).map((monster) => monster.id)).toEqual(['dragon']);
    expect(filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, type: 'Dragon' }, []).map((monster) => monster.id)).toEqual(['dragon']);
  });

  it('filters by size, source, environment, and favorites', () => {
    expect(filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, size: 'Small' }, []).map((monster) => monster.id)).toEqual(['goblin']);
    expect(filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, source: 'srd-5.1' }, []).map((monster) => monster.id)).toEqual(['dragon']);
    expect(filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, environment: 'Forest' }, []).map((monster) => monster.id)).toEqual(['goblin']);
    expect(filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, favoritesOnly: true }, ['dragon']).map((monster) => monster.id)).toEqual(['dragon']);
  });

  it('returns no results when filters conflict', () => {
    const result = filterMonsters(monsters, { ...DEFAULT_BESTIARY_FILTERS, type: 'Dragon', environment: 'Forest' }, []);

    expect(result).toEqual([]);
  });
});
