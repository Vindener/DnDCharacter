
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const fbAuth = auth();
export const db = firestore();

export const now = () => firestore.FieldValue.serverTimestamp();

export const arrayUnion = <T>(...items: T[]) => firestore.FieldValue.arrayUnion(...items);

type SnapshotWithExists =
  | {
      exists?: boolean | (() => boolean);
    }
  | null
  | undefined;

export const hasDoc = (snap: SnapshotWithExists): boolean => {
  try {
    if (!snap) return false;
    const e = snap.exists;
    if (typeof e === 'function') return !!e.call(snap);
    return !!e;
  } catch {
    return false;
  }
};
