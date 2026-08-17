import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { randomInt } from 'node:crypto';

if (!getApps().length) {
  initializeApp();
}

// Unambiguous alphabet (no 0/O, 1/I/L) — safe to read aloud or retype from a screenshot.
const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CODE_GENERATION_ATTEMPTS = 5;

export type CreateCampaignInviteRequest = {
  campaignId: string;
  maxUses?: number;
};

export type CreateCampaignInviteResponse = {
  code: string;
  expiresAtMs: number;
};

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    code += INVITE_CODE_ALPHABET[randomInt(0, INVITE_CODE_ALPHABET.length)];
  }
  return code;
}

export const createCampaignInvite = onCall<CreateCampaignInviteRequest, Promise<CreateCampaignInviteResponse>>(
  { region: 'us-central1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }

    const campaignId = String(request.data?.campaignId || '');
    if (!campaignId) {
      throw new HttpsError('invalid-argument', 'campaignId is required.');
    }

    const maxUsesInput = request.data?.maxUses;
    const maxUses =
      typeof maxUsesInput === 'number' && Number.isFinite(maxUsesInput) && maxUsesInput > 0 ? Math.floor(maxUsesInput) : undefined;

    const db = getFirestore();
    const campaignSnap = await db.collection('dmCampaigns').doc(campaignId).get();
    if (!campaignSnap.exists) {
      throw new HttpsError('not-found', 'Campaign not found.');
    }

    const owners = campaignSnap.data()?.owners;
    if (!Array.isArray(owners) || !owners.includes(uid)) {
      throw new HttpsError('permission-denied', 'Only the campaign owner can create invites.');
    }

    const createdAtMs = Date.now();
    const expiresAtMs = createdAtMs + INVITE_TTL_MS;

    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
      const code = generateInviteCode();
      const inviteRef = db.collection('dmCampaignInvites').doc(code);

      const invite: Record<string, unknown> = {
        id: code,
        campaignId,
        role: 'editor',
        createdByUid: uid,
        createdAtMs,
        expiresAtMs,
        usedByUids: [],
      };
      if (maxUses != null) invite.maxUses = maxUses;

      try {
        // .create() (not .set()) so a same-tick collision with another generation
        // attempt throws instead of silently overwriting an existing invite.
        await inviteRef.create(invite);
      } catch {
        // Collision — retry with a freshly generated code.
        continue;
      }

      // Denormalized onto the campaign doc so the owner can see "is there an active
      // code, has anyone used it" from a normal dmCampaigns read — dmCampaignInvites
      // itself has `list: false` (SEC: prevents code enumeration), so it can't be
      // queried directly from the client. Point update only — never touches
      // owners/editors, so this can't race with an addEditor/removeEditor transaction.
      // Deliberately outside the collision try/catch above: a failure here must not
      // trigger a retry that mints a second, orphaned invite code.
      try {
        await db
          .collection('dmCampaigns')
          .doc(campaignId)
          .update({ activeInviteCode: code, activeInviteExpiresAtMs: expiresAtMs, activeInviteUsedCount: 0 });
      } catch (error) {
        logger.error('createCampaignInvite: invite created but campaign denormalization failed', { campaignId, uid, error });
      }

      logger.info('createCampaignInvite: completed', { campaignId, uid });
      return { code, expiresAtMs };
    }

    logger.error('createCampaignInvite: exhausted code generation attempts', { campaignId, uid });
    throw new HttpsError('internal', 'Could not generate a unique invite code — try again.');
  },
);
