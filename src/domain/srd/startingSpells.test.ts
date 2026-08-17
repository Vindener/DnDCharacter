import { describe, expect, it } from 'vitest';
import { getClassLevel1SpellMode, getEligibleLevel1Spells, getSuggestedStartingSpells } from './startingSpells';

describe('startingSpells', () => {
  it('suggests the SRD level-1 cantrip/spell counts for known casters', () => {
    const bard = getSuggestedStartingSpells('Bard', 'en');
    expect(bard.mode).toBe('known');
    expect(bard.cantrips).toHaveLength(2);
    expect(bard.spells).toHaveLength(4);

    const wizard = getSuggestedStartingSpells('Wizard', 'en');
    expect(wizard.mode).toBe('known');
    expect(wizard.cantrips).toHaveLength(3);
    expect(wizard.spells).toHaveLength(6);
  });

  it('suggests spells for prepared casters without a fixed "known" list', () => {
    const cleric = getSuggestedStartingSpells('Cleric', 'en');
    expect(cleric.mode).toBe('prepared');
    expect(cleric.cantrips).toHaveLength(3);
    expect(cleric.spells).toHaveLength(2);
  });

  it('suggests zero cantrips/spells for half-casters that only get spellcasting at level 2', () => {
    expect(getSuggestedStartingSpells('Paladin', 'en')).toEqual({ mode: 'prepared', cantrips: [], spells: [] });
    expect(getSuggestedStartingSpells('Ranger', 'en')).toEqual({ mode: 'known', cantrips: [], spells: [] });
  });

  it('suggests nothing for a non-caster or unknown class name', () => {
    expect(getSuggestedStartingSpells('Barbarian', 'en')).toEqual({ mode: 'none', cantrips: [], spells: [] });
    expect(getClassLevel1SpellMode('Barbarian')).toBe('none');
  });

  it('localizes suggested spell names to Ukrainian', () => {
    const wizard = getSuggestedStartingSpells('Wizard', 'uk');
    wizard.cantrips.forEach((name) => expect(name).not.toMatch(/[A-Za-z]{2}/));
    wizard.spells.forEach((name) => expect(name).not.toMatch(/[A-Za-z]{2}/));
  });

  it('exposes the full eligible level-1 list for the spell-picker modal, not just the suggested subset', () => {
    const { cantrips, leveled } = getEligibleLevel1Spells('Wizard', 'en');
    expect(cantrips.length).toBeGreaterThan(3);
    expect(leveled.length).toBeGreaterThan(6);
    cantrips.forEach((option) => {
      expect(option.id).toBeTruthy();
      expect(option.name).toBeTruthy();
    });
  });

  it('returns an empty eligible list for a non-caster class', () => {
    expect(getEligibleLevel1Spells('Barbarian', 'en')).toEqual({ cantrips: [], leveled: [] });
  });

  it('exposes the eligible level-1 spell list for half-casters so a level 2+ Paladin/Ranger can be built by hand', () => {
    const paladin = getEligibleLevel1Spells('Paladin', 'en');
    expect(paladin.cantrips).toEqual([]);
    expect(paladin.leveled.length).toBeGreaterThan(0);

    const ranger = getEligibleLevel1Spells('Ranger', 'en');
    expect(ranger.cantrips).toEqual([]);
    expect(ranger.leveled.length).toBeGreaterThan(0);
  });
});
