import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  container: { padding: sp(20), backgroundColor: c.card, marginBottom:sp(20) },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: sp(10) },
  label: { color: c.text, fontSize: fs(16), flex: 1 },
  input: {
    backgroundColor: c.inputBackground,
    color: c.text,
    padding: sp(8),
    borderRadius: rd(5),
    width: 60,
    textAlign: 'center',
  },
  modifier: { color: c.text, fontSize: fs(16), marginLeft: sp(10), width: 40, textAlign: 'center' },
  rollButton: {
    backgroundColor: c.inputBackground,
    padding: sp(10),
    borderRadius: rd(5),
    marginLeft: sp(10),
  },
  rollButtonText: { color: c.text, fontSize: fs(16) },
  memoInput: {
    backgroundColor: c.inputBackground,
    color: c.text,
    padding: sp(10),
    borderRadius: rd(5),
    height: 150,
    textAlignVertical: 'top',
  },
});


