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
    title: {
      color: c.text,
      fontSize: 20,
      fontWeight: '700',
    },
    hint: {
      color: c.textSecondary,
      fontSize: 13,
      marginBottom: 4,
    },
    search: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      color: c.text,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 6,
    },
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: 10,
      marginBottom: 8,
      gap: 4,
    },
    spellName: {
      color: c.text,
      fontSize: 14,
      fontWeight: '700',
    },
    meta: {
      color: c.textSecondary,
      fontSize: 12,
    },
    empty: {
      color: c.textSecondary,
      fontSize: 13,
      marginTop: 8,
    },
  });
