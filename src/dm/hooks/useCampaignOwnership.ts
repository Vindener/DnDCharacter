import { fbAuth } from '@/services/firebase';
import type { DMCampaign } from '@/dm/domain/types';

export function useCampaignOwnership(campaign: DMCampaign | null): { myUid: string; isOwner: boolean } {
  const myUid = fbAuth.currentUser?.uid || '';
  return { myUid, isOwner: Boolean(campaign && campaign.owners.includes(myUid)) };
}
