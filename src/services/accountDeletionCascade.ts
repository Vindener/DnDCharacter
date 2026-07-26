// Keep this file's logic in sync with functions/src/accountDeletionCascade.ts —
// the Cloud Function runs in a separate Node package and cannot import from src/.

export type CascadeOwnershipDoc = {
  ownerUid: string;
  owners: string[];
  editors: string[];
};

export type CascadeAction =
  | { type: 'delete' }
  | { type: 'transferOwnership'; newOwnerUid: string }
  | { type: 'removeFromOwners' }
  | { type: 'removeFromEditors' }
  | { type: 'noop' };

/**
 * Decides what happens to a single owner/editor document when `myUid` leaves it,
 * per the COL-10 table: sole owner+no editors -> delete; sole owner+editors ->
 * transfer ownership; one of several owners -> drop from owners; editor only ->
 * drop from editors.
 */
export function decideCascadeAction(doc: CascadeOwnershipDoc, myUid: string, chosenNewOwnerUid?: string): CascadeAction {
  const owners = doc.owners || [];
  const editors = doc.editors || [];
  const isOwner = owners.includes(myUid) || doc.ownerUid === myUid;
  const isEditor = editors.includes(myUid);

  if (isOwner) {
    const otherOwners = owners.filter((entry) => entry !== myUid);
    if (otherOwners.length > 0) {
      return { type: 'removeFromOwners' };
    }
    if (editors.length === 0) {
      return { type: 'delete' };
    }
    const newOwnerUid = chosenNewOwnerUid && editors.includes(chosenNewOwnerUid) ? chosenNewOwnerUid : editors[0];
    return { type: 'transferOwnership', newOwnerUid };
  }

  if (isEditor) {
    return { type: 'removeFromEditors' };
  }

  return { type: 'noop' };
}
