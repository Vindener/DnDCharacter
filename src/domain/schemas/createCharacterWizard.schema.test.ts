import { describe, expect, it } from 'vitest';
import {
  safeParseCreateCharacterWizard,
  safeParseCreateCharacterWizardStep,
} from '@/domain/schemas';

describe('createCharacterWizard.schema', () => {
  const validPayload = {
    name: 'Aria',
    level: '3',
    isCustomRace: false,
    customRace: '',
    selectedClass: 'wizard',
    customClassName: '',
    backgroundKey: 'sage',
    customBackground: '',
    storageMode: 'local-cloud',
    inviteEmail: 'dm@example.com',
    statMethod: 'array',
    pointBuyValid: true,
  };

  it('validates full payload', () => {
    const result = safeParseCreateCharacterWizard(validPayload);
    expect(result.ok).toBe(true);
  });

  it('returns step-specific validation issues', () => {
    const step2 = safeParseCreateCharacterWizardStep({ ...validPayload, name: ' ', level: '25' }, 2);
    const step6 = safeParseCreateCharacterWizardStep({ ...validPayload, storageMode: 'local-only', inviteEmail: 'x@y.z' }, 6);

    expect(step2.ok).toBe(false);
    expect(step6.ok).toBe(false);
  });

  it('checks point-buy constraint on step 4', () => {
    const step4 = safeParseCreateCharacterWizardStep({ ...validPayload, statMethod: 'pointbuy', pointBuyValid: false }, 4);
    expect(step4.ok).toBe(false);
  });
});
