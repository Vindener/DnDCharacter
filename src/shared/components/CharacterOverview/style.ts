import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    content: { flex: 1, minHeight: 60 },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: sp(12),
    },
    attributes: {
      color: c.text,
    },
  });
