import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: sp(8),
      height: 56,
    },
    rowDefeated: {
      opacity: 0.55,
    },
    rowContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    order: { color: c.text, width: 24, textAlign: 'center' },
    inputName: {
      flex: 1,
      backgroundColor: c.inputBackground,
      color: c.text,
      padding: sp(8),
      borderRadius: rd(5),
      marginRight: sp(8),
    },
    inputRoll: {
      width: 60,
      backgroundColor: c.inputBackground,
      color: c.text,
      padding: sp(8),
      borderRadius: rd(5),
      textAlign: 'center',
      marginLeft: sp(4),
    },
    inputHits: {
      width: 70,
      backgroundColor: c.inputBackground,
      color: c.text,
      padding: sp(8),
      borderRadius: rd(5),
      textAlign: 'center',
      marginLeft: sp(8),
    },
    rollDiceButton: {
      width: 60,
      height: sp(36),
      backgroundColor: c.inputBackground,
      borderRadius: rd(5),
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: sp(4),
    },
    moveButtons: { flexDirection: 'row', marginLeft: sp(8) },
    defeatedButton: {
      padding: sp(8),
      marginLeft: sp(4),
    },
    deleteButton: {
      padding: sp(8),
      marginLeft: sp(8),
    },
    heroItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: sp(10),
    },
    heroItemText: {
      marginLeft: sp(8),
      color: c.text,
      fontSize: fs(16),
    },
  });
