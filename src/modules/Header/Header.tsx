import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import type { AppStackParamList } from '@/navigation/AppNavigator';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { useAuth } from '@/shared/services/auth/auth';
import { Text } from '@/shared/ui';

type Navigation = StackNavigationProp<AppStackParamList & TabStackParamList>;

const Header = () => {
  const { t } = useTranslation('navigation');
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { user } = useAuth();

  const providerPhoto = user?.photoURL || user?.providerData?.find(Boolean)?.photoURL || null;

  const getTitle = () => {
    switch (route.name) {
      case 'Home':
        return t('home');
      case 'Settings':
        return t('settings');
      case 'Initiative':
        return t('initiative');
      case 'DMHome':
        return t('dmHome');
      case 'ReferencesHome':
        return t('references');
      case 'List':
        return t('bestiary');
      case 'Spellbook':
        return t('spellbook');
      case 'Support':
        return t('supportProject');
      case 'LegalLicenses':
        return t('legalLicenses');
      default:
        return route.name;
    }
  };

  const openSettings = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Heroes',
        params: { screen: 'Settings' },
      }),
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={openSettings} android_ripple={{ color: colors.ripple }}>
          <View style={styles.logoCircle}>
            {providerPhoto ? (
              <Image source={{ uri: providerPhoto }} style={styles.logoAvatar} resizeMode='cover' />
            ) : (
              <Text style={styles.logoText}>M</Text>
            )}
          </View>
        </Pressable>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={styles.trailingSpacer} />
      </View>
    </SafeAreaView>
  );
};

export default Header;
