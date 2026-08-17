import type { CampaignLinkInput, DMCampaign } from '@/dm/domain/types';
import { normalizeCampaignName } from './utils';

export function resolveCampaignForLink(link: CampaignLinkInput, campaigns: DMCampaign[]): DMCampaign | null {
  if (link.campaignId) {
    const byId = campaigns.find((campaign) => campaign.id === link.campaignId);
    if (byId) return byId;
  }

  const normalized = normalizeCampaignName(String(link.campaignName || ''));
  if (!normalized) return null;
  return campaigns.find((campaign) => campaign.nameNormalized === normalized) || null;
}

export function buildLegacyCampaignFallbackId(campaignName?: string | null): string {
  const normalized = normalizeCampaignName(String(campaignName || ''));
  return `legacy-${normalized || 'uncategorized'}`;
}
