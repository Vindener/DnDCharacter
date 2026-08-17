import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, padding: sp(16), backgroundColor: c.background },
    section: { color: c.text, fontSize: fs(18), marginBottom: sp(8) },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: sp(8) },
    inputSmall: {
      width: 70,
      backgroundColor: c.inputBackground,
      color: c.text,
      padding: sp(8),
      borderRadius: rd(5),
      marginRight: sp(8),
      textAlign: 'center',
    },
    inputName: { flex: 1, backgroundColor: c.inputBackground, color: c.text, padding: sp(8), borderRadius: rd(5), marginRight: sp(8) },
    addButton: { flexDirection: 'row', alignItems: 'center', marginBottom: sp(12) },
    addText: { marginLeft: sp(8), color: c.success, fontSize: fs(16) },
    deleteBtn: { marginLeft: sp(4) },
    result: { marginTop: sp(16) },
    resultText: { color: c.text, fontSize: fs(16), marginBottom: sp(4) },
  });
