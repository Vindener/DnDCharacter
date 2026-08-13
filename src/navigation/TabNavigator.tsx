import React, { JSX, useEffect, useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainerRef, StackActions, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import Character from '../screens/Character/Character';
import DiceRoller from '../screens/DiceRoller/DiceRoller';
import Dice from '../screens/Dice/Dice';
import Home from '../screens/Home/Home';
import Settings from '@/screens/Settings/Settings';
import Header from '@/modules/Header/Header';
import CreateCharacter from '@/screens/CreateCharacter/CreateCharacter';
import { CharacterViewModel } from '@/types/Character';
import Spellbook from '@/screens/Spellbook/Spellbook';
import LegalLicenses from '@/screens/LegalLicenses/LegalLicenses';
import UpdateHistory from '@/screens/UpdateHistory/UpdateHistory';
import type { SpellbookRouteParams } from '@/navigation/sharedTypes';

export type TabStackParamList = {
  Home: undefined;
  DiceRoller: undefined;
  Dice: { sides: number };
  // TODO - temporary fix, add proper typing
  // CharacterSheet: { character: CharacterData; onUpdateCharacter?: (updated: any) => void };
  Character: {
    character: CharacterViewModel;
  };
  CreateCharacter: undefined;
  Spellbook: SpellbookRouteParams;
  Settings: undefined;
  LegalLicenses: undefined;
  UpdateHistory: undefined;
};

const Stack = createStackNavigator<TabStackParamList>();

export default function TabNavigator(): JSX.Element {
  const { t } = useTranslation('navigation');
  const navigation = useNavigation();
  const stackRef = useRef<NavigationContainerRef<TabStackParamList>>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      stackRef.current?.dispatch(StackActions.popToTop());
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <Stack.Navigator id={undefined}>
      <Stack.Screen name='Home' component={Home} options={{ header: () => <Header /> }} />
      <Stack.Screen name='DiceRoller' component={DiceRoller} options={{ title: t('diceRoller') }} />
      <Stack.Screen name='Dice' component={Dice} options={{ title: t('dice') }} />
      <Stack.Screen name='Character' component={Character} options={{ title: t('characterSheet') }} />
      <Stack.Screen name='CreateCharacter' component={CreateCharacter} options={{ title: t('createCharacter') }} />
      <Stack.Screen name='Spellbook' component={Spellbook} options={{ title: t('spellbook') }} />
      <Stack.Screen name='Settings' component={Settings} options={{ title: t('settings'), header: () => <Header /> }} />
      <Stack.Screen name='LegalLicenses' component={LegalLicenses} options={{ title: t('legalLicenses') }} />
      <Stack.Screen name='UpdateHistory' component={UpdateHistory} options={{ title: t('updateHistory') }} />
    </Stack.Navigator>
  );
}
