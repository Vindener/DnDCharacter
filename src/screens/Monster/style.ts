import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.background },
    photo: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
    placeholderPhoto: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      backgroundColor: c.inputBackground,
      marginBottom: 12,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    name: { fontSize: 24, fontWeight: 'bold', color: c.text },
    nameInput: { flex: 1, marginRight: 8 },
    label: { color: c.text, marginTop: 8 },
    input: { backgroundColor: c.card, color: c.text, padding: 8, borderRadius: 6, width:'100%' },
    sectionTitle: { marginTop: 12, color: c.textSecondary, fontSize: 16 },
    value: { color: c.text },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    statBox: {
      flex: 1,
      backgroundColor: c.card,
      alignItems: 'center',
      padding: 8,
      borderRadius: 6,
      marginRight: 8,
    },
    statName: { color: c.textSecondary, fontSize: 12 },
    statValue: { color: c.text, fontSize: 16, fontWeight: '600' },
    statInput: { backgroundColor: c.card, color: c.text, width: 40, padding: 2, borderRadius: 4, textAlign: 'center' },
    textArea: {
      backgroundColor: c.card,
      color: c.text,
      padding: 8,
      borderRadius: 6,
      minHeight: 80,
      width:'100%'
    },
  });
