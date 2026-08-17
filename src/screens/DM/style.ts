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
      padding: sp(14),
      paddingBottom: 24,
      gap: sp(10),
    },
    card: {
      borderRadius: rd(14),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: sp(12),
      gap: sp(8),
      elevation: 1,
    },
    title: {
      color: c.text,
      fontSize: fs(17),
      fontWeight: '700',
    },
    hint: {
      color: c.textSecondary,
      fontSize: fs(12),
    },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(8),
    },
    statChip: {
      borderRadius: rd(99),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(5),
      paddingHorizontal: sp(10),
    },
    statChipText: {
      color: c.text,
      fontSize: fs(11),
      fontWeight: '700',
    },
    laneGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(8),
    },
    laneButton: {
      width: '48%',
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      paddingHorizontal: sp(10),
      alignItems: 'center',
      gap: sp(4),
    },
    laneButtonText: {
      color: c.text,
      fontWeight: '700',
      fontSize: fs(12),
      textAlign: 'center',
    },
    updateRow: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      padding: sp(10),
      gap: sp(2),
    },
    updateTitle: {
      color: c.text,
      fontWeight: '700',
      fontSize: fs(13),
    },
    updateMeta: {
      color: c.textSecondary,
      fontSize: fs(12),
    },
    authButton: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      alignItems: 'center',
      marginTop: sp(4),
    },
    authButtonText: {
      color: c.text,
      fontWeight: '700',
    },
    topActionButton: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      paddingHorizontal: sp(12),
      marginTop: sp(4),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sp(8),
    },
    topActionButtonText: {
      color: c.text,
      fontWeight: '700',
      fontSize: fs(12),
    },
    modalLabel: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '600',
      marginTop: sp(4),
      marginBottom: sp(4),
    },
    modalInput: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: rd(8),
      paddingVertical: sp(10),
      paddingHorizontal: sp(10),
      color: c.text,
      marginBottom: sp(8),
    },
  });
