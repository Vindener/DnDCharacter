
import { db, now, fbAuth } from './firebase';

function uid() { const u = fbAuth.currentUser; if (!u) throw new Error('Not signed in'); return u.uid; }

function errorMeta(error: unknown): { code: string; message: string } {
  if (!error || typeof error !== 'object') {
    return { code: '', message: String(error) };
  }
  const cast = error as { code?: unknown; message?: unknown };
  return {
    code: typeof cast.code === 'string' ? cast.code : '',
    message: typeof cast.message === 'string' ? cast.message : String(error),
  };
}

export async function ensureConnection(toUid: string) {
  const me = uid();
  if (toUid === me) return null;

  if (__DEV__) console.log('[share] ensureConnection: me =', me, 'toUid =', toUid);

  // 🔒 IMPORTANT: avoid 'in' queries that could touch docs we're not participant of
  // Query only docs where current user is participant to satisfy Firestore rules.
  let existingId: string | null = null;

  try {
    const q1 = await db.collection('connections')
      .where('fromUid', '==', me)
      .where('toUid', '==', toUid)
      .get();
    if (!q1.empty) existingId = q1.docs[0].id;
  } catch (error: unknown) {
    const meta = errorMeta(error);
    if (__DEV__) console.warn('[share] connections q1 failed', meta.code, meta.message);
  }

  if (!existingId) {
    try {
      const q2 = await db.collection('connections')
        .where('fromUid', '==', toUid)
        .where('toUid', '==', me)
        .get();
      if (!q2.empty) existingId = q2.docs[0].id;
    } catch (error: unknown) {
      const meta = errorMeta(error);
      if (__DEV__) console.warn('[share] connections q2 failed', meta.code, meta.message);
    }
  }

  if (__DEV__) console.log('[share] existing connection id =', existingId);

  if (existingId) return existingId;

  const ref = db.collection('connections').doc();
  const doc = {
    fromUid: me,
    toUid,
    status: 'pending',
    createdAt: now(),
    updatedAt: now(),
  };

  try {
    await ref.set(doc);
  } catch (error: unknown) {
    const meta = errorMeta(error);
    if (__DEV__) console.warn('[share] ensureConnection set failed', meta.code, meta.message);
    if (meta.code !== 'permission-denied') throw error;
  }

  return ref.id;
}
