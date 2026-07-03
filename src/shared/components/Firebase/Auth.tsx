import React, { useState, useEffect } from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';
import { configureGoogleSignIn, onGoogleButtonPress, logout } from '@/shared/services/auth/index';
import { ensureUserIndexOnLogin } from '@/services/users';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/Settings/styles';

export default function Auth() {
  const { t } = useTranslation('settings');
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  useEffect(() => {
    if (user) {
      ensureUserIndexOnLogin().catch(() => {});
    }
  }, [user]);

  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  configureGoogleSignIn('608733335623-k857u9k0p2t6gd52k9uthr76jbm001m3.apps.googleusercontent.com');

  // Handle user state changes
  const handleAuthStateChanged = React.useCallback((nextUser: FirebaseAuthTypes.User | null) => {
    setUser(nextUser);
    setInitializing((prev) => (prev ? false : prev));
  }, []);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, [handleAuthStateChanged]);

  if (initializing) return null;

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <TouchableOpacity onPress={() => onGoogleButtonPress()} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>{t('account.signInWithGoogle')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fallbackInitial = user.email?.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.authContainer}>
      <View style={styles.authUserRow}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.authAvatar} />
        ) : (
          <View style={[styles.authAvatar, styles.authAvatarFallback]}>
            <Text style={styles.authAvatarFallbackText}>{fallbackInitial}</Text>
          </View>
        )}
        <View style={styles.authUserTextWrap}>
          <Text style={styles.authWelcome}>{t('account.signedInAs')}</Text>
          <Text style={styles.authUserEmail}>{user.email}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => logout()} style={styles.actionButton}>
        <Text style={styles.actionButtonText}>{t('account.signOut')}</Text>
      </TouchableOpacity>
    </View>
  );
}
