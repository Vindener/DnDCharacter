import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TabNavigator from '@/navigation/TabNavigator';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import useThemeStore from '@/context/Theme-store';
import Header from '@/modules/Header/Header';
import Initiative from '@/screens/Initiative/Initiative';
import DMNavigator from '@/navigation/DMNavigator';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import BestiaryNavigator from '@/navigation/BestiaryNavigator';
import Support from '@/screens/Support/Support';
import type { InitiativeSeed } from '@/types/DM';

export type AppStackParamList = {
  Heroes: NavigatorScreenParams<TabStackParamList> | undefined;
  Initiative: { seed?: InitiativeSeed } | undefined;
  DM: NavigatorScreenParams<DMStackParamList> | undefined;
  Bestiary: undefined;
  Support: undefined;
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
      case 'Initiative':
        return 'bonfire-outline';
      case 'DM':
        return 'people-outline';
      case 'Bestiary':
        return 'skull-outline';
      case 'Support':
        return 'heart-outline';
      default:
        return 'ellipse';
    }
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        id={undefined}
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
        {/* <Stack.Screen name='Library' component={EmptyPlaceholder} /> */}
        <Stack.Screen name='Heroes' component={TabNavigator} options={{ headerShown: false, title: 'Герої' }} />
        <Stack.Screen name='Initiative' component={Initiative} options={{ title: 'Інціатива' }} />
        <Stack.Screen name='DM' component={DMNavigator} options={{ headerShown: false }} />
        <Stack.Screen name='Bestiary' component={BestiaryNavigator} options={{ headerShown: false, title: 'Бестіарій' }} />
        <Stack.Screen name='Support' component={Support} options={{ title: 'Підтримка' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


