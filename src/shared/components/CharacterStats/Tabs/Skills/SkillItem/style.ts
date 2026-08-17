import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
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
    rollButton: {
      backgroundColor: c.inputBackground,
      padding: sp(10),
      borderRadius: rd(5),
      marginLeft: sp(10),
    },
    rollButtonText: { color: c.text, fontSize: fs(16) },
  });
