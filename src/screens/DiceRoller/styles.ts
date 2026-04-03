import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 20, marginBottom: 16, textAlign: 'center' },
  diceButton: {
    padding: 16,
    marginVertical: 4,
    backgroundColor: c.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  diceText: { fontSize: 18, color: c.text },
  result: { fontSize: 22, textAlign: 'center', marginTop: 16, color: c.text },
});

