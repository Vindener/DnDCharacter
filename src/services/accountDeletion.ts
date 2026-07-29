import { db, fbAuth, fns } from '@/services/firebase';
import { reauthenticateWithGoogle } from '@/shared/services/auth';
import { getEditorsForSheet } from '@/repositories/characterCloudRepository';
import { decideCascadeAction, type CascadeAction, type CascadeOwnershipDoc } from '@/services/accountDeletionCascade';
import { trackProductEvent } from '@/shared/services/telemetry/productTelemetry';

export type CascadeCollection = 'characterSheets' | 'dmCampaigns' | 'dmCampaignNotes';

export type AccountDeletionPreviewItem = {
  collection: CascadeCollection;
  id: string;
  label: string;
  action: CascadeAction;
  editorCandidates?: Array<{ uid: string; email: string }>;
};

export type AccountDeletionPreview = {
  items: AccountDeletionPreviewItem[];
  needsOwnerChoice: AccountDeletionPreviewItem[];
};

export type TransferSelections = Record<string, string>;

export type AccountDeletionCallableResponse = { status: 'success' } | { status: 'partial'; stage: string };

export class AccountDeletionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'AccountDeletionError';
  }
}

export function buildTransferKey(collection: CascadeCollection, id: string): string {
  return `${collection}/${id}`;
}

function toOwnershipDoc(data: Record<string, unknown>): CascadeOwnershipDoc {
  return {
    ownerUid: String(data.ownerUid || ''),
    owners: Array.isArray(data.owners) ? data.owners.map((entry) => String(entry)) : [],
    editors: Array.isArray(data.editors) ? data.editors.map((entry) => String(entry)) : [],
  };
}

async function collectPreviewForCollection(
  collection: CascadeCollection,
  labelField: 'name' | 'title',
  myUid: string,
): Promise<AccountDeletionPreviewItem[]> {
  const [ownedSnap, editedSnap] = await Promise.all([
    db.collection(collection).where('owners', 'array-contains', myUid).get(),
    db.collection(collection).where('editors', 'array-contains', myUid).get(),
  ]);

  const docsById = new Map<string, Record<string, unknown>>();
  ownedSnap.docs.forEach((doc) => docsById.set(doc.id, doc.data() || {}));
  editedSnap.docs.forEach((doc) => {
    if (!docsById.has(doc.id)) docsById.set(doc.id, doc.data() || {});
  });

  const items: AccountDeletionPreviewItem[] = [];
  for (const [id, data] of docsById) {
    const ownershipDoc = toOwnershipDoc(data);
    const action = decideCascadeAction(ownershipDoc, myUid);
    const label = String(data[labelField] || id);

    let editorCandidates: Array<{ uid: string; email: string }> | undefined;
    if (action.type === 'transferOwnership' && ownershipDoc.editors.length > 1) {
      editorCandidates = await getEditorsForSheet(ownershipDoc.editors);
    }

    items.push({ collection, id, label, action, editorCandidates });
  }
  return items;
}

export async function previewAccountDeletion(): Promise<AccountDeletionPreview> {
  const me = fbAuth.currentUser?.uid;
  if (!me) throw new AccountDeletionError('not-signed-in', 'Not signed in');

  const [sheets, campaigns, notes] = await Promise.all([
    collectPreviewForCollection('characterSheets', 'name', me),
    collectPreviewForCollection('dmCampaigns', 'name', me),
    collectPreviewForCollection('dmCampaignNotes', 'title', me),
  ]);

  const items = [...sheets, ...campaigns, ...notes];
  const needsOwnerChoice = items.filter((item) => item.action.type === 'transferOwnership' && (item.editorCandidates?.length || 0) > 1);

  return { items, needsOwnerChoice };
}

export async function requestAccountDeletion(transferSelections: TransferSelections = {}): Promise<AccountDeletionCallableResponse> {
  const me = fbAuth.currentUser?.uid;
  if (!me) throw new AccountDeletionError('not-signed-in', 'Not signed in');

  try {
    await reauthenticateWithGoogle();
  } catch (err: unknown) {
    throw new AccountDeletionError('reauth-failed', err instanceof Error ? err.message : String(err));
  }

  try {
    const callable = fns.httpsCallable<{ transferSelections: TransferSelections }, AccountDeletionCallableResponse>('deleteMyAccount');
    const result = await callable({ transferSelections });
    if (result.data.status === 'success') {
      trackProductEvent('account_deleted');
    }
    return result.data;
  } catch (err: unknown) {
    const httpsError = err as { code?: string; message?: string };
    throw new AccountDeletionError(httpsError.code || 'unknown', httpsError.message || String(err));
  }
}
