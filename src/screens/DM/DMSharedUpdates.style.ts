import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      padding: sp(14),
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
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(6),
    },
    filterChip: {
      borderRadius: rd(99),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(5),
      paddingHorizontal: sp(10),
    },
    filterChipActive: {
      borderColor: c.text,
      backgroundColor: c.text,
    },
    filterChipText: {
      color: c.text,
      fontSize: fs(11),
      fontWeight: '700',
    },
    filterChipTextActive: {
      color: c.background,
    },
    itemCard: {
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      padding: sp(10),
      gap: sp(6),
      marginBottom: sp(10),
    },
    itemTitle: {
      color: c.text,
      fontSize: fs(14),
      fontWeight: '700',
    },
    itemMeta: {
      color: c.textSecondary,
      fontSize: fs(12),
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(6),
    },
    statusChip: {
      borderRadius: rd(99),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingVertical: sp(3),
      paddingHorizontal: sp(8),
    },
    statusChipText: {
      color: c.text,
      fontSize: fs(11),
      fontWeight: '700',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: sp(6),
      flexWrap: 'wrap',
    },
    historyBox: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: sp(8),
      gap: sp(4),
    },
    historyText: {
      color: c.textSecondary,
      fontSize: fs(11),
      lineHeight: 15,
    },
    actionButton: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingVertical: sp(8),
      paddingHorizontal: sp(10),
    },
    actionButtonText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '700',
    },
    emptyText: {
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: sp(20),
    },
  });


