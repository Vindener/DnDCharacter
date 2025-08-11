import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.background },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    buttonText: { color: c.text, marginLeft: 8, fontSize: 16 },
  });
