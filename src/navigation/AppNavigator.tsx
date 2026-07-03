import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabNavigator from '@/navigation/TabNavigator';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import useThemeStore from '@/context/Theme-store';
import Header from '@/modules/Header/Header';
import Initiative from '@/screens/Initiative/Initiative';
import DMNavigator from '@/navigation/DMNavigator';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import ReferencesNavigator from '@/navigation/ReferencesNavigator';
import type { ReferencesStackParamList } from '@/navigation/ReferencesNavigator';
import Support from '@/screens/Support/Support';
import type { InitiativeSeed } from '@/dm/domain/types';
import { sp } from '@/shared/styles/tokens';

export type AppStackParamList = {
  Heroes: NavigatorScreenParams<TabStackParamList> | undefined;
  Initiative: { seed?: InitiativeSeed } | undefined;
  DM: NavigatorScreenParams<DMStackParamList> | undefined;
  References: NavigatorScreenParams<ReferencesStackParamList> | undefined;
  Support: undefined;
};

const Stack = createBottomTabNavigator<AppStackParamList>();

export default function AppNavigator() {
  const { t } = useTranslation('navigation');
  const theme = useThemeStore((s) => s.theme);
  const colors = useThemeStore((s) => s.colors);
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, sp(6));

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  function getIconName(routeName: string): keyof typeof Ionicons.glyphMap {
    switch (routeName) {
      case 'Library':
        return 'book-outline';
      case 'Heroes':
        return 'person-outline';
      case 'Initiative':
        return 'bonfire-outline';
      case 'DM':
        return 'people-outline';
      case 'References':
        return 'book-outline';
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
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 0,
            height: 56 + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: sp(4),
          },
          tabBarIcon: ({ color, size }) => {
            const iconName = getIconName(route.name);
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        {/* <Stack.Screen name='Library' component={EmptyPlaceholder} /> */}
        <Stack.Screen name='Heroes' component={TabNavigator} options={{ headerShown: false, title: t('heroes') }} />
        <Stack.Screen name='Initiative' component={Initiative} options={{ title: t('initiative') }} />
        <Stack.Screen name='DM' component={DMNavigator} options={{ headerShown: false, title: t('dm') }} />
        <Stack.Screen name='References' component={ReferencesNavigator} options={{ headerShown: false, title: t('references') }} />
        <Stack.Screen name='Support' component={Support} options={{ title: t('support') }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


