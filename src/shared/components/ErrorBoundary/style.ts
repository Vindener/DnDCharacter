import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
      paddingHorizontal: sp(20),
      gap: sp(12),
    },
    title: {
      textAlign: 'center',
    },
    message: {
      textAlign: 'center',
    },
    restartButton: {
      marginTop: sp(8),
      minWidth: sp(160),
    },
  });
