import React from 'react';
import { View, Text, Switch } from 'react-native';
import { styles } from '@/screens/Settings/styles';
import useThemeStore from '@/context/ThemeContext';

const Settings = () => {
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Темна тема</Text>
      <Switch value={isDark} onValueChange={toggleTheme} />
    </View>
  );
};

export default Settings;
