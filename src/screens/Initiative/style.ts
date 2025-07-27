import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.background },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      height: 56,
    },
    order: { color: c.text, width: 24, textAlign: 'center' },
    inputName: {
      flex: 1,
      backgroundColor: c.inputBackground,
      color: c.text,
      padding: 8,
      borderRadius: 5,
      marginRight: 8,
    },
    inputRoll: {
      width: 60,
      backgroundColor: c.inputBackground,
      color: c.text,
      padding: 8,
      borderRadius: 5,
      textAlign: 'center',
    },
    rowContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    addButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    addText: { marginLeft: 8, color: '#28a745', fontSize: 16 },
    moveButtons: { flexDirection: 'row', marginLeft: 8 },
  });
