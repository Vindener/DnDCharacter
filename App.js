import React from 'react';
import { CharacterProvider } from './src/context/CharacterContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <CharacterProvider>
        <AppNavigator />
      </CharacterProvider>
    </ThemeProvider>
  );
}
