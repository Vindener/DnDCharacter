import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: sp(14),
      paddingBottom: 28,
      gap: sp(12),
    },
    embeddedContent: {
      gap: sp(12),
      paddingBottom: sp(10),
    },
    header: {
      gap: sp(4),
    },
    title: {
      color: c.text,
      fontSize: fs(24),
      fontWeight: '800',
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: fs(13),
      lineHeight: 18,
    },
    resultCard: {
      borderRadius: rd(16),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: sp(18),
      alignItems: 'center',
      gap: sp(6),
      elevation: 3,
    },
    resultNeutral: {
      borderColor: c.border,
    },
    resultSuccess: {
      borderColor: c.success,
    },
    resultFailure: {
      borderColor: c.danger,
    },
    resultLabel: {
      color: c.textSecondary,
      fontSize: fs(12),
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    resultValue: {
      color: c.text,
      fontSize: fs(56),
      lineHeight: 64,
      fontWeight: '800',
    },
    resultBreakdownText: {
      color: c.text,
      fontSize: fs(15),
      lineHeight: 20,
      fontWeight: '800',
      textAlign: 'center',
    },
    formulaText: {
      color: c.text,
      fontSize: fs(14),
      fontWeight: '700',
    },
    criticalSuccess: {
      color: c.success,
      fontSize: fs(13),
      fontWeight: '800',
    },
    criticalFailure: {
      color: c.danger,
      fontSize: fs(13),
      fontWeight: '800',
    },
    resultActionSlot: {
      gap: sp(8),
    },
    section: {
      borderRadius: rd(14),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: sp(12),
      gap: sp(8),
      elevation: 1,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: sp(8),
    },
    sectionTitle: {
      color: c.text,
      fontSize: fs(14),
      fontWeight: '800',
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(8),
    },
    chip: {
      minWidth: 62,
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(9),
      paddingHorizontal: sp(10),
      alignItems: 'center',
    },
    chipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipText: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: '800',
    },
    chipTextActive: {
      color: c.onPrimary,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(10),
    },
    stepperButton: {
      width: 48,
      height: 44,
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperText: {
      color: c.text,
      fontSize: fs(22),
      fontWeight: '800',
    },
    stepperValue: {
      flex: 1,
      height: 44,
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      color: c.text,
      textAlign: 'center',
      textAlignVertical: 'center',
      fontSize: fs(18),
      fontWeight: '800',
      paddingTop: sp(10),
    },
    toggleButton: {
      borderRadius: rd(99),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(6),
      paddingHorizontal: sp(12),
    },
    toggleButtonActive: {
      backgroundColor: c.success,
      borderColor: c.success,
    },
    toggleText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '800',
    },
    toggleTextActive: {
      color: c.onSuccess,
    },
    segmented: {
      flexDirection: 'row',
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      backgroundColor: c.background,
    },
    segment: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: sp(6),
    },
    segmentActive: {
      backgroundColor: c.primary,
    },
    segmentText: {
      color: c.text,
      fontSize: fs(11),
      fontWeight: '800',
      textAlign: 'center',
    },
    segmentTextActive: {
      color: c.onPrimary,
    },
    input: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      color: c.text,
      paddingHorizontal: sp(10),
      paddingVertical: sp(10),
      fontSize: fs(14),
    },
    errorText: {
      color: c.danger,
      fontSize: fs(12),
      fontWeight: '700',
    },
    actionRow: {
      flexDirection: 'row',
      gap: sp(8),
    },
    rollButton: {
      flex: 1,
      borderRadius: rd(12),
      backgroundColor: c.primary,
      paddingVertical: sp(13),
      alignItems: 'center',
    },
    rollButtonText: {
      color: c.onPrimary,
      fontSize: fs(14),
      fontWeight: '800',
    },
    secondaryButton: {
      flex: 1,
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingVertical: sp(13),
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: '800',
    },
    historyCount: {
      color: c.textSecondary,
      fontSize: fs(12),
      fontWeight: '800',
    },
    emptyHistory: {
      color: c.textSecondary,
      fontSize: fs(12),
    },
    historyItem: {
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      padding: sp(10),
      gap: sp(3),
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: sp(8),
    },
    historyFormula: {
      flex: 1,
      color: c.text,
      fontSize: fs(13),
      fontWeight: '800',
    },
    historyTime: {
      color: c.textSecondary,
      fontSize: fs(10),
    },
    historyDetail: {
      color: c.textSecondary,
      fontSize: fs(12),
    },
  });
