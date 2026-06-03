
import { fbAuth, db, now } from './firebase';

export async function ensureUserIndexOnLogin() {
  const u = fbAuth.currentUser;
  if (!u) return;
  const emailLower = u.email ? u.email.toLowerCase() : null;
  await db.collection('users').doc(u.uid).set({
    uid: u.uid,
    email: u.email ?? null,
    emailLower,
    displayName: u.displayName ?? null,
    photoURL: u.photoURL ?? null,
    updatedAt: now(),
    createdAt: now(),
  }, { merge: true });
  if (emailLower) {
    await db.collection('emailIndex').doc(emailLower).set({ uid: u.uid }, { merge: true });
  }
}

export async function findUserByEmail(email: string) {
  const emailLower = email.trim().toLowerCase();
  const idx = await db.collection('emailIndex').doc(emailLower).get();
  if (!idx.exists) return null;
  const payload = idx.data() as { uid?: unknown } | undefined;
  const uid = typeof payload?.uid === 'string' ? payload.uid : null;
  return uid || null;
}
