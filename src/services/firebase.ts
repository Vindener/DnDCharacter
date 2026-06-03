
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const fbAuth = auth();
export const db = firestore();

export const now = () => firestore.FieldValue.serverTimestamp();

export const arrayUnion = (...items: any[]) => firestore.FieldValue.arrayUnion(...items);


export const hasDoc = (snap: any): boolean => {
  try {
    if (!snap) return false as any;
    const e: any = (snap as any).exists;
    if (typeof e === 'function') return !!e.call(snap);
    return !!e;
  } catch {
    return false;
  }
};
