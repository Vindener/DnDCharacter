import React from 'react';
import { View, Text, Switch } from 'react-native';
import { getStyles } from '@/screens/Settings/styles';
import useThemeStore from '@/context/Theme-store';

const Settings = () => {
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Темна тема</Text>
      <Switch value={isDark} onValueChange={toggleTheme} />
    </View>
  );
};

export default Settings;
