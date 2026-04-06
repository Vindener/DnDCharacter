import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  container: { flex: 1, padding: sp(16), justifyContent: 'center' },
  title: { fontSize: fs(20), marginBottom: sp(16), textAlign: 'center' },
  diceButton: {
    padding: sp(16),
    marginVertical: 4,
    backgroundColor: c.primary,
    borderRadius: rd(8),
    alignItems: 'center',
  },
  diceText: { fontSize: fs(18), color: c.text },
  result: { fontSize: fs(22), textAlign: 'center', marginTop: sp(16), color: c.text },
});



