import auth, { GoogleAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { toast } from '@/shared/services/toast';

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
  toast.info('Google вхід', 'Налаштовано webClientId');
}

export async function onGoogleButtonPress() {
  try {
    toast.info('Google вхід', 'Перевірка Play Services…');
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    toast.info('Google вхід', 'Відкриття Google-авторизації…');

    const res = await GoogleSignin.signIn();

    // Підтримуємо новий і старий формат результату:
    const idToken = getGoogleIdToken(res);
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
  } catch (err: unknown) {
    const code = getErrorCodeOrMessage(err);
    toast.error('Помилка авторизації', typeof code === 'string' ? code : JSON.stringify(code));
    throw err;
  }
}

export async function logout() {
  try {
    await auth().signOut();
    toast.success('Вихід виконано', 'Ви вийшли з акаунта');
  } catch (err: unknown) {
    toast.error('Не вдалося вийти', getErrorCodeOrMessage(err));
    throw err;
  }
}

