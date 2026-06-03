import { describe, expect, it } from 'vitest';
import { buildCampaignId, normalizeCampaignName, slugifyCampaignName, sortCampaignsByRecency } from '@/dm/domain/campaign';
import type { DMCampaign } from '@/dm/domain/types';

describe('dm/domain/campaign/utils', () => {
  it('normalizes and slugifies campaign names', () => {
    expect(normalizeCampaignName('  The   Crimson!  Keep  ')).toBe('the crimson keep');
    expect(slugifyCampaignName('  The   Crimson!  Keep  ')).toBe('the-crimson-keep');
    expect(buildCampaignId('  The   Crimson!  Keep  ')).toBe('campaign-the-crimson-keep');
  });

  it('sorts by recency then by name', () => {
    const campaigns: DMCampaign[] = [
      {
        id: 'c-2',
        name: 'Beta',
        nameNormalized: 'beta',
        ownerUid: 'u',
        owners: ['u'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 20,
      },
      {
        id: 'c-1',
        name: 'Alpha',
        nameNormalized: 'alpha',
        ownerUid: 'u',
        owners: ['u'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 20,
      },
      {
        id: 'c-3',
        name: 'Gamma',
        nameNormalized: 'gamma',
        ownerUid: 'u',
        owners: ['u'],
        editors: [],
        createdAtMs: 1,
        updatedAtMs: 10,
      },
    ];

    const sorted = sortCampaignsByRecency(campaigns);
    expect(sorted.map((item) => item.id)).toEqual(['c-1', 'c-2', 'c-3']);
  });
});
