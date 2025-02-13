import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "./components/pages/HomeScreen";
import DiceRollerScreen from "./components/pages/DiceRollerScreen";
import CharacterSheetScreen from "./components/pages/CharacterSheetScreen";
import Test from "./components/pages/Test";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Головна" component={HomeScreen} />
        <Stack.Screen name="DiceRoller" component={DiceRollerScreen} options={{ title: "Кидок кубика" }} />
        <Stack.Screen name="CharacterSheet" component={CharacterSheetScreen} options={{ title: "Лист персонажа" }} />
        <Stack.Screen name="Test" component={Test} options={{ title: "Test" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
