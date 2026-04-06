import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  menuButton: { fontSize: fs(24), paddingHorizontal: sp(8), color: c.text },

  menuContainer: {
    backgroundColor: c.card,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: rd(8),
  },

  menuItemText: { color: c.text },

  adjustButton: {
    backgroundColor: c.inputBackground,
    borderRadius: rd(6),
    padding: sp(10),
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  adjustText: { color: c.text, fontSize: fs(20) },
  modalInfoText: { color: c.text, marginBottom: sp(8) },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tableCell: { color: c.text },
  tableCellActive: { color: c.highlight },
});


