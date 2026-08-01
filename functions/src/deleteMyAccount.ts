import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore, type DocumentData, type DocumentReference } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { decideCascadeAction, type CascadeOwnershipDoc } from './accountDeletionCascade';

if (!getApps().length) {
  initializeApp();
}

const CASCADE_COLLECTIONS = ['characterSheets', 'dmCampaigns', 'dmCampaignNotes', 'dmCampaignEncounters'] as const;
type CascadeCollectionName = (typeof CASCADE_COLLECTIONS)[number];

export type DeleteMyAccountRequest = {
  transferSelections?: Record<string, string>;
};

export type DeleteMyAccountResponse = { status: 'success' } | { status: 'partial'; stage: string };

type WriteOp =
  | { kind: 'delete'; ref: DocumentReference }
  | { kind: 'update'; ref: DocumentReference; data: Record<string, unknown> };

function toOwnershipDoc(data: DocumentData): CascadeOwnershipDoc {
  return {
    ownerUid: String(data.ownerUid || ''),
    owners: Array.isArray(data.owners) ? data.owners.map((entry) => String(entry)) : [],
    editors: Array.isArray(data.editors) ? data.editors.map((entry) => String(entry)) : [],
  };
}

async function planCollectionOps(
  db: Firestore,
  collectionName: CascadeCollectionName,
  myUid: string,
  transferSelections: Record<string, string>,
): Promise<WriteOp[]> {
  const [ownedSnap, editedSnap] = await Promise.all([
    db.collection(collectionName).where('owners', 'array-contains', myUid).get(),
    db.collection(collectionName).where('editors', 'array-contains', myUid).get(),
  ]);

  const docsById = new Map<string, DocumentData>();
  ownedSnap.docs.forEach((doc) => docsById.set(doc.id, doc.data()));
  editedSnap.docs.forEach((doc) => {
    if (!docsById.has(doc.id)) docsById.set(doc.id, doc.data());
  });

  const ops: WriteOp[] = [];
  for (const [id, data] of docsById) {
    const ownershipDoc = toOwnershipDoc(data);
    const chosen = transferSelections[`${collectionName}/${id}`];
    const action = decideCascadeAction(ownershipDoc, myUid, chosen);
    const ref = db.collection(collectionName).doc(id);

    if (action.type === 'delete') {
      ops.push({ kind: 'delete', ref });
    } else if (action.type === 'transferOwnership') {
      const nextOwners = ownershipDoc.owners.filter((uid) => uid !== myUid);
      if (!nextOwners.includes(action.newOwnerUid)) nextOwners.push(action.newOwnerUid);
      const nextEditors = ownershipDoc.editors.filter((uid) => uid !== action.newOwnerUid);
      ops.push({ kind: 'update', ref, data: { ownerUid: action.newOwnerUid, owners: nextOwners, editors: nextEditors } });
    } else if (action.type === 'removeFromOwners') {
      const nextOwners = ownershipDoc.owners.filter((uid) => uid !== myUid);
      const patch: Record<string, unknown> = { owners: nextOwners };
      if (ownershipDoc.ownerUid === myUid) patch.ownerUid = nextOwners[0] || '';
      ops.push({ kind: 'update', ref, data: patch });
    } else if (action.type === 'removeFromEditors') {
      ops.push({ kind: 'update', ref, data: { editors: ownershipDoc.editors.filter((uid) => uid !== myUid) } });
    }
  }
  return ops;
}

async function planConnectionOps(db: Firestore, myUid: string): Promise<WriteOp[]> {
  const [fromSnap, toSnap] = await Promise.all([
    db.collection('connections').where('fromUid', '==', myUid).get(),
    db.collection('connections').where('toUid', '==', myUid).get(),
  ]);
  const seen = new Set<string>();
  const ops: WriteOp[] = [];
  [...fromSnap.docs, ...toSnap.docs].forEach((doc) => {
    if (seen.has(doc.id)) return;
    seen.add(doc.id);
    ops.push({ kind: 'delete', ref: doc.ref });
  });
  return ops;
}

const BATCH_CHUNK_SIZE = 450;

/**
 * Removes every trace of `myUid` from characterSheets/dmCampaigns/dmCampaignNotes/dmCampaignEncounters
 * (per the COL-10 owner/editor table), connections, emailIndex and users.
 * Writes are chunked into Firestore's 500-op batch limit; each chunk commits
 * atomically, but a very large fan-out (500+ owned/shared docs) is not
 * atomic end-to-end — see functions/README.md.
 */
export async function runAccountDeletionCascade(
  db: Firestore,
  myUid: string,
  transferSelections: Record<string, string>,
): Promise<void> {
  const ops: WriteOp[] = [];

  for (const collectionName of CASCADE_COLLECTIONS) {
    ops.push(...(await planCollectionOps(db, collectionName, myUid, transferSelections)));
  }
  ops.push(...(await planConnectionOps(db, myUid)));

  const userRef = db.collection('users').doc(myUid);
  const userSnap = await userRef.get();
  const emailLower = userSnap.exists ? String(userSnap.data()?.emailLower || '') : '';
  if (emailLower) {
    const emailIndexRef = db.collection('emailIndex').doc(emailLower);
    const emailIndexSnap = await emailIndexRef.get();
    if (emailIndexSnap.exists && emailIndexSnap.data()?.uid === myUid) {
      ops.push({ kind: 'delete', ref: emailIndexRef });
    }
  }
  ops.push({ kind: 'delete', ref: userRef });

  for (let i = 0; i < ops.length; i += BATCH_CHUNK_SIZE) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + BATCH_CHUNK_SIZE)) {
      if (op.kind === 'delete') batch.delete(op.ref);
      else batch.update(op.ref, op.data);
    }
    await batch.commit();
  }
}

export const deleteMyAccount = onCall<DeleteMyAccountRequest, Promise<DeleteMyAccountResponse>>(
  { region: 'us-central1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }

    const db = getFirestore();
    const transferSelections = request.data?.transferSelections || {};

    try {
      await runAccountDeletionCascade(db, uid, transferSelections);
    } catch (error) {
      logger.error('deleteMyAccount: Firestore cascade failed, no changes committed', { uid, error });
      throw new HttpsError('internal', 'Failed to remove account data. No changes were made — try again.');
    }

    try {
      await getAuth().deleteUser(uid);
    } catch (error) {
      logger.error('deleteMyAccount: auth deleteUser failed after Firestore cascade succeeded', { uid, error });
      return { status: 'partial', stage: 'auth-delete-failed' };
    }

    logger.info('deleteMyAccount: completed', { uid });
    return { status: 'success' };
  },
);
