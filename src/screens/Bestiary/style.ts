import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: 14,
      paddingTop: 10,
    },
    sectionCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: 12,
      marginBottom: 10,
      gap: 8,
      elevation: 1,
    },
    sectionTitle: {
      color: c.text,
      fontSize: 16,
      fontWeight: '700',
    },
    sectionHint: {
      color: c.textSecondary,
      fontSize: 12,
    },
    search: {
      backgroundColor: c.background,
      padding: 10,
      borderRadius: 10,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    laneRow: {
      flexDirection: 'row',
      gap: 8,
    },
    laneCell: {
      flex: 1,
    },
    picker: {
      backgroundColor: c.background,
      color: c.text,
      borderRadius: 10,
      height: 48,
    },
    tagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tagChip: {
      borderRadius: 99,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    tagChipActive: {
      backgroundColor: c.text,
      borderColor: c.text,
    },
    tagChipText: {
      color: c.text,
      fontSize: 11,
      fontWeight: '700',
    },
    tagChipTextActive: {
      color: c.background,
    },
    pinnedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    clearPinsButton: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    clearPinsText: {
      color: c.text,
      fontSize: 12,
      fontWeight: '700',
    },
    buttonContainer: {
      paddingBottom: 18,
      gap: 8,
    },
    utilityButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: c.inputBackground,
      borderRadius: 10,
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
      padding: 20,
    },
    emptyText: {
      color: c.textSecondary,
      textAlign: 'center',
    },
  });
