import { describe, expect, it } from 'vitest';
import {
  applyDerivedDefaults,
  applyStartMethod,
  buildBackgroundMechanics,
  buildCharacterFromDraft,
  createInitialDraft,
  deriveDraftDefaults,
  formatAbilityModifier,
  rollAbilityScore,
  rollAllAbilityScores,
  shouldShowMagicStep,
} from './createCharacterWizard';

describe('createCharacterWizard helpers', () => {
  it('formats ability modifiers', () => {
    expect(formatAbilityModifier(15)).toBe('+2');
    expect(formatAbilityModifier(8)).toBe('-1');
  });

  it('derives proficiency bonus by level', () => {
    expect(deriveDraftDefaults({ ...createInitialDraft(), level: '1' }).defaultProficiencyBonus).toBe(2);
    expect(deriveDraftDefaults({ ...createInitialDraft(), level: '5' }).defaultProficiencyBonus).toBe(3);
    expect(deriveDraftDefaults({ ...createInitialDraft(), level: '9' }).defaultProficiencyBonus).toBe(4);
    expect(deriveDraftDefaults({ ...createInitialDraft(), level: '13' }).defaultProficiencyBonus).toBe(5);
    expect(deriveDraftDefaults({ ...createInitialDraft(), level: '17' }).defaultProficiencyBonus).toBe(6);
  });

  it('applies background mechanics to skills, tools, languages, and features', () => {
    const mechanics = buildBackgroundMechanics('sage');

    expect(mechanics.skillProficiencies.arcana).toBe('proficient');
    expect(mechanics.skillProficiencies.history).toBe('proficient');
    expect(mechanics.proficiencies).toContain('Мови: +2');
    expect(mechanics.featureText).toContain('Дослідник знань');
  });

  it('shows magic for casters or explicit magic toggle', () => {
    expect(shouldShowMagicStep({ ...createInitialDraft(), selectedClass: 'wizard', magicEnabled: false })).toBe(true);
    expect(shouldShowMagicStep({ ...createInitialDraft(), selectedClass: 'fighter', magicEnabled: false })).toBe(false);
    expect(shouldShowMagicStep({ ...createInitialDraft(), selectedClass: 'fighter', magicEnabled: true })).toBe(true);
  });

  it('rolls ability scores with 4d6 drop lowest', () => {
    const values = [0, 0.5, 0.99, 0.16];
    const result = rollAbilityScore(() => values.shift() ?? 0);

    expect(result.rolls).toEqual([1, 4, 6, 1]);
    expect(result.kept).toEqual([1, 4, 6]);
    expect(result.dropped).toBe(1);
    expect(result.total).toBe(11);
    expect(result.detail).toContain('відкинуто 1');
  });

  it('generates all random ability scores', () => {
    const result = rollAllAbilityScores(() => 0.99);

    expect(Object.values(result.stats)).toEqual(['18', '18', '18', '18', '18', '18']);
    expect(result.details.strength).toContain('залишено 6 + 6 + 6');
  });

  it('maps draft into a character entity', () => {
    const draft = applyDerivedDefaults(
      applyStartMethod({
        ...createInitialDraft(),
        name: 'Arthas',
        selectedClass: 'paladin',
        raceKey: 'human',
        backgroundKey: 'soldier',
        ac: '18',
        hpMax: '12',
        hpCurrent: '12',
        storageMode: 'local-cloud',
        shareTarget: 'dm',
        inviteEmail: 'dm@example.com',
      }, 'standard-5e'),
      { forceCombat: true, forceEquipment: true },
    );

    const character = buildCharacterFromDraft(draft, 'local-id');

    expect(character.name).toBe('Arthas');
    expect(character.class).toBe('paladin');
    expect(character.hp.max).toBeGreaterThan(0);
    expect(character.ac).toBe(18);
    expect(character.speed).toBeGreaterThan(0);
    expect(character.spells.spellcastingAbility).toBe('charisma');
    expect(character.inventory.length).toBeGreaterThan(0);
    expect(character.skillProficiencies?.athletics).toBe('proficient');
  });
});
