import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

type AuthCtx = {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthCtx>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // RNFirebase ініціалізується нативно, initializeApp не потрібен
    const unsub = auth().onAuthStateChanged((u) => {
      setUser(u ?? null);
      setLoading(false);
    });
    return unsub;
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
