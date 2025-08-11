import React from 'react';
import { View, Text } from 'react-native';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';

const LootGenerator: React.FC = () => {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Генератор добичі (в розробці)</Text>
    </View>
  );
};

export default LootGenerator;
