import auth from '@react-native-firebase/auth';
import { GoogleAuthProvider, getAuth, signInWithCredential, onAuthStateChanged, signOut } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * Викликай один раз при старті додатку (див. bootstrap.ts нижче)
 */
export function configureGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });
}

export async function onGoogleButtonPress() {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Get the users ID token
    const signInResult = await GoogleSignin.signIn();

    // Try the new style of google-sign in result, from v13+ of that module
    let idToken = signInResult.data?.idToken;
    if (!idToken) {
      // if you are using older versions of google-signin, try old style result
      idToken = signInResult.idToken;
    }
    if (!idToken) {
      throw new Error('No ID token found');
    }

    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(signInResult.data.idToken);

    // Sign-in the user with the credential
    return signInWithCredential(getAuth(), googleCredential);
  }



export async function logout() {
    signOut(getAuth()).then(() => console.log('User signed out!'));
}
