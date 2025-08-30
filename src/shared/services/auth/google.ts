import auth, { GoogleAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { toast } from '@/shared/services/toast';

let configured = false;

export function configureGoogleSignIn(webClientId: string) {
  if (configured) return;
  GoogleSignin.configure({
    webClientId,
    forceCodeForRefreshToken: false,
    profileImageSize: 150,
  });
  configured = true;
  toast.info('Google Sign-In', 'Configured with webClientId');
}

export async function onGoogleButtonPress() {
  try {
    toast.info('Google Sign-In', 'Checking Play Services…');
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    toast.info('Google Sign-In', 'Opening Google auth…');

    const res = await GoogleSignin.signIn();

    // Підтримуємо новий і старий формат результату:
    let idToken = (res as any)?.data?.idToken || (res as any)?.idToken;
    if (!idToken) {
      toast.error('Google Sign-In', 'No ID token returned');
      throw new Error('No ID token found');
    }
    toast.info('Google Sign-In', 'ID token received');

    const credential = GoogleAuthProvider.credential(idToken);

    toast.info('Firebase Auth', 'Signing in with credential…');
    const r = await auth().signInWithCredential(credential);
    toast.success('Firebase Auth', 'Signed in successfully');
    return r;
  } catch (err: any) {
    const code = err?.code || err?.message || String(err);
    toast.error('Auth error', typeof code === 'string' ? code : JSON.stringify(code));
    throw err;
  }
}

export async function logout() {
  try {
    await auth().signOut();
    toast.success('Signed out', 'You have been signed out');
  } catch (err: any) {
    toast.error('Sign out failed', err?.message || String(err));
    throw err;
  }
}
