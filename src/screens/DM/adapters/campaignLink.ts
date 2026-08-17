import type { CampaignLinkInput, DMCampaign } from '@/dm/domain/types';
import { buildLegacyCampaignFallbackId, normalizeCampaignName } from '@/dm/domain/campaign';
import type { CharacterViewModel } from '@/types/Character';

type CharacterCampaignSource = Pick<CharacterViewModel, 'campaignId' | 'campaign'>;

export function toCampaignLinkInput(character: CharacterCampaignSource): CampaignLinkInput {
  return {
    campaignId: character.campaignId || undefined,
    campaignName: character.campaign || undefined,
  };
}

export function buildCampaignFallbackIdForCharacter(character: CharacterCampaignSource): string {
  return buildLegacyCampaignFallbackId(character.campaign);
}

export function isCharacterInCampaign(character: CharacterCampaignSource, campaign: DMCampaign | null): boolean {
  if (!campaign) return false;
  if (character.campaignId && character.campaignId === campaign.id) return true;
  const legacyCampaignName = normalizeCampaignName(String(character.campaign || ''));
  return Boolean(legacyCampaignName) && legacyCampaignName === campaign.nameNormalized;
}

export function getCharacterCampaignLabel(character: CharacterCampaignSource, campaignNamesById: Map<string, string>): string {
  if (character.campaignId) {
    const byId = campaignNamesById.get(character.campaignId);
    if (byId) return byId;
  }

  const legacyCampaignName = String(character.campaign || '').trim();
  if (legacyCampaignName) return legacyCampaignName;
  return 'Без кампанії';
}
