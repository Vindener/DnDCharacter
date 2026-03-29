import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      padding: 14,
      gap: 10,
    },
    card: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: 12,
      gap: 8,
      elevation: 1,
    },
    title: {
      color: c.text,
      fontSize: 17,
      fontWeight: '700',
    },
    hint: {
      color: c.textSecondary,
      fontSize: 12,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    filterChip: {
      borderRadius: 99,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    filterChipActive: {
      borderColor: c.text,
      backgroundColor: c.text,
    },
    filterChipText: {
      color: c.text,
      fontSize: 11,
      fontWeight: '700',
    },
    filterChipTextActive: {
      color: c.background,
    },
    itemCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      padding: 10,
      gap: 6,
      marginBottom: 10,
    },
    itemTitle: {
      color: c.text,
      fontSize: 14,
      fontWeight: '700',
    },
    itemMeta: {
      color: c.textSecondary,
      fontSize: 12,
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    statusChip: {
      borderRadius: 99,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    statusChipText: {
      color: c.text,
      fontSize: 11,
      fontWeight: '700',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
    },
    actionButton: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    actionButtonText: {
      color: c.text,
      fontSize: 12,
      fontWeight: '700',
    },
    emptyText: {
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 20,
    },
  });
