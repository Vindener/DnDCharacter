import React, { useEffect, useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainerRef, StackActions, useNavigation } from '@react-navigation/native';
import DM from '@/screens/DM/DM';
import LootGenerator from '@/screens/DM/LootGenerator/LootGenerator';
import EncounterCalculator from '@/screens/DM/EncounterCalculator/EncounterCalculator';
import DMNotes from '@/screens/DM/DMNotes/DMNotes';
import DMNoteEdit from '@/screens/DM/DMNotes/DMNoteEdit';
import DMSharedUpdates from '@/screens/DM/DMSharedUpdates';
import Header from '@/modules/Header/Header';

export type DMStackParamList = {
  DMHome: undefined;
  LootGenerator: undefined;
  EncounterCalculator: undefined;
  DMNotes: undefined;
  DMNoteEdit: { id: string };
  DMSharedUpdates: undefined;
};

const Stack = createStackNavigator<DMStackParamList>();

export default function DMNavigator() {
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
      <Stack.Screen name='LootGenerator' component={LootGenerator} options={{ title: 'Генератор добичі' }} />
      <Stack.Screen name='EncounterCalculator' component={EncounterCalculator} options={{ title: 'Калькулятор бою' }} />
      <Stack.Screen name='DMNotes' component={DMNotes} options={{ title: 'Нотатки' }} />
      <Stack.Screen name='DMNoteEdit' component={DMNoteEdit} options={{ title: 'Редагувати нотатку' }} />
      <Stack.Screen name='DMSharedUpdates' component={DMSharedUpdates} options={{ title: 'Shared Updates' }} />
    </Stack.Navigator>
  );
}
