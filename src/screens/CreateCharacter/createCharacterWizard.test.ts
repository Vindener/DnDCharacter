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
    const mechanics = buildBackgroundMechanics('acolyte');

    expect(mechanics.skillProficiencies.insight).toBe('proficient');
    expect(mechanics.skillProficiencies.religion).toBe('proficient');
    expect(mechanics.proficiencies).toContain('Languages: +2');
    expect(mechanics.featureText).toContain('Shelter of the Faithful');
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
      applyStartMethod(
        {
          ...createInitialDraft(),
          name: 'Arthas',
          selectedClass: 'paladin',
          raceKey: 'human',
          backgroundKey: 'acolyte',
          ac: '18',
          hpMax: '12',
          hpCurrent: '12',
          storageMode: 'local-cloud',
          shareTarget: 'dm',
          inviteEmail: 'dm@example.com',
        },
        'standard-5e',
      ),
      { forceCombat: true, forceEquipment: true },
    );

    const character = buildCharacterFromDraft(draft, 'local-id');

    expect(character.name).toBe('Arthas');
    expect(character.class).toBe('paladin');
    expect(character.classId).toBe('paladin');
    expect(character.raceId).toBe('human');
    expect(character.backgroundId).toBe('acolyte');
    expect(character.contentSources?.class?.origin).toBe('srd-5.1');
    expect(character.hp.max).toBeGreaterThan(0);
    expect(character.ac).toBe(18);
    expect(character.speed).toBeGreaterThan(0);
    expect(character.spells.spellcastingAbility).toBe('charisma');
    expect(character.inventory.length).toBeGreaterThan(0);
    expect(character.featuresAndTraits).toContain('Divine Sense');
    expect(character.featuresAndTraits?.some((item) => item.includes('Lay on Hands'))).toBe(true);
    expect(character.skillProficiencies?.insight).toBe('proficient');
  });

  it('creates valid custom/homebrew metadata without marking it as SRD', () => {
    const draft = applyDerivedDefaults(
      {
        ...createInitialDraft(),
        name: 'Gearwright',
        selectedClass: 'artificer',
        raceKey: 'human',
        backgroundKey: 'acolyte',
      },
      { forceCombat: true, forceEquipment: true },
    );

    const character = buildCharacterFromDraft(draft, 'artificer-id');

    expect(character.class).toBe('artificer');
    expect(character.classId).toBeUndefined();
    expect(character.contentSources?.class?.origin).toBe('homebrew');
    expect(character.contentSources?.class?.source).toBe('homebrew');
    expect(character.contentSources?.race?.origin).toBe('srd-5.1');
  });

  it('auto-fills starting spells for the initial draft when the default class is a caster', () => {
    const draft = { ...createInitialDraft(), selectedClass: 'wizard' };
    const filled = applyDerivedDefaults(draft, { forceMagic: true });

    expect(filled.cantripsText.split('\n').filter(Boolean)).toHaveLength(3);
    expect(filled.knownSpellsText.split('\n').filter(Boolean)).toHaveLength(6);
    expect(filled.preparedSpellsText).toBe('');
  });

  it('does not overwrite manually edited spell text on unrelated draft changes', () => {
    const wizardDraft = applyDerivedDefaults({ ...createInitialDraft(), selectedClass: 'wizard' }, { forceMagic: true });
    const edited = { ...wizardDraft, cantripsText: 'Prestidigitation' };

    const untouched = applyDerivedDefaults(edited);

    expect(untouched.cantripsText).toBe('Prestidigitation');
  });

  it('refreshes suggested spells when the class explicitly changes', () => {
    const wizardDraft = applyDerivedDefaults({ ...createInitialDraft(), selectedClass: 'wizard' }, { forceMagic: true });
    const switchedToCleric = applyDerivedDefaults({ ...wizardDraft, selectedClass: 'cleric' }, { forceMagic: true });

    expect(switchedToCleric.knownSpellsText).toBe('');
    expect(switchedToCleric.preparedSpellsText.split('\n').filter(Boolean)).toHaveLength(2);
  });

  it('suggests no starting spells for paladin/ranger, who cast starting at level 2', () => {
    const paladin = applyDerivedDefaults({ ...createInitialDraft(), selectedClass: 'paladin' }, { forceMagic: true });
    const ranger = applyDerivedDefaults({ ...createInitialDraft(), selectedClass: 'ranger' }, { forceMagic: true });

    expect(paladin.cantripsText).toBe('');
    expect(paladin.knownSpellsText).toBe('');
    expect(paladin.preparedSpellsText).toBe('');
    expect(ranger.cantripsText).toBe('');
    expect(ranger.knownSpellsText).toBe('');
    expect(ranger.preparedSpellsText).toBe('');
  });
});
