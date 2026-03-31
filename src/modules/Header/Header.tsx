import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import type { AppStackParamList } from '@/navigation/AppNavigator';
import type { TabStackParamList } from '@/navigation/TabNavigator';
import { useAuth } from '@/shared/services/auth/auth';

type Navigation = StackNavigationProp<AppStackParamList & TabStackParamList>;

const Header = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { user } = useAuth();

  const providerPhoto = user?.photoURL || user?.providerData?.find(Boolean)?.photoURL || null;

  const getTitle = () => {
    switch (route.name) {
      case 'Home':
        return 'Мої персонажі';
      case 'Settings':
        return 'Налаштування';
      case 'Initiative':
        return 'Інціатива';
      case 'DMHome':
        return 'ДМ головна';
      case 'List':
        return 'Бестіарій';
      case 'Support':
        return 'Підтримка проекту';
      default:
        return route.name;
    }
  };

  const openSettings = () => {
    (navigation as any).navigate('Heroes', { screen: 'Settings' });
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={openSettings}>
        <View style={styles.logoCircle}>
          {providerPhoto ? (
            <Image source={{ uri: providerPhoto }} style={styles.logoAvatar} resizeMode='cover' />
          ) : (
            <Text style={styles.logoText}>D</Text>
          )}
        </View>
      </TouchableOpacity>
      <Text style={styles.title}>{getTitle()}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
};

export default Header;
