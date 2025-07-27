import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';
import type { AppStackParamList } from '@/navigation/AppNavigator';
import type { TabStackParamList } from '@/navigation/TabNavigator';

type Navigation = StackNavigationProp<AppStackParamList & TabStackParamList>;

const Header = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const getTitle = () => {
    switch (route.name) {
      case 'Home':
        return 'My Characters';
      case 'Settings':
        return 'Settings';
      default:
        return route.name;
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.navigate('Heroes', { screen: 'Settings' })}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>D</Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.title}>{getTitle()}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
};

export default Header;
