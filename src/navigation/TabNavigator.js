import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../context/ThemeContext";

// Screens
import HomeScreen from "../screens/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import CreateCharacterScreen from "../screens/CreateCharacterScreen";
import CharacterSheetScreen from "../screens/CharacterSheetScreen";
import CustomHeader from "../components/CustomHeader";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function CharactersStack() {
  const screenOptions = { header: () => <CustomHeader /> };
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        options={{ header: () => <CustomHeader /> }}
        component={HomeScreen}
        options={({ navigation }) => ({
          title: "Головна",
          headerRight: () => (
            <Ionicons
              name="settings"
              size={24}
              color="white"
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate("Settings")}
            />
          ),
        })}
      />
      <Stack.Screen
        name="CreateCharacter"
        component={CreateCharacterScreen}
        options={{ header: () => <CustomHeader /> }}
      />
      <Stack.Screen
        name="Settings"
        options={{ header: () => <CustomHeader /> }}
        component={SettingsScreen}
        options={{ title: "Налаштування" }}
      />
      <Stack.Screen
        name="CharacterSheet"
        component={CharacterSheetScreen}
        options={{ header: () => <CustomHeader /> }}
      />
    </Stack.Navigator>
  );
}

export default function TabNavigator() {
  const { theme } = useThemeContext();

  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#ff2d55",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { backgroundColor: "#121212", borderTopWidth: 0 },
          tabBarIcon: ({ color, size }) => {
            let iconName;
            switch (route.name) {
              case "Бібліотека":
                iconName = "book-outline";
                break;
              case "Lists":
                iconName = "list-outline";
                break;
              case "Search":
                iconName = "search-outline";
                break;
              case "Герої":
                iconName = "person-outline";
                break;
              case "Гайд":
                iconName = "flag-outline";
                break;
              default:
                iconName = "ellipse";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Бібліотека" component={EmptyScreen} />
        {/* <Tab.Screen name="Lists" component={EmptyScreen} /> */}
        {/* <Tab.Screen name="Search" component={EmptyScreen} /> */}
        <Tab.Screen name="Герої" component={CharactersStack} />
        <Tab.Screen name="Гайд" component={EmptyScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

import EmptyPlaceholder from "../components/EmptyPlaceholder";

function EmptyScreen() {
  return <EmptyPlaceholder />;
}
