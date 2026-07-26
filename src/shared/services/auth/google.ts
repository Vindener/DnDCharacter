import auth, { GoogleAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { toast } from '@/shared/services/toast';
import i18n from '@/i18n';

let configured = false;

function readNestedString(source: unknown, keys: string[]): string | null {
  let current: unknown = source;
  for (const key of keys) {
    if (!current || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' && current.length ? current : null;
}

function getGoogleIdToken(result: unknown): string | null {
  return readNestedString(result, ['data', 'idToken']) || readNestedString(result, ['idToken']);
}

function getErrorCodeOrMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error);
  const maybeCode = (error as { code?: unknown }).code;
  if (typeof maybeCode === 'string' && maybeCode) return maybeCode;
  const maybeMessage = (error as { message?: unknown }).message;
  if (typeof maybeMessage === 'string' && maybeMessage) return maybeMessage;
  return String(error);
}

export function configureGoogleSignIn(webClientId: string) {
  if (configured) return;
  GoogleSignin.configure({
    webClientId,
    forceCodeForRefreshToken: false,
    profileImageSize: 150,
  });
  configured = true;
  toast.info(i18n.t('common:auth.googleSignIn'), i18n.t('common:auth.webClientConfigured'));
}

export async function onGoogleButtonPress() {
  try {
    toast.info(i18n.t('common:auth.googleSignIn'), i18n.t('common:auth.checkingPlayServices'));
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    toast.info(i18n.t('common:auth.googleSignIn'), i18n.t('common:auth.openingGoogleAuth'));

    const res = await GoogleSignin.signIn();

    // Підтримуємо новий і старий формат результату:
    const idToken = getGoogleIdToken(res);
    if (!idToken) {
      toast.error(i18n.t('common:auth.googleSignIn'), i18n.t('common:auth.missingIdToken'));
      throw new Error(i18n.t('common:auth.idTokenNotFound'));
    }
    toast.info(i18n.t('common:auth.googleSignIn'), i18n.t('common:auth.idTokenReceived'));

    const credential = GoogleAuthProvider.credential(idToken);

    toast.info(i18n.t('common:auth.firebaseAuth'), i18n.t('common:auth.signingInWithCredential'));
    const r = await auth().signInWithCredential(credential);
    toast.success(i18n.t('common:auth.firebaseAuth'), i18n.t('common:auth.signInSuccess'));
    return r;
  } catch (err: unknown) {
    const code = getErrorCodeOrMessage(err);
    toast.error(i18n.t('common:auth.authError'), typeof code === 'string' ? code : JSON.stringify(code));
    throw err;
  }
}

/**
 * Forces a fresh Google credential and re-authenticates the current Firebase user.
 * Required before sensitive account operations (account deletion) so a stale
 * cached session can't trigger them without the user actively signing in again.
 */
export async function reauthenticateWithGoogle(): Promise<void> {
  const user = auth().currentUser;
  if (!user) throw new Error('Not signed in');

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    const idToken = getGoogleIdToken(res);
    if (!idToken) {
      toast.error(i18n.t('common:auth.googleSignIn'), i18n.t('common:auth.missingIdToken'));
      throw new Error(i18n.t('common:auth.idTokenNotFound'));
    }
    const credential = GoogleAuthProvider.credential(idToken);
    await user.reauthenticateWithCredential(credential);
  } catch (err: unknown) {
    const code = getErrorCodeOrMessage(err);
    toast.error(i18n.t('common:auth.authError'), typeof code === 'string' ? code : JSON.stringify(code));
    throw err;
  }
}

export async function logout() {
  try {
    await auth().signOut();
    toast.success(i18n.t('common:auth.logoutSuccessTitle'), i18n.t('common:auth.logoutSuccessMessage'));
  } catch (err: unknown) {
    toast.error(i18n.t('common:auth.logoutErrorTitle'), getErrorCodeOrMessage(err));
    throw err;
  }
}
