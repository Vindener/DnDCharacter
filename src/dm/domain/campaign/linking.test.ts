import { describe, expect, it } from 'vitest';
import { buildLegacyCampaignFallbackId, resolveCampaignForLink } from '@/dm/domain/campaign';
import type { DMCampaign } from '@/dm/domain/types';

const CAMPAIGNS: DMCampaign[] = [
  {
    id: 'campaign-alpha',
    name: 'Alpha',
    nameNormalized: 'alpha',
    ownerUid: 'u-1',
    owners: ['u-1'],
    editors: [],
    createdAtMs: 1,
    updatedAtMs: 1,
  },
  {
    id: 'campaign-beta',
    name: 'Beta Group',
    nameNormalized: 'beta group',
    ownerUid: 'u-1',
    owners: ['u-1'],
    editors: [],
    createdAtMs: 1,
    updatedAtMs: 2,
  },
];

describe('dm/domain/campaign/linking', () => {
  it('resolves by campaign id first', () => {
    const resolved = resolveCampaignForLink({ campaignId: 'campaign-beta', campaignName: 'Alpha' }, CAMPAIGNS);
    expect(resolved?.id).toBe('campaign-beta');
  });

  it('resolves by normalized campaign name when id is absent', () => {
    const resolved = resolveCampaignForLink({ campaignName: '  BETA   Group ' }, CAMPAIGNS);
    expect(resolved?.id).toBe('campaign-beta');
  });

  it('builds stable legacy fallback ids', () => {
    expect(buildLegacyCampaignFallbackId('  Alpha!  ')).toBe('legacy-alpha');
    expect(buildLegacyCampaignFallbackId('')).toBe('legacy-uncategorized');
  });
});
