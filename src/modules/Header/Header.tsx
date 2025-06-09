import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { styles } from './style';
import { TabStackParamList } from '@/navigation/TabNavigator';

type Navigation = StackNavigationProp<TabStackParamList>;

const Header = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();

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
      <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
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
