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
    rowContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
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
      marginLeft: 4,
    },
    inputHits: {
      width: 70,
      backgroundColor: c.inputBackground,
      color: c.text,
      padding: 8,
      borderRadius: 5,
      textAlign: 'center',
      marginLeft: 8,
    },
    moveButtons: { flexDirection: 'row', marginLeft: 8 },
    deleteButton: {
      padding: 8,
      marginLeft: 8,
    },
    bottomBar: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
    },
    addButton: { flexDirection: 'row', alignItems: 'center' },
    addText: { marginLeft: 8, color: '#28a745', fontSize: 16 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center' },
    checkboxLabel: { marginLeft: 8, color: c.text },
    addHeroButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 16,
    },
    addHeroText: {
      marginLeft: 6,
      color: c.text,
      fontSize: 14,
    },

    heroItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    heroItemText: {
      marginLeft: 8,
      color: c.text,
      fontSize: 16,
    },
  });
