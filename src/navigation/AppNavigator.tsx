import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Home from '../screens/Home/Home';
import CreateCharacter from '../screens/CreateCharacter/CreateCharacter';
import CharacterSheet from '../screens/Character/Character';
import { Character } from '@/types/Character';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Header from '@/modules/Header/Header';
import { Ionicons } from '@expo/vector-icons';
import Settings from '@/screens/Settings/Settings';
import EmptyPlaceholder from '@/shared/components/EmptyPlaceholder';
import TabNavigator from '@/navigation/TabNavigator';
import { useThemeContext } from '@/context/ThemeContext';

export type AppStackParamList = {
  Library: undefined;
  Heroes: { onCreateCharacter: (newChar: Character) => void };
  Guide: { character: Character; onUpdateCharacter: (updated: Character) => void };
  Settings: undefined;
};

const Stack = createBottomTabNavigator<AppStackParamList>();

export default function AppNavigator() {
  const { theme } = useThemeContext();

  function getIconName(routeName: string): keyof typeof Ionicons.glyphMap {
    switch (routeName) {
      case 'Library':
        return 'book-outline';
      case 'Heroes':
        return 'person-outline';
      case 'Guide':
        return 'flag-outline';
      default:
        return 'ellipse';
    }
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#ff2d55',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { backgroundColor: '#121212', borderTopWidth: 0 },
          tabBarIcon: ({ color, size }) => {
            const iconName = getIconName(route.name);
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Stack.Screen name='Library' component={EmptyPlaceholder} />
        <Stack.Screen name='Heroes' component={TabNavigator} />
        <Stack.Screen name='Guide' component={EmptyPlaceholder} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
