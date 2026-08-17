import { describe, expect, it } from 'vitest';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import type { SpellbookSpell } from '@/types/Spellbook';
import { filterSpellbookSpells, type SpellbookFilterOptions } from './spellbookFilters';

const baseSpell = (patch: Partial<SpellbookSpell>): SpellbookSpell => ({
  id: 'spell',
  name: 'Spell',
  level: 1,
  school: 'Evocation',
  castingTime: '1 action',
  range: '60 feet',
  components: { verbal: true, somatic: true, material: '' },
  duration: 'Instantaneous',
  description: 'A spell.',
  higherLevels: '',
  classes: ['Wizard'],
  tags: ['spell'],
  ritual: false,
  concentration: false,
  damageProfiles: [],
  source: 'srd-5.1',
  license: 'ogl-1.0a',
  createdAt: 0,
  updatedAt: 0,
  ...patch,
});

const spells: SpellbookSpell[] = [
  baseSpell({
    id: 'magic-missile',
    name: 'Magic Missile',
    level: 1,
    school: 'Evocation',
    classes: ['Wizard'],
    description: 'Force darts.',
  }),
  baseSpell({
    id: 'detect-magic',
    name: 'Detect Magic',
    level: 1,
    school: 'Divination',
    classes: ['Wizard', 'Cleric'],
    ritual: true,
    concentration: true,
  }),
  baseSpell({
    id: 'custom-flare',
    name: 'Custom Flare',
    level: 2,
    school: 'Custom',
    classes: ['Bard'],
    source: 'user-custom',
    license: 'custom',
  }),
];

const character = createEmptyCharacter({
  spells: {
    spellcastingAbility: 'int',
    spellSaveDC: 13,
    spellAttackBonus: 5,
    spellSlots: {},
    knownSpells: ['Magic Missile'],
    preparedSpells: ['Detect Magic'],
    cantrips: [],
  },
});

function run(patch: Partial<SpellbookFilterOptions>) {
  return filterSpellbookSpells({
    spells,
    search: '',
    activeTab: 'all',
    levelFilter: 'all',
    classFilter: 'all',
    schoolFilter: 'all',
    ritualFilter: 'all',
    concentrationFilter: 'all',
    favoriteSpellIds: [],
    pinnedSpellIds: [],
    selectedCharacter: character,
    isGmMode: false,
    locale: 'en',
    ...patch,
  }).map((spell) => spell.id);
}

describe('spellbookFilters', () => {
  it('filters by search, level, school, class, ritual, and concentration', () => {
    expect(run({ search: 'force darts' })).toEqual(['magic-missile']);
    expect(run({ levelFilter: 2 })).toEqual(['custom-flare']);
    expect(run({ schoolFilter: 'Divination' })).toEqual(['detect-magic']);
    expect(run({ classFilter: 'Bard' })).toEqual(['custom-flare']);
    expect(run({ ritualFilter: 'yes' })).toEqual(['detect-magic']);
    expect(run({ concentrationFilter: 'yes' })).toEqual(['detect-magic']);
  });

  it('searches built-in spells by their Ukrainian translation', () => {
    expect(run({ search: 'чарівна ракета', locale: 'uk' })).toEqual(['magic-missile']);
  });

  it('filters favorites, custom spells, known spells, and prepared spells', () => {
    expect(run({ activeTab: 'favorites', favoriteSpellIds: ['custom-flare'] })).toEqual(['custom-flare']);
    expect(run({ activeTab: 'custom' })).toEqual(['custom-flare']);
    expect(run({ activeTab: 'known' })).toEqual(['magic-missile']);
    expect(run({ activeTab: 'prepared' })).toEqual(['detect-magic']);
  });

  it('matches the known/prepared tabs when the character stores the localized spell name', () => {
    // startingSpells.ts and the spell picker write the current-locale display name (e.g. the
    // Ukrainian "Чарівна ракета") into the character's free-text spell lists, while `spell.name`
    // here stays the base/English SRD name — the known/prepared tab must match on either form.
    const ukCharacter = createEmptyCharacter({
      spells: {
        spellcastingAbility: 'int',
        spellSaveDC: 13,
        spellAttackBonus: 5,
        spellSlots: {},
        knownSpells: ['Чарівна ракета'],
        preparedSpells: [],
        cantrips: [],
      },
    });

    expect(run({ activeTab: 'known', locale: 'uk', selectedCharacter: ukCharacter })).toEqual(['magic-missile']);
  });

  it('sorts pinned spells first in GM mode', () => {
    expect(run({ isGmMode: true, pinnedSpellIds: ['custom-flare'] })[0]).toBe('custom-flare');
  });
});
