import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  menuButton: { fontSize: 24, paddingHorizontal: 8, color: c.text },
});
