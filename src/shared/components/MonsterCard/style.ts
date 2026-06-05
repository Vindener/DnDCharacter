import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.card,
      padding: sp(12),
      borderRadius: rd(8),
      marginBottom: sp(12),
      alignItems: 'flex-start',
      borderWidth: 1,
      borderColor: c.border,
      elevation: 1,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: rd(6),
      marginRight: sp(12),
      backgroundColor: c.inputBackground,
    },
    info: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: sp(8),
    },
    name: {
      color: c.text,
      fontSize: fs(16),
      fontWeight: '600',
      flex: 1,
    },
    meta: {
      color: c.textSecondary,
      fontSize: fs(13),
      marginTop: sp(2),
    },
    quickRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(8),
      marginTop: sp(6),
    },
    quickMeta: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '600',
    },
    iconButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: rd(18),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBackground,
    },
    statGrid: {
      flexDirection: 'row',
      gap: sp(6),
      marginTop: sp(8),
    },
    statPill: {
      flex: 1,
      minHeight: 42,
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(5),
      paddingHorizontal: sp(6),
    },
    statLabel: {
      color: c.textSecondary,
      fontSize: fs(10),
      fontWeight: '700',
    },
    statValue: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '700',
    },
    attackLine: {
      color: c.text,
      fontSize: fs(12),
      marginTop: sp(8),
      fontWeight: '600',
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(6),
      marginTop: sp(10),
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(4),
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBackground,
      paddingVertical: sp(6),
      paddingHorizontal: sp(8),
    },
    actionText: {
      color: c.text,
      fontSize: fs(11),
      fontWeight: '700',
    },
    customMeta: {
      color: c.warning,
      fontSize: fs(12),
      fontWeight: '700',
      marginTop: sp(4),
    },
    deleteButton: {
      marginLeft: sp(8),
      marginTop: sp(4),
      padding: sp(4),
    },
  });


