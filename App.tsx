import 'react-native-gesture-handler'; 
import React, { useEffect, useState} from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import 'expo-dev-client'
import { AuthProvider } from '@/shared/services/auth/auth';

export default function App() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppNavigator />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
