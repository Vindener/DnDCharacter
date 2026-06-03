import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    rollResult: {
      color: c.text,
      textAlign: 'center',
    },
    criticalSuccess: {
      color: c.success,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    criticalFailure: {
      color: c.danger,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    previousBlock: {
      marginTop: sp(12),
      alignItems: 'center',
    },
    previousTitle: {
      fontSize: fs(14),
      color: c.textSecondary,
    },
    previousText: {
      fontSize: fs(16),
      fontWeight: '500',
      color: c.text,
    },
    rerollButton: {
      marginTop: sp(10),
      padding: sp(10),
      backgroundColor: c.magic,
      borderRadius: rd(5),
      alignSelf: 'center',
    },
    rerollButtonText: { color: c.onMagic, fontSize: fs(16) },
  });



