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
  toast.info('Google вхід', 'Налаштовано webClientId');
}

export async function onGoogleButtonPress() {
  try {
    toast.info('Google вхід', 'Перевірка Play Services…');
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    toast.info('Google вхід', 'Відкриття Google-авторизації…');

    const res = await GoogleSignin.signIn();

    // Підтримуємо новий і старий формат результату:
    let idToken = (res as any)?.data?.idToken || (res as any)?.idToken;
    if (!idToken) {
      toast.error('Google вхід', 'Не отримано ID-токен');
      throw new Error('ID-токен не знайдено');
    }
    toast.info('Google вхід', 'ID-токен отримано');

    const credential = GoogleAuthProvider.credential(idToken);

    toast.info('Firebase авторизація', 'Вхід за обліковими даними…');
    const r = await auth().signInWithCredential(credential);
    toast.success('Firebase авторизація', 'Успішний вхід');
    return r;
  } catch (err: any) {
    const code = err?.code || err?.message || String(err);
    toast.error('Помилка авторизації', typeof code === 'string' ? code : JSON.stringify(code));
    throw err;
  }
}

export async function logout() {
  try {
    await auth().signOut();
    toast.success('Вихід виконано', 'Ви вийшли з акаунта');
  } catch (err: any) {
    toast.error('Не вдалося вийти', err?.message || String(err));
    throw err;
  }
}

