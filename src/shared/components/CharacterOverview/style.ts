import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  content: { flex: 1, minHeight: 60 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  attributes: {
    color: c.text,
  },
});
