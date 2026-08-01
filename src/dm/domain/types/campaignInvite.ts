export interface DMCampaignInvite {
  id: string;
  campaignId: string;
  role: 'editor';
  createdByUid: string;
  createdAtMs: number;
  expiresAtMs: number;
  maxUses?: number;
  usedByUids: string[];
}
