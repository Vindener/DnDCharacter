export interface DMCampaign {
  schemaVersion?: number;
  id: string;
  name: string;
  nameNormalized: string;
  ownerUid: string;
  owners: string[];
  editors: string[];
  createdAtMs: number;
  updatedAtMs: number;
  summary?: string;
  partyLevelEstimate?: number;
}

export type CampaignLinkInput = {
  campaignId?: string | null;
  campaignName?: string | null;
};
