import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import { fs } from '@/shared/styles/tokens';

const EmptyPlaceholder: React.FC = () => {
const colors = useThemeStore((s) => s.colors);
const styles = React.useMemo(
  () =>
StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.textSecondary,
    fontSize: fs(20),
    fontStyle: 'italic',
  },
}),
  [colors],
);
return (
  <View style={styles.container}>
    <Text style={styles.text}>Скоро буде...</Text>
  </View>
);
};

export default EmptyPlaceholder;


