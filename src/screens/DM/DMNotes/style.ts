import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.background },
    noteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: c.border,
    },
    noteInfo: { flex: 1 },
    noteTitle: { color: c.text, fontSize: 16, fontWeight: 'bold' },
    noteCampaign: { color: c.textSecondary, fontSize: 14 },
    noteDate: { color: c.textSecondary, fontSize: 12 },
    deleteBtn: { marginLeft: 8 },
    addButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    addText: { marginLeft: 8, color: '#28a745', fontSize: 16 },
  });

export const getEditStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.background },
    label: { color: c.text, marginBottom: 4, fontSize: 16 },
    input: {
      backgroundColor: c.inputBackground,
      color: c.text,
      padding: 8,
      borderRadius: 5,
      marginBottom: 8,
      width:'100%',
    },
    dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    dateText: { marginLeft: 4, color: c.textSecondary, fontSize: 12 },
  });
