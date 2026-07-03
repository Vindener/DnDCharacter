import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getStyles } from './style';
import useThemeStore from '@/context/Theme-store';

const LootGenerator: React.FC = () => {
  const { t } = useTranslation('dm');
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('lootGenerator.placeholder')}</Text>
    </View>
  );
};

export default LootGenerator;
