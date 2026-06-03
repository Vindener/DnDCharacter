import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.card,
      padding: sp(12),
      borderRadius: rd(12),
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
    pinButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(4),
      borderRadius: rd(99),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBackground,
      paddingVertical: sp(4),
      paddingHorizontal: sp(8),
    },
    pinText: {
      color: c.text,
      fontSize: fs(11),
      fontWeight: '700',
    },
    deleteButton: {
      marginLeft: sp(8),
      marginTop: sp(4),
      padding: sp(4),
    },
  });


