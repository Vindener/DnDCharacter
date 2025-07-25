import React, { JSX, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StackActions, useNavigation } from '@react-navigation/native';

import Character from '../screens/Character/Character';
import DiceRoller from '../screens/DiceRoller/DiceRoller';
import Home from '../screens/Home/Home';
import Settings from '@/screens/Settings/Settings';
import Header from '@/modules/Header/Header';
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
  CreateCharacter: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<TabStackParamList>();

export default function TabNavigator(): JSX.Element {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      navigation.dispatch(StackActions.popToTop());
    });
    return unsubscribe;
  }, [navigation]);

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
