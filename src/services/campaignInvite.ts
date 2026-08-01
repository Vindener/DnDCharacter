import { fbAuth, fns } from '@/services/firebase';
import { trackProductEvent } from '@/shared/services/telemetry/productTelemetry';

export class CampaignInviteError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'CampaignInviteError';
  }
}

export type CreateCampaignInviteResult = { code: string; expiresAtMs: number };
export type RedeemCampaignInviteResult = { status: 'success'; alreadyMember?: boolean };

function toCampaignInviteError(err: unknown): CampaignInviteError {
  const httpsError = err as { code?: string; message?: string };
  return new CampaignInviteError(httpsError.code || 'unknown', httpsError.message || String(err));
}

export async function createCampaignInvite(campaignId: string, maxUses?: number): Promise<CreateCampaignInviteResult> {
  if (!fbAuth.currentUser) throw new CampaignInviteError('not-signed-in', 'Not signed in');

  try {
    const callable = fns.httpsCallable<{ campaignId: string; maxUses?: number }, CreateCampaignInviteResult>('createCampaignInvite');
    const result = await callable({ campaignId, maxUses });
    trackProductEvent('campaign_invite_created');
    return result.data;
  } catch (err: unknown) {
    throw toCampaignInviteError(err);
  }
}

export async function redeemCampaignInvite(code: string): Promise<RedeemCampaignInviteResult> {
  if (!fbAuth.currentUser) throw new CampaignInviteError('not-signed-in', 'Not signed in');

  try {
    const callable = fns.httpsCallable<{ code: string }, RedeemCampaignInviteResult>('redeemCampaignInvite');
    const result = await callable({ code });
    trackProductEvent('campaign_invite_redeemed');
    return result.data;
  } catch (err: unknown) {
    const inviteError = toCampaignInviteError(err);
    if (inviteError.message === 'invite-expired' || inviteError.message === 'invite-exhausted') {
      trackProductEvent('campaign_invite_expired_attempt', { result: inviteError.message === 'invite-expired' ? 'expired' : 'exhausted' });
    }
    throw inviteError;
  }
}
