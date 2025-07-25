import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  tabsContainer: { marginVertical: 20 },
  picker: {
    height: 50,
    color: c.text,
    backgroundColor: c.inputBackground,
    marginBottom: 10,
    borderRadius: 5,
  },
});
