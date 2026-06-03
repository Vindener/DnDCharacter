import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { color: c.text, fontSize: 16, flex: 1 },
  input: {
    backgroundColor: c.inputBackground,
    color: c.text,
    padding: 8,
    borderRadius: 5,
    width: 60,
    textAlign: 'center',
  },
  rollButton: {
    backgroundColor: c.inputBackground,
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  rollButtonText: { color: c.text, fontSize: 16 },
});
