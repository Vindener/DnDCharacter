import React, { useEffect, useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainerRef, StackActions, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DM from '@/screens/DM/DM';
import LootGenerator from '@/screens/DM/LootGenerator/LootGenerator';
import EncounterCalculator from '@/screens/DM/EncounterCalculator/EncounterCalculator';
import DMSharedUpdates from '@/screens/DM/DMSharedUpdates';
import DMPartyOverview from '@/screens/DM/DMPartyOverview';
import DMQuickEdit from '@/screens/DM/DMQuickEdit';
import DMCampaignNotes from '@/screens/DM/DMCampaignNotes';
import DMEncounterPrep from '@/screens/DM/DMEncounterPrep';
import Header from '@/modules/Header/Header';
import type { EncounterPrepMonsterSeed } from '@/dm/domain/types';

export type DMStackParamList = {
  DMHome: undefined;
  LootGenerator: undefined;
  EncounterCalculator: undefined;
  DMSharedUpdates: undefined;
  DMPartyOverview: undefined;
  DMQuickEdit: { characterId: string };
  DMCampaignNotes: { campaignId?: string } | undefined;
  DMEncounterPrep: { campaignId?: string; initialMonster?: EncounterPrepMonsterSeed; initialMonsters?: EncounterPrepMonsterSeed[] } | undefined;
};

const Stack = createStackNavigator<DMStackParamList>();

export default function DMNavigator() {
  const { t } = useTranslation('navigation');
  const navigation = useNavigation();
  const stackRef = useRef<NavigationContainerRef<DMStackParamList>>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      stackRef.current?.dispatch(StackActions.popToTop());
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <Stack.Navigator id={undefined}>
      <Stack.Screen name='DMHome' component={DM} options={{ header: () => <Header /> }} />
      <Stack.Screen name='LootGenerator' component={LootGenerator} options={{ title: t('lootGenerator') }} />
      <Stack.Screen name='EncounterCalculator' component={EncounterCalculator} options={{ title: t('encounterCalculator') }} />
      <Stack.Screen name='DMSharedUpdates' component={DMSharedUpdates} options={{ title: t('dmSharedUpdates') }} />
      <Stack.Screen name='DMPartyOverview' component={DMPartyOverview} options={{ title: t('dmPartyOverview') }} />
      <Stack.Screen name='DMQuickEdit' component={DMQuickEdit} options={{ title: t('dmQuickEdit') }} />
      <Stack.Screen name='DMCampaignNotes' component={DMCampaignNotes} options={{ title: t('dmCampaignNotes') }} />
      <Stack.Screen name='DMEncounterPrep' component={DMEncounterPrep} options={{ title: t('dmEncounterPrep') }} />
    </Stack.Navigator>
  );
}
