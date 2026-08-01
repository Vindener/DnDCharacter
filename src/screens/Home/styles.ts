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
      paddingBottom: sp(28),
      gap: sp(12),
    },

    heroCard: {
      backgroundColor: c.card,
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      padding: sp(14),
      elevation: 2,
      gap: sp(12),
    },
    card: {
      backgroundColor: c.card,
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      padding: sp(12),
      elevation: 1,
      gap: sp(10),
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(10),
    },
    headerTextWrap: {
      flex: 1,
      gap: sp(4),
    },
    heroContinueButton: {
      alignSelf: 'stretch',
      minHeight: 40,
      borderRadius: rd(8),
      backgroundColor: c.primary,
      paddingVertical: sp(8),
      paddingHorizontal: sp(12),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sp(8),
    },
    heroContinueButtonText: {
      color: c.onPrimary,
      fontSize: fs(18),
      lineHeight: fs(24),
      fontWeight: '800',
    },
    heroContinueInfo: {
      color: c.textSecondary,
      fontSize: fs(13),
      lineHeight: fs(18),
      fontWeight: '600',
    },
    greetingMeta: {
      color: c.textSecondary,
      fontSize: fs(13),
    },
    authAvatar: {
      width: 44,
      height: 44,
      borderRadius: rd(22),
      borderWidth: 1,
      borderColor: c.border,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: sp(10),
      paddingHorizontal: sp(2),
    },
    sectionTitle: {
      color: c.text,
      fontSize: fs(16),
      lineHeight: fs(22),
      fontWeight: '800',
    },
    sectionHint: {
      color: c.textSecondary,
      fontSize: fs(12),
      lineHeight: fs(17),
    },

    primaryButton: {
      minHeight: 46,
      borderRadius: rd(8),
      backgroundColor: c.primary,
      paddingVertical: sp(10),
      paddingHorizontal: sp(12),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: sp(8),
    },
    primaryButtonText: {
      color: c.onPrimary,
      fontSize: fs(14),
      fontWeight: '800',
    },
    secondaryButton: {
      minHeight: 44,
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      paddingHorizontal: sp(12),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: sp(8),
    },
    secondaryButtonText: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: '800',
    },

    characterCard: {
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: sp(12),
      elevation: 1,
      gap: sp(10),
    },
    characterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
    },
    characterTitleWrap: {
      flex: 1,
      gap: sp(2),
    },
    characterName: {
      color: c.text,
      fontSize: fs(16),
      lineHeight: fs(22),
      fontWeight: '800',
    },
    characterMeta: {
      color: c.textSecondary,
      fontSize: fs(12),
      lineHeight: fs(17),
      fontWeight: '600',
    },
    characterStatsRow: {
      flexDirection: 'row',
      gap: sp(8),
    },
    characterStatBox: {
      flex: 1,
      minHeight: 58,
      borderRadius: rd(8),
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: sp(8),
      paddingHorizontal: sp(8),
      justifyContent: 'center',
      gap: sp(2),
    },
    characterStatLabel: {
      color: c.textSecondary,
      fontSize: fs(10),
      fontWeight: '700',
    },
    characterStatValue: {
      color: c.text,
      fontSize: fs(14),
      fontWeight: '800',
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(6),
    },
    badge: {
      borderRadius: rd(99),
      backgroundColor: c.inputBackground,
      paddingVertical: sp(4),
      paddingHorizontal: sp(8),
    },
    badgeText: {
      color: c.text,
      fontSize: fs(11),
      fontWeight: '700',
    },
    successBadge: {
      backgroundColor: c.success,
    },
    successBadgeText: {
      color: c.onSuccess,
    },
    warningBadge: {
      backgroundColor: c.warning,
    },
    warningBadgeText: {
      color: c.onWarning,
    },
    conflictBadge: {
      backgroundColor: c.danger,
    },
    conflictBadgeText: {
      color: c.onDanger,
    },

    emptyInline: {
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: sp(12),
      gap: sp(4),
    },
    emptyTitle: {
      color: c.text,
      fontSize: fs(15),
      fontWeight: '800',
    },

    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(8),
    },
    quickButton: {
      width: '48%',
      minHeight: 66,
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      paddingHorizontal: sp(8),
      alignItems: 'center',
      justifyContent: 'center',
      gap: sp(5),
    },
    quickButtonText: {
      color: c.text,
      fontSize: fs(12),
      lineHeight: fs(16),
      fontWeight: '800',
      textAlign: 'center',
    },

    syncStrip: {
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: sp(12),
      gap: sp(8),
      elevation: 1,
    },
    syncStripWarning: {
      borderColor: c.warning,
    },
    syncStripDanger: {
      borderColor: c.danger,
    },
    syncStripHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
    },
    syncStripTitle: {
      color: c.text,
      fontSize: fs(14),
      fontWeight: '800',
    },
    syncPillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(6),
    },
    syncPillText: {
      color: c.textSecondary,
      borderRadius: rd(99),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(5),
      paddingHorizontal: sp(8),
      fontSize: fs(11),
      fontWeight: '700',
    },
    cloudLoginButton: {
      alignSelf: 'flex-start',
      minHeight: 38,
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(8),
      paddingHorizontal: sp(10),
      justifyContent: 'center',
    },
    cloudLoginText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '800',
    },
  });
