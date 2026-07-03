import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
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
      borderRadius: rd(14),
      borderWidth: 1,
      borderColor: c.border,
      padding: sp(12),
      gap: sp(10),
    },
    sectionTitle: {
      color: c.text,
      fontSize: fs(16),
      fontWeight: '700',
    },
    sectionHint: {
      color: c.textSecondary,
      fontSize: fs(12),
      lineHeight: 17,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: sp(10),
    },
    label: {
      color: c.text,
      fontSize: fs(15),
      fontWeight: '600',
      flex: 1,
    },
    actionButton: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      paddingHorizontal: sp(14),
      alignSelf: 'flex-start',
    },
    actionButtonText: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: '600',
    },
    languageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(8),
    },
    languageButton: {
      minHeight: 44,
      minWidth: 116,
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      paddingHorizontal: sp(14),
      alignItems: 'center',
      justifyContent: 'center',
    },
    languageButtonActive: {
      borderColor: c.brand,
      backgroundColor: c.inputBackground,
    },
    languageButtonPressed: {
      opacity: 0.84,
    },
    languageButtonText: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: '600',
    },
    languageButtonTextActive: {
      color: c.brand,
    },
    coinsList: {
      gap: sp(8),
    },
    coinRow: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingHorizontal: sp(10),
      paddingVertical: sp(9),
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(10),
    },
    coinMeta: {
      flex: 1,
      gap: sp(2),
    },
    coinName: {
      color: c.text,
      fontSize: fs(14),
      fontWeight: '700',
    },
    coinCode: {
      color: c.textSecondary,
      fontSize: fs(12),
    },
    removeButton: {
      borderRadius: rd(8),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingHorizontal: sp(10),
      paddingVertical: sp(7),
    },
    removeButtonText: {
      color: c.text,
      fontSize: fs(12),
      fontWeight: '600',
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: fs(13),
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: c.overlaySoft,
      justifyContent: 'center',
      padding: sp(20),
    },
    modalCard: {
      backgroundColor: c.card,
      borderRadius: rd(14),
      borderWidth: 1,
      borderColor: c.border,
      padding: sp(14),
      gap: sp(8),
    },
    modalTitle: {
      color: c.text,
      fontSize: fs(17),
      fontWeight: '700',
      marginBottom: sp(2),
    },
    modalLabel: {
      color: c.textSecondary,
      fontSize: fs(12),
      marginTop: sp(2),
    },
    modalInput: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      color: c.text,
      borderRadius: rd(10),
      paddingHorizontal: sp(10),
      paddingVertical: sp(8),
      fontSize: fs(14),
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: sp(8),
      marginTop: sp(4),
    },
    modalButton: {
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingVertical: sp(10),
      paddingHorizontal: sp(14),
    },
    modalButtonText: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: '600',
    },
    authContainer: {
      gap: sp(10),
    },
    authUserRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(10),
    },
    authAvatar: {
      width: 52,
      height: 52,
      borderRadius: rd(26),
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
      fontSize: fs(18),
      fontWeight: '700',
    },
    authUserTextWrap: {
      flex: 1,
      gap: sp(2),
    },
    authWelcome: {
      color: c.textSecondary,
      fontSize: fs(12),
    },
    authUserEmail: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: '600',
    },
  });


