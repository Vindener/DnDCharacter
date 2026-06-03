import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.card,
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      alignItems: 'flex-start',
      borderWidth: 1,
      borderColor: c.border,
      elevation: 1,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 6,
      marginRight: 12,
      backgroundColor: c.inputBackground,
    },
    info: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    name: {
      color: c.text,
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },
    meta: {
      color: c.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    quickRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 6,
    },
    quickMeta: {
      color: c.text,
      fontSize: 12,
      fontWeight: '600',
    },
    pinButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBackground,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    pinText: {
      color: c.text,
      fontSize: 11,
      fontWeight: '700',
    },
    deleteButton: {
      marginLeft: 8,
      marginTop: 4,
      padding: 4,
    },
  });
