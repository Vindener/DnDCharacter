import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, padding: sp(16), backgroundColor: c.background },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: sp(8),
      height: 56,
    },
    rowDefeated: {
      opacity: 0.55,
    },
    rowContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    order: { color: c.text, width: 24, textAlign: 'center' },
    inputName: {
      flex: 1,
      backgroundColor: c.inputBackground,
      color: c.text,
      padding: sp(8),
      borderRadius: rd(5),
      marginRight: sp(8),
    },
    inputRoll: {
      width: 60,
      backgroundColor: c.inputBackground,
      color: c.text,
      padding: sp(8),
      borderRadius: rd(5),
      textAlign: 'center',
      marginLeft: sp(4),
    },
    inputHits: {
      width: 70,
      backgroundColor: c.inputBackground,
      color: c.text,
      padding: sp(8),
      borderRadius: rd(5),
      textAlign: 'center',
      marginLeft: sp(8),
    },
    moveButtons: { flexDirection: 'row', marginLeft: sp(8) },
    defeatedButton: {
      padding: sp(8),
      marginLeft: sp(4),
    },
    deleteButton: {
      padding: sp(8),
      marginLeft: sp(8),
    },
    bottomBar: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.background,
      borderRadius: rd(12),
      paddingHorizontal: sp(12),
      paddingVertical: sp(8),
      shadowColor: c.overlayStrong,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
    },
    addButton: { flexDirection: 'row', alignItems: 'center' },
    addText: { marginLeft: sp(8), color: c.success, fontSize: fs(16) },
    checkboxRow: { flexDirection: 'row', alignItems: 'center' },
    checkboxLabel: { marginLeft: sp(8), color: c.text },
    addHeroButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: sp(16),
    },
    addHeroText: {
      marginLeft: sp(6),
      color: c.text,
      fontSize: fs(14),
    },

    heroItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: sp(10),
    },
    heroItemText: {
      marginLeft: sp(8),
      color: c.text,
      fontSize: fs(16),
    },

    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: sp(64),
      paddingHorizontal: sp(24),
    },
    emptyStateText: {
      marginTop: sp(12),
      color: c.textSecondary,
      fontSize: fs(15),
      textAlign: 'center',
    },

    localModeBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: c.card,
      borderRadius: rd(10),
      padding: sp(12),
      marginBottom: sp(12),
    },
    localModeBannerText: {
      flex: 1,
      marginLeft: sp(8),
      color: c.textSecondary,
      fontSize: fs(13),
    },
  });
