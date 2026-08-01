import React, { useEffect, useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainerRef, StackActions, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import References from '@/screens/References/References';
import Bestiary from '@/screens/Bestiary/Bestiary';
import Monster from '@/screens/Monster/Monster';
import Spellbook from '@/screens/Spellbook/Spellbook';
import Header from '@/modules/Header/Header';
import type { MonsterDto } from '@/types/Monster';
import type { SpellbookRouteParams } from '@/navigation/sharedTypes';

export type ReferencesStackParamList = {
  ReferencesHome: undefined;
  List: { campaignId?: string } | undefined;
  Monster: { monster: MonsterDto };
  Spellbook: SpellbookRouteParams;
};

const Stack = createStackNavigator<ReferencesStackParamList>();

export default function ReferencesNavigator() {
  const { t } = useTranslation('navigation');
  const navigation = useNavigation();
  const stackRef = useRef<NavigationContainerRef<ReferencesStackParamList>>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      stackRef.current?.dispatch(StackActions.popToTop());
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <Stack.Navigator id={undefined}>
      <Stack.Screen name='ReferencesHome' component={References} options={{ header: () => <Header /> }} />
      <Stack.Screen name='List' component={Bestiary} options={{ header: () => <Header /> }} />
      <Stack.Screen name='Monster' component={Monster} options={{ title: t('monster') }} />
      <Stack.Screen name='Spellbook' component={Spellbook} options={{ title: t('spellbook') }} />
    </Stack.Navigator>
  );
}
