import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: sp(14),
      paddingTop: 10,
    },
    sectionCard: {
      borderRadius: rd(14),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: sp(12),
      marginBottom: sp(10),
      gap: sp(8),
      elevation: 1,
    },
    sectionTitle: {
      color: c.text,
      fontSize: fs(16),
      fontWeight: '700',
    },
    sectionHint: {
      color: c.textSecondary,
      fontSize: fs(12),
    },
    search: {
      backgroundColor: c.background,
      padding: sp(10),
      borderRadius: rd(10),
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    laneRow: {
      flexDirection: 'row',
      gap: sp(8),
    },
    laneCell: {
      flex: 1,
    },
    picker: {
      backgroundColor: c.background,
      color: c.text,
      borderRadius: rd(10),
      height: 48,
    },
    tagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(6),
    },
    tagChip: {
      borderRadius: rd(99),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(4),
      paddingHorizontal: sp(10),
    },
    tagChipActive: {
      backgroundColor: c.text,
      borderColor: c.text,
    },
    tagChipText: {
      color: c.text,
      fontSize: fs(11),
      fontWeight: '700',
    },
    tagChipTextActive: {
      color: c.background,
    },
    pinnedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: sp(8),
    },
    clearPinsButton: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(8),
      paddingHorizontal: sp(10),
    },
    clearPinsText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '700',
    },
    buttonContainer: {
      paddingBottom: 18,
      gap: sp(8),
    },
    utilityButton: {
      paddingVertical: sp(10),
      paddingHorizontal: sp(14),
      backgroundColor: c.inputBackground,
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
    },
    utilityButtonText: {
      color: c.text,
      textAlign: 'center',
      fontWeight: '700',
    },
    emptyWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: sp(20),
    },
    emptyText: {
      color: c.textSecondary,
      textAlign: 'center',
    },
    errorText: {
      color: c.danger,
      fontSize: fs(13),
      fontWeight: '700',
    },
  });


