import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

export const fbAuth = auth();
export const db = firestore();
export const fns = functions();

export const now = () => firestore.FieldValue.serverTimestamp();

export const arrayUnion = <T>(...items: T[]) => firestore.FieldValue.arrayUnion(...items);

export const deleteField = () => firestore.FieldValue.delete();

export const timestampToMillis = (value: unknown): number | undefined => {
  const candidate = value as { toMillis?: () => number } | null | undefined;
  return typeof candidate?.toMillis === 'function' ? candidate.toMillis() : undefined;
};

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
