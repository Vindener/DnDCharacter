import { describe, expect, it } from 'vitest';
import { safeParseCreateCharacterWizard, safeParseCreateCharacterWizardStep } from '@/domain/schemas';

describe('createCharacterWizard.schema', () => {
  const validPayload = {
    step: 11,
    startMethod: 'standard-5e',
    name: 'Aria',
    level: '3',
    isCustomRace: false,
    customRace: '',
    selectedClass: 'wizard',
    customClassName: '',
    backgroundKey: 'sage',
    customBackground: '',
    storageMode: 'local-cloud',
    shareTarget: 'dm',
    inviteEmail: 'dm@example.com',
    statMethod: 'array',
    stats: {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    },
    pointBuyStats: {
      strength: 8,
      dexterity: 8,
      constitution: 8,
      intelligence: 8,
      wisdom: 8,
      charisma: 8,
    },
    manualStats: {
      strength: '15',
      dexterity: '14',
      constitution: '13',
      intelligence: '12',
      wisdom: '10',
      charisma: '8',
    },
    rollStats: {
      strength: '13',
      dexterity: '13',
      constitution: '13',
      intelligence: '12',
      wisdom: '12',
      charisma: '12',
    },
    hpMax: '8',
    hpCurrent: '8',
    hitDice: '3d6',
    ac: '12',
    speed: '30',
    proficiencyBonus: '2',
    isOnline: true,
  };

  it('validates full payload', () => {
    const result = safeParseCreateCharacterWizard(validPayload);
    expect(result.ok).toBe(true);
  });

  it('validates all wizard steps that have rules', () => {
    expect(safeParseCreateCharacterWizardStep({ ...validPayload, name: ' ', level: '25' }, 2).ok).toBe(false);
    expect(safeParseCreateCharacterWizardStep({ ...validPayload, selectedClass: 'custom', customClassName: '' }, 3).ok).toBe(false);
    expect(
      safeParseCreateCharacterWizardStep(
        {
          ...validPayload,
          statMethod: 'manual',
          manualStats: { ...validPayload.manualStats, strength: '31' },
        },
        4,
      ).ok,
    ).toBe(false);
    expect(
      safeParseCreateCharacterWizardStep(
        {
          ...validPayload,
          statMethod: 'random',
          rollStats: { ...validPayload.rollStats, dexterity: '0' },
        },
        4,
      ).ok,
    ).toBe(false);
    expect(safeParseCreateCharacterWizardStep({ ...validPayload, hpMax: '0' }, 5).ok).toBe(false);
    expect(safeParseCreateCharacterWizardStep({ ...validPayload, storageMode: 'local-only', inviteEmail: 'dm@example.com' }, 10).ok).toBe(
      false,
    );
    expect(safeParseCreateCharacterWizardStep({ ...validPayload, name: '' }, 11).ok).toBe(false);
  });

  it('checks point-buy constraint on step 4', () => {
    const result = safeParseCreateCharacterWizardStep(
      {
        ...validPayload,
        statMethod: 'pointbuy',
        pointBuyStats: {
          strength: 15,
          dexterity: 15,
          constitution: 15,
          intelligence: 15,
          wisdom: 15,
          charisma: 15,
        },
      },
      4,
    );

    expect(result.ok).toBe(false);
  });

  it('allows offline local create but rejects offline cloud create', () => {
    expect(
      safeParseCreateCharacterWizardStep(
        { ...validPayload, storageMode: 'local-only', shareTarget: 'none', inviteEmail: '', isOnline: false },
        10,
      ).ok,
    ).toBe(true);
    expect(safeParseCreateCharacterWizardStep({ ...validPayload, storageMode: 'local-cloud', isOnline: false }, 10).ok).toBe(false);
  });

  it('rejects a share target without an invite email', () => {
    expect(
      safeParseCreateCharacterWizardStep({ ...validPayload, storageMode: 'local-cloud', shareTarget: 'dm', inviteEmail: '' }, 10).ok,
    ).toBe(false);
    expect(
      safeParseCreateCharacterWizardStep({ ...validPayload, storageMode: 'local-cloud', shareTarget: 'player', inviteEmail: '   ' }, 10).ok,
    ).toBe(false);
  });
});
