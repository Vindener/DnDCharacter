import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: sp(16),
      paddingBottom: 36,
      gap: sp(10),
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sp(4),
    },
    progressText: {
      color: c.textSecondary,
      fontSize: fs(12),
      fontWeight: '600',
    },
    title: {
      color: c.text,
      fontSize: fs(22),
      fontWeight: '700',
    },
    card: {
      backgroundColor: c.card,
      borderRadius: rd(14),
      borderWidth: 1,
      borderColor: c.border,
      padding: sp(12),
      gap: sp(8),
      elevation: 2,
    },
    sectionTitle: {
      color: c.text,
      fontSize: fs(18),
      fontWeight: '700',
    },
    sectionHint: {
      color: c.textSecondary,
      fontSize: fs(13),
    },
    label: {
      color: c.text,
      marginTop: sp(8),
      fontSize: fs(15),
      fontWeight: '600',
    },
    input: {
      backgroundColor: c.background,
      color: c.text,
      paddingHorizontal: sp(12),
      paddingVertical: sp(10),
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      marginTop: sp(4),
    },
    picker: {
      backgroundColor: c.background,
      color: c.text,
      marginTop: sp(4),
      borderRadius: rd(10),
      height: 50,
    },
    toggleRow: {
      flexDirection: 'row',
      gap: sp(8),
      marginTop: sp(8),
    },
    toggleButton: {
      flex: 1,
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleButtonActive: {
      backgroundColor: c.text,
      borderColor: c.text,
    },
    toggleButtonText: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: '700',
      textAlign: 'center',
    },
    toggleButtonTextActive: {
      color: c.background,
    },
    methodCard: {
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      padding: sp(12),
      gap: sp(6),
    },
    methodCardActive: {
      borderColor: c.text,
      backgroundColor: c.inputBackground,
    },
    methodTitle: {
      color: c.text,
      fontSize: fs(15),
      fontWeight: '700',
    },
    methodMeta: {
      color: c.textSecondary,
      fontSize: fs(13),
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: sp(8),
      gap: sp(8),
    },
    statLabel: {
      color: c.text,
      fontSize: fs(14),
      fontWeight: '600',
      width: 130,
    },
    statControl: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(6),
      paddingHorizontal: sp(10),
      minWidth: 36,
      alignItems: 'center',
    },
    statControlText: {
      color: c.text,
      fontWeight: '700',
    },
    statValue: {
      color: c.text,
      minWidth: 32,
      textAlign: 'center',
      fontWeight: '700',
      fontSize: fs(15),
    },
    helperText: {
      color: c.textSecondary,
      fontSize: fs(12),
      marginTop: sp(6),
    },
    warningText: {
      color: c.danger,
      fontSize: fs(12),
      marginTop: sp(6),
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: sp(12),
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingVertical: sp(6),
    },
    summaryLabel: {
      color: c.textSecondary,
      fontSize: fs(13),
      flex: 1,
    },
    summaryValue: {
      color: c.text,
      fontSize: fs(13),
      flex: 1,
      textAlign: 'right',
      fontWeight: '600',
    },
    infoBox: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      padding: sp(10),
      marginTop: sp(6),
      gap: sp(4),
    },
    navRow: {
      flexDirection: 'row',
      gap: sp(8),
      marginTop: sp(10),
    },
    navButton: {
      flex: 1,
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingVertical: sp(12),
      alignItems: 'center',
    },
    navButtonPrimary: {
      backgroundColor: c.text,
      borderColor: c.text,
    },
    navButtonDisabled: {
      opacity: 0.45,
    },
    navButtonText: {
      color: c.text,
      fontWeight: '700',
      fontSize: fs(14),
    },
    navButtonTextPrimary: {
      color: c.background,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(6),
      marginTop: sp(6),
    },
    chip: {
      borderRadius: rd(99),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(4),
      paddingHorizontal: sp(8),
    },
    chipText: {
      color: c.text,
      fontSize: fs(11),
      fontWeight: '600',
    },
  });



