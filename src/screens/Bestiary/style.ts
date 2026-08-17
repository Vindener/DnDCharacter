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
    listContent: {
      paddingBottom: sp(92),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: sp(10),
      marginBottom: sp(10),
    },
    headerMeta: {
      flex: 1,
      gap: sp(3),
    },
    headerAction: {
      minHeight: 42,
      borderRadius: rd(8),
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: sp(14),
    },
    headerActionText: {
      color: c.onPrimary,
      fontWeight: '800',
      fontSize: fs(13),
    },
    sectionCard: {
      borderRadius: rd(8),
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
      borderRadius: rd(8),
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: sp(8),
    },
    modeRow: {
      flexDirection: 'row',
      gap: sp(8),
      marginBottom: sp(8),
    },
    filtersBlock: {
      gap: sp(8),
      marginBottom: sp(10),
    },
    chipsRow: {
      gap: sp(6),
      paddingRight: sp(14),
    },
    chip: {
      minHeight: 38,
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      justifyContent: 'center',
      paddingHorizontal: sp(10),
      paddingVertical: sp(7),
    },
    chipActive: {
      backgroundColor: c.text,
      borderColor: c.text,
    },
    chipText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '700',
    },
    chipTextActive: {
      color: c.background,
    },
    activeFiltersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: sp(8),
    },
    activeFiltersText: {
      color: c.textSecondary,
      fontSize: fs(12),
      fontWeight: '700',
    },
    clearButton: {
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingVertical: sp(7),
      paddingHorizontal: sp(10),
    },
    clearButtonText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '700',
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
      borderRadius: rd(8),
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
      position: 'absolute',
      left: sp(14),
      right: sp(14),
      bottom: sp(10),
      paddingBottom: 18,
      gap: sp(8),
    },
    utilityButton: {
      paddingVertical: sp(10),
      paddingHorizontal: sp(14),
      backgroundColor: c.inputBackground,
      borderRadius: rd(8),
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
    emptyPanel: {
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: sp(16),
      marginBottom: sp(10),
    },
    quickBanner: {
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.info,
      backgroundColor: c.card,
      padding: sp(12),
      marginBottom: sp(10),
      gap: sp(4),
    },
    quickBannerTitle: {
      color: c.text,
      fontSize: fs(14),
      fontWeight: '800',
    },
    errorText: {
      color: c.danger,
      fontSize: fs(13),
      fontWeight: '700',
    },
  });
