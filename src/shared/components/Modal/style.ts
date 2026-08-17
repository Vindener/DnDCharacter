import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: sp(16),
      backgroundColor: c.overlayStrong,
    },
    container: {
      backgroundColor: c.card,
      borderRadius: rd(13),
      paddingTop: 24,
      paddingHorizontal: sp(24),
      paddingBottom: 20,
      width: '100%',
      maxWidth: 480,
      maxHeight: '88%',
      overflow: 'hidden',
    },
    close: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: sp(4),
    },
    closeText: {
      fontSize: fs(20),
      color: c.text,
    },
    title: {
      fontSize: fs(18),
      color: c.text,
      marginBottom: sp(4),
    },
    subtitle: {
      fontSize: fs(14),
      color: c.text,
      marginBottom: sp(16),
    },
    content: {
      minHeight: 0,
      flexShrink: 1,
      paddingTop: 16,
    },
    scrollArea: {
      flexShrink: 1,
      minHeight: 0,
    },
    scrollContent: {
      paddingBottom: 18,
    },
    actions: {
      paddingTop: sp(10),
      backgroundColor: c.card,
    },
    submit: {
      marginTop: sp(12),
      backgroundColor: c.primary,
      paddingVertical: sp(12),
      borderRadius: rd(8),
      alignItems: 'center',
    },
    submitText: {
      color: c.onPrimary,
      fontWeight: 'bold',
    },
  });
