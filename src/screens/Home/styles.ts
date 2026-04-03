import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: 14,
      paddingBottom: 28,
      gap: 12,
    },

    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      elevation: 2,
      gap: 8,
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
      fontSize: 20,
      fontWeight: '700',
    },
    greetingMeta: {
      color: c.textSecondary,
      fontSize: 13,
    },

    roleSwitchRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    roleChip: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 10,
      alignItems: 'center',
    },
    roleChipActive: {
      backgroundColor: c.text,
      borderColor: c.text,
    },
    roleChipText: {
      color: c.text,
      fontSize: 12,
      fontWeight: '700',
    },
    roleChipTextActive: {
      color: c.background,
    },

    resumeButton: {
      borderRadius: 12,
      backgroundColor: c.primary,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 4,
    },
    resumeButtonText: {
      color: c.onPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    lineText: {
      color: c.text,
      fontSize: 13,
    },

    searchInput: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      color: c.text,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginTop: 4,
    },

    characterCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      padding: 10,
      gap: 5,
    },
    characterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    characterName: {
      color: c.text,
      fontSize: 15,
      fontWeight: '700',
      flex: 1,
    },
    characterMeta: {
      color: c.textSecondary,
      fontSize: 12,
    },
    characterStatsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    characterStat: {
      color: c.text,
      fontSize: 12,
      fontWeight: '600',
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 2,
    },
    badge: {
      borderRadius: 99,
      backgroundColor: c.inputBackground,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    badgeText: {
      color: c.text,
      fontSize: 11,
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
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingVertical: 7,
    },
    timelineBadge: {
      borderRadius: 99,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 4,
      paddingHorizontal: 8,
      minWidth: 62,
      alignItems: 'center',
    },
    timelineBadgeText: {
      color: c.text,
      fontSize: 10,
      fontWeight: '700',
    },
    timelineContent: {
      flex: 1,
      gap: 1,
    },
    timelineText: {
      color: c.text,
      fontSize: 12,
      fontWeight: '600',
    },
    timelineMeta: {
      color: c.textSecondary,
      fontSize: 11,
    },

    dmGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    dmButton: {
      width: '48%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 10,
      paddingHorizontal: 10,
      alignItems: 'center',
      gap: 4,
    },
    dmButtonText: {
      color: c.text,
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },
    pendingButton: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 10,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 2,
      marginBottom: 4,
    },
    pendingButtonText: {
      color: c.text,
      fontSize: 12,
      fontWeight: '700',
    },

    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    quickButton: {
      width: '48%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    quickButtonText: {
      color: c.text,
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },

    syncRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    syncPill: {
      borderRadius: 99,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    syncPillText: {
      color: c.text,
      fontSize: 11,
      fontWeight: '600',
    },

    authButton: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 10,
      alignItems: 'center',
      marginTop: 8,
    },
    authButtonText: {
      color: c.text,
      fontWeight: '700',
    },
    authUserRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    authAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
    },
    authUserTextWrap: {
      flex: 1,
      gap: 6,
    },
    authUserEmail: {
      color: c.text,
      fontSize: 13,
      fontWeight: '600',
    },
    authLogoutButton: {
      alignSelf: 'flex-start',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    authLogoutText: {
      color: c.text,
      fontSize: 12,
      fontWeight: '700',
    },
  });

