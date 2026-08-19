import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions, NavigationState, NavigatorScreenParams } from '@react-navigation/native';
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
import { sp } from '@/shared/styles/tokens';

export type AppStackParamList = {
  Heroes: NavigatorScreenParams<TabStackParamList> | undefined;
  Initiative: { campaignId?: string } | undefined;
  DM: NavigatorScreenParams<DMStackParamList> | undefined;
  References: NavigatorScreenParams<ReferencesStackParamList> | undefined;
  Support: undefined;
};

const Stack = createBottomTabNavigator<AppStackParamList>();

// Campaign invite deep link (see app.json "scheme" + AndroidManifest.xml's mythgatednd
// intent-filter): "mythgatednd://join/CODE" opens straight to the redeem-invite modal on
// DMCampaigns, pre-filled with the code (DMCampaigns.tsx reads route.params.joinCode).
const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ['mythgatednd://', 'https://mythgatednd.pp.ua', 'https://www.mythgatednd.pp.ua'],
  config: {
    screens: {
      DM: {
        screens: {
          DMCampaigns: 'join/:joinCode',
        },
      },
    },
  },
};

export default function AppNavigator() {
  const { t } = useTranslation('navigation');
  const theme = useThemeStore((s) => s.theme);
  const colors = useThemeStore((s) => s.colors);
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const loadAnalyticsConsent = useThemeStore((s) => s.loadAnalyticsConsent);
  const loadFirebaseDebugToastsEnabled = useThemeStore((s) => s.loadFirebaseDebugToastsEnabled);
  const loadForceShowSyncStrip = useThemeStore((s) => s.loadForceShowSyncStrip);
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, sp(6));

  useEffect(() => {
    loadTheme();
    loadAnalyticsConsent();
    loadFirebaseDebugToastsEnabled();
    loadForceShowSyncStrip();
  }, [loadTheme, loadAnalyticsConsent, loadFirebaseDebugToastsEnabled, loadForceShowSyncStrip]);

  const isDark = useThemeStore((s) => s.isDark);
  const navigationStateRef = useRef<NavigationState | undefined>(undefined);
  const previousIsDark = useRef(isDark);
  // Android/New Architecture doesn't repaint rounded, solid-background Pressables on a
  // colors-only style change — remounting the navigation tree on theme toggle forces a
  // real repaint everywhere. We restore the captured nav state so this doesn't also
  // reset the user's current screen back to the initial route.
  const [containerKey, setContainerKey] = useState(0);

  useEffect(() => {
    if (previousIsDark.current !== isDark) {
      previousIsDark.current = isDark;
      setContainerKey((value) => value + 1);
    }
  }, [isDark]);

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
    <NavigationContainer
      key={containerKey}
      theme={theme}
      initialState={navigationStateRef.current}
      onStateChange={(state) => {
        navigationStateRef.current = state;
      }}
      linking={linking}
    >
      <Stack.Navigator
        id={undefined}
        backBehavior='history'
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
