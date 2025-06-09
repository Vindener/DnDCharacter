import React from 'react';
import { View, Text, Switch } from 'react-native';
import { styles } from '@/screens/Settings/styles';
import { useThemeContext } from '@/context/ThemeContext';

const Settings: React.FC = () => {
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Темна тема</Text>
      <Switch value={isDark} onValueChange={toggleTheme} />
    </View>
  );
};

export default Settings;
