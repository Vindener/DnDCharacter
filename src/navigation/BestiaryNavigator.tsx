import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Bestiary from '@/screens/Bestiary/Bestiary';
import Monster from '@/screens/Monster/Monster';
import Header from '@/modules/Header/Header';
import { MonsterDto } from '@/types/Monster';

export type BestiaryStackParamList = {
  List: undefined;
  Monster: { monster: MonsterDto };
};

const Stack = createStackNavigator<BestiaryStackParamList>();

export default function BestiaryNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name='List' component={Bestiary} options={{ header: () => <Header /> }} />
      <Stack.Screen name='Monster' component={Monster} options={{ title: 'Монстр' }} />
    </Stack.Navigator>
  );
}
