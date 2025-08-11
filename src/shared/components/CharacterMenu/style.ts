import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  menuButton: { fontSize: 24, paddingHorizontal: 8, color: c.text },
  adjustButton: {
    backgroundColor: c.inputBackground,
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  adjustText: { color: c.text, fontSize: 20 },
});
