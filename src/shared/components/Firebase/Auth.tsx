import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useAuth, configureGoogleSignIn, onGoogleButtonPress, logout } from '@/shared/services/auth/index';
import Constants from 'expo-constants';
import { ensureUserIndexOnLogin } from '@/services/users';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/Settings/styles';

export default function Auth() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  useEffect(() => {
    if (user) {
      ensureUserIndexOnLogin().catch(() => {});
    }
  }, [user]);

    const colors = useThemeStore((s) => s.colors);
    const styles = React.useMemo(() => getStyles(colors), [colors]);

  configureGoogleSignIn('608733335623-k857u9k0p2t6gd52k9uthr76jbm001m3.apps.googleusercontent.com');

  // Handle user state changes
  function handleAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;

  if (!user) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => onGoogleButtonPress()}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: colors.inputBackground,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: 10,
          }}
        >
          <Text style={{ color: colors.text }}>Увійти за допомогою Google</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.photoURL }} style={{ height: 130, width: 130, borderRadius: 150, marginLeft: 10 }} />
      <Text>Вітаємо, {user.email}!</Text>
      <TouchableOpacity
        onPress={() => logout()}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: colors.inputBackground,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          marginTop: 10,
        }}
      >
        <Text style={{ color: colors.text }}>Вийти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({

});