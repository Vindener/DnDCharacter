import React, { JSX } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import Character from '../screens/Character/Character';
import DiceRoller from '../screens/DiceRoller/DiceRoller';
import Home from '../screens/Home/Home';
import Settings from '@/screens/Settings/Settings';
import Header from '@/modules/Header/Header';
import { useThemeContext } from '@/context/ThemeContext';
import CreateCharacter from '@/screens/CreateCharacter/CreateCharacter';
import { CharacterDto } from '@/types/Character';

export type TabStackParamList = {
  Home: undefined;
  DiceRoller: undefined;
  // TODO - temporary fix, add proper typing
  // CharacterSheet: { character: CharacterData; onUpdateCharacter?: (updated: any) => void };
  Character: {
    character: CharacterDto;
  };
  CreateCharacter: { onCreateCharacter: (newChar: any) => void };
  Settings: undefined;
};

const Stack = createStackNavigator<TabStackParamList>();

export default function TabNavigator(): JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen name='Home' component={Home} options={{ header: () => <Header /> }} />
      <Stack.Screen name='DiceRoller' component={DiceRoller} options={{ title: 'Кидок кубика' }} />
      <Stack.Screen name='Character' component={Character} options={{ title: 'Лист персонажа' }} />
      <Stack.Screen name='CreateCharacter' component={CreateCharacter} options={{ title: 'Створити персонажа' }} />
      <Stack.Screen name='Settings' component={Settings} options={{ title: 'Settings', header: () => <Header /> }} />
    </Stack.Navigator>
  );
}
