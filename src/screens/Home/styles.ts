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

    card: {
      backgroundColor: c.card,
      borderRadius: rd(16),
      borderWidth: 1,
      borderColor: c.border,
      padding: sp(12),
      elevation: 2,
      gap: sp(8),
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
    characterLimitText: {
      fontWeight: '800',
    },
    characterLimitTextSafe: {
      color: c.success,
    },
    characterLimitTextWarn: {
      color: c.warning,
    },
    characterLimitTextDanger: {
      color: c.danger,
    },

    greetingTitle: {
      color: c.text,
      fontSize: fs(20),
      fontWeight: '700',
    },
    greetingMeta: {
      color: c.textSecondary,
      fontSize: fs(13),
    },

    roleSwitchRow: {
      flexDirection: 'row',
      gap: sp(8),
      marginTop: sp(8),
    },
    roleChip: {
      flex: 1,
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      alignItems: 'center',
    },
    roleChipActive: {
      backgroundColor: c.text,
      borderColor: c.text,
    },
    roleChipText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '700',
    },
    roleChipTextActive: {
      color: c.background,
    },

    resumeButton: {
      borderRadius: rd(12),
      backgroundColor: c.primary,
      paddingVertical: sp(12),
      alignItems: 'center',
      marginTop: sp(4),
    },
    resumeButtonText: {
      color: c.onPrimary,
      fontSize: fs(14),
      fontWeight: '700',
    },
    lineText: {
      color: c.text,
      fontSize: fs(13),
    },

    searchInput: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      color: c.text,
      paddingHorizontal: sp(10),
      paddingVertical: sp(8),
      marginTop: sp(4),
    },

    characterCard: {
      borderRadius: rd(14),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      padding: sp(10),
      gap: sp(5),
    },
    characterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: sp(8),
    },
    characterName: {
      color: c.text,
      fontSize: fs(15),
      fontWeight: '700',
      flex: 1,
    },
    characterMeta: {
      color: c.textSecondary,
      fontSize: fs(12),
    },
    characterStatsRow: {
      flexDirection: 'row',
      gap: sp(12),
    },
    characterStat: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '600',
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(6),
      marginTop: sp(2),
    },
    badge: {
      borderRadius: rd(99),
      backgroundColor: c.inputBackground,
      paddingVertical: sp(3),
      paddingHorizontal: sp(8),
    },
    badgeText: {
      color: c.text,
      fontSize: fs(11),
      fontWeight: '600',
    },
    conflictBadge: {
      backgroundColor: c.danger,
      borderWidth: 1,
      borderColor: c.danger,
    },
    conflictBadgeText: {
      color: c.onPrimary,
    },

    timelineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingVertical: sp(7),
    },
    timelineBadge: {
      borderRadius: rd(99),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(4),
      paddingHorizontal: sp(8),
      minWidth: 62,
      alignItems: 'center',
    },
    timelineBadgeText: {
      color: c.text,
      fontSize: fs(10),
      fontWeight: '700',
    },
    timelineContent: {
      flex: 1,
      gap: sp(1),
    },
    timelineText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '600',
    },
    timelineMeta: {
      color: c.textSecondary,
      fontSize: fs(11),
    },

    dmGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(8),
    },
    dmButton: {
      width: '48%',
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      paddingHorizontal: sp(10),
      alignItems: 'center',
      gap: sp(4),
    },
    dmButtonText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '700',
      textAlign: 'center',
    },
    pendingButton: {
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      paddingHorizontal: sp(10),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sp(8),
      marginTop: sp(2),
      marginBottom: sp(4),
    },
    pendingButtonText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '700',
    },

    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(8),
    },
    quickButton: {
      width: '48%',
      borderRadius: rd(12),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(12),
      paddingHorizontal: sp(10),
      alignItems: 'center',
      justifyContent: 'center',
      gap: sp(4),
    },
    quickButtonText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '700',
      textAlign: 'center',
    },

    syncRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(8),
    },
    syncPill: {
      borderRadius: rd(99),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(6),
      paddingHorizontal: sp(10),
    },
    syncPillText: {
      color: c.text,
      fontSize: fs(11),
      fontWeight: '600',
    },

    authButton: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      alignItems: 'center',
      marginTop: sp(8),
    },
    authButtonText: {
      color: c.text,
      fontWeight: '700',
    },
    authUserRow: {
      marginTop: sp(8),
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(10),
    },
    authAvatar: {
      width: 44,
      height: 44,
      borderRadius: rd(22),
      borderWidth: 1,
      borderColor: c.border,
    },
    authUserTextWrap: {
      flex: 1,
      gap: sp(6),
    },
    authUserEmail: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: '600',
    },
    authLogoutButton: {
      alignSelf: 'flex-start',
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(6),
      paddingHorizontal: sp(10),
    },
    authLogoutText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '700',
    },
  });



