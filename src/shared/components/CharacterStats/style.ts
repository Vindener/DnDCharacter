import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    tabsContainer: { marginVertical: 20 },
    picker: {
      height: 50,
      color: c.text,
      backgroundColor: c.inputBackground,
      marginBottom: sp(10),
      borderRadius: rd(5),
    },
  });
