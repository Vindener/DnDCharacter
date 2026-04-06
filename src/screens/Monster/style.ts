import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, padding: sp(16), backgroundColor: c.background },
    photo: { width: '100%', height: 200, borderRadius: rd(8), marginBottom: sp(12) },
    placeholderPhoto: {
      width: '100%',
      height: 200,
      borderRadius: rd(8),
      backgroundColor: c.inputBackground,
      marginBottom: sp(12),
    },
    photoButtonsRow: { flexDirection: 'row', marginBottom: sp(12) },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: sp(12) },
    name: { fontSize: fs(24), fontWeight: 'bold', color: c.text },
    nameInput: { flex: 1, marginRight: sp(8) },
    label: { color: c.text, marginTop: sp(8) },
    input: { backgroundColor: c.card, color: c.text, padding: sp(8), borderRadius: rd(6), width: '100%' },
    sectionTitle: { marginTop: sp(12), color: c.textSecondary, fontSize: fs(16) },
    value: { color: c.text },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: sp(8) },
    statBox: {
      flex: 1,
      backgroundColor: c.card,
      alignItems: 'center',
      padding: sp(8),
      borderRadius: rd(6),
      marginRight: sp(8),
    },
    statName: { color: c.textSecondary, fontSize: fs(12) },
    statValue: { color: c.text, fontSize: fs(16), fontWeight: '600' },
    statInput: { backgroundColor: c.card, color: c.text, width: 40, padding: sp(2), borderRadius: rd(4), textAlign: 'center' },
    textArea: {
      backgroundColor: c.card,
      color: c.text,
      padding: sp(8),
      borderRadius: rd(6),
      minHeight: 80,
      width: '100%',
    },
    collapsibleBlock: {
      marginTop: sp(10),
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: sp(10),
      gap: sp(6),
    },
    collapseButton: {
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      alignSelf: 'flex-start',
      paddingVertical: sp(5),
      paddingHorizontal: sp(8),
      backgroundColor: c.background,
    },
    collapseButtonText: {
      color: c.text,
      fontWeight: '700',
      fontSize: fs(12),
    },
  });


