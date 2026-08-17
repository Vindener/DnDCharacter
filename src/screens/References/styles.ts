import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: sp(14),
      paddingBottom: sp(28),
      gap: sp(12),
    },
    headerBlock: {
      backgroundColor: c.card,
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      padding: sp(14),
      gap: sp(6),
      elevation: 1,
    },
    title: {
      color: c.text,
      fontSize: fs(22),
      lineHeight: fs(28),
      fontWeight: '800',
    },
    hint: {
      color: c.textSecondary,
      fontSize: fs(13),
      lineHeight: fs(18),
      fontWeight: '600',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(10),
    },
    card: {
      width: '48%',
      minHeight: 150,
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: sp(12),
      gap: sp(8),
      elevation: 1,
    },
    cardDisabled: {
      opacity: 0.58,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: sp(8),
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      borderRadius: rd(99),
      backgroundColor: c.inputBackground,
      paddingVertical: sp(4),
      paddingHorizontal: sp(8),
    },
    badgeText: {
      color: c.text,
      fontSize: fs(10),
      fontWeight: '800',
    },
    cardTitle: {
      color: c.text,
      fontSize: fs(15),
      lineHeight: fs(20),
      fontWeight: '800',
    },
    cardDescription: {
      color: c.textSecondary,
      fontSize: fs(12),
      lineHeight: fs(17),
      fontWeight: '600',
    },
    detailText: {
      color: c.text,
      fontSize: fs(11),
      lineHeight: fs(16),
      fontWeight: '600',
    },
  });
