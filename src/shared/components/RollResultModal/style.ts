import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    rollResult: {
      color: c.text,
      textAlign: 'center',
    },
    criticalSuccess: {
      color: 'green',
      textAlign: 'center',
      fontWeight: 'bold',
    },
    criticalFailure: {
      color: 'red',
      textAlign: 'center',
      fontWeight: 'bold',
    },
    previousBlock: {
      marginTop: 12,
      alignItems: 'center',
    },
    previousTitle: {
      fontSize: 14,
      color: c.textSecondary,
    },
    previousText: {
      fontSize: 16,
      fontWeight: '500',
      color: c.text,
    },
    rerollButton: {
      marginTop: 10,
      padding: 10,
      backgroundColor: '#6200EE',
      borderRadius: 5,
      alignSelf: 'center',
    },
    rerollButtonText: { color: c.text, fontSize: 16 },
  });
