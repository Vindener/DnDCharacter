import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: c.background,
  },
  label: {
    color: c.text,
    marginTop: 12,
    fontSize: 16,
  },
  input: {
    backgroundColor: c.card,
    color: c.text,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
});
