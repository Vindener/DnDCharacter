import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
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
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      gap: 10,
    },
    sectionTitle: {
      color: c.text,
      fontSize: 16,
      fontWeight: '700',
    },
    sectionHint: {
      color: c.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    label: {
      color: c.text,
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
    },
    actionButton: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 10,
      paddingHorizontal: 14,
      alignSelf: 'flex-start',
    },
    actionButtonText: {
      color: c.text,
      fontSize: 13,
      fontWeight: '600',
    },
    coinsList: {
      gap: 8,
    },
    coinRow: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingHorizontal: 10,
      paddingVertical: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    coinMeta: {
      flex: 1,
      gap: 2,
    },
    coinName: {
      color: c.text,
      fontSize: 14,
      fontWeight: '700',
    },
    coinCode: {
      color: c.textSecondary,
      fontSize: 12,
    },
    removeButton: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    removeButtonText: {
      color: c.text,
      fontSize: 12,
      fontWeight: '600',
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 13,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      gap: 8,
    },
    modalTitle: {
      color: c.text,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 2,
    },
    modalLabel: {
      color: c.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      color: c.text,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 4,
    },
    modalButton: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    modalButtonText: {
      color: c.text,
      fontSize: 13,
      fontWeight: '600',
    },
    authContainer: {
      gap: 10,
    },
    authUserRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    authAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: c.border,
    },
    authAvatarFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
    },
    authAvatarFallbackText: {
      color: c.text,
      fontSize: 18,
      fontWeight: '700',
    },
    authUserTextWrap: {
      flex: 1,
      gap: 2,
    },
    authWelcome: {
      color: c.textSecondary,
      fontSize: 12,
    },
    authUserEmail: {
      color: c.text,
      fontSize: 13,
      fontWeight: '600',
    },
  });
