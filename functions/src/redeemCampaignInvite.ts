import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp();
}

export type RedeemCampaignInviteRequest = {
  code: string;
};

export type RedeemCampaignInviteResponse = {
  status: 'success';
  alreadyMember?: boolean;
};

export const redeemCampaignInvite = onCall<RedeemCampaignInviteRequest, Promise<RedeemCampaignInviteResponse>>(
  { region: 'us-central1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }

    const code = String(request.data?.code || '').trim();
    if (!code) {
      throw new HttpsError('invalid-argument', 'code is required.');
    }

    const db = getFirestore();
    const inviteRef = db.collection('dmCampaignInvites').doc(code);

    let result: { alreadyMember: boolean };
    try {
      result = await db.runTransaction(async (tx) => {
        const inviteSnap = await tx.get(inviteRef);
        if (!inviteSnap.exists) {
          throw new HttpsError('not-found', 'invite-not-found');
        }
        const invite = inviteSnap.data() || {};
        const campaignId = String(invite.campaignId || '');
        const campaignRef = db.collection('dmCampaigns').doc(campaignId);
        const campaignSnap = await tx.get(campaignRef);
        if (!campaignSnap.exists) {
          // Campaign was deleted (or transferred/removed) after this invite was created.
          // Invite docs are not cascade-deleted with the campaign — see deleteMyAccount.ts.
          throw new HttpsError('not-found', 'invite-campaign-missing');
        }

        const campaign = campaignSnap.data() || {};
        const owners: string[] = Array.isArray(campaign.owners) ? campaign.owners : [];
        const editors: string[] = Array.isArray(campaign.editors) ? campaign.editors : [];
        if (owners.includes(uid) || editors.includes(uid)) {
          return { alreadyMember: true };
        }

        const expiresAtMs = Number(invite.expiresAtMs || 0);
        if (Date.now() > expiresAtMs) {
          throw new HttpsError('failed-precondition', 'invite-expired');
        }

        const maxUses = typeof invite.maxUses === 'number' ? invite.maxUses : null;
        const usedByUids: string[] = Array.isArray(invite.usedByUids) ? invite.usedByUids : [];
        if (maxUses != null && usedByUids.length >= maxUses) {
          throw new HttpsError('failed-precondition', 'invite-exhausted');
        }

        const campaignUpdate: Record<string, unknown> = { editors: FieldValue.arrayUnion(uid) };
        // Only the currently-tracked active code advances the visible "used" counter —
        // an owner may have generated older codes before this one that are no longer
        // denormalized on the campaign doc; those still work, just aren't counted here.
        if (campaign.activeInviteCode === code) {
          campaignUpdate.activeInviteUsedCount = FieldValue.increment(1);
        }
        tx.update(campaignRef, campaignUpdate);
        tx.update(inviteRef, { usedByUids: FieldValue.arrayUnion(uid) });
        return { alreadyMember: false };
      });
    } catch (error) {
      const reason = error instanceof HttpsError ? error.message : undefined;
      if (reason === 'invite-expired' || reason === 'invite-exhausted') {
        logger.info('redeemCampaignInvite: rejected', { uid, reason });
      }
      throw error;
    }

    if (result.alreadyMember) {
      logger.info('redeemCampaignInvite: already a member, no-op', { uid });
      return { status: 'success', alreadyMember: true };
    }

    logger.info('redeemCampaignInvite: completed', { uid });
    return { status: 'success' };
  },
);
