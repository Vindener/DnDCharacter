import React, { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, View, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useAuth, configureGoogleSignIn, onGoogleButtonPress, logout } from '@/shared/services/auth/index';
import Constants from 'expo-constants';
import { ensureUserIndexOnLogin } from '@/services/users';


export default function Auth() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  useEffect(() => {
    if (user) {
      ensureUserIndexOnLogin().catch(() => {});
    }
  }, [user]);


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
        <Button title='Увійти за допомогою Google' onPress={() => onGoogleButtonPress()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.photoURL }} style={{ height: 120, width: 120, borderRadius: 150, marginLeft: 50 }} />
      <Text>Вітаємо, {user.email}!</Text>
      <Button title='Вийти' onPress={() => logout()} />
    </View>
  );
}

const styles = StyleSheet.create({

});
