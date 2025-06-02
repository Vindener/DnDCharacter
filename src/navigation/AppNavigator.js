import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";

import HomeScreen from "../screens/HomeScreen";
import DiceRollerScreen from "../screens/DiceRollerScreen";
import CharacterSheetScreen from "../screens/CharacterSheetScreen";
import CreateCharacterScreen from "../screens/CreateCharacterScreen";
import TestScreen from "../screens/TestScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Головна" component={HomeScreen} />
        <Stack.Screen name="DiceRoller" component={DiceRollerScreen} options={{ title: "Кидок кубика" }} />
        <Stack.Screen name="CharacterSheet" component={CharacterSheetScreen} options={{ title: "Лист персонажа" }} />
        <Stack.Screen name="CreateCharacter" component={CreateCharacterScreen} options={{ title: "Створити персонажа" }} />
        <Stack.Screen name="Test" component={TestScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
