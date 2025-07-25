import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import EmptyPlaceholder from '@/shared/components/EmptyPlaceholder';
import TabNavigator from '@/navigation/TabNavigator';
import { CharacterDto } from '@/types/Character';
import useThemeStore from '@/context/Theme-store';
import Header from '@/modules/Header/Header';

export type AppStackParamList = {
  Library: undefined;
  Heroes: { onCreateCharacter: (newChar: CharacterDto) => void };
  Guide: { character: CharacterDto; onUpdateCharacter: (updated: CharacterDto) => void };
  Settings: undefined;
};

const Stack = createBottomTabNavigator<AppStackParamList>();

export default function AppNavigator() {
  const theme = useThemeStore((s) => s.theme);
  const colors = useThemeStore((s) => s.colors);
  const loadTheme = useThemeStore((s) => s.loadTheme);

  useEffect(() => {
    loadTheme();
  }, []);

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
          header: () => <Header />,
          tabBarActiveTintColor: '#ff2d55',
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.card, borderTopWidth: 0 },
          tabBarIcon: ({ color, size }) => {
            const iconName = getIconName(route.name);
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Stack.Screen name='Library' component={EmptyPlaceholder} />
        <Stack.Screen name='Heroes' component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name='Guide' component={EmptyPlaceholder} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
