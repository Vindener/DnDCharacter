import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: c.card,
    padding: sp(12),
    borderRadius: rd(8),
    marginBottom: sp(12),
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: rd(6),
    marginRight: sp(12),
    backgroundColor: c.inputBackground,
  },
  info: {
    flex: 1,
  },
  name: {
    color: c.text,
    fontSize: fs(16),
    fontWeight: '600',
  },
  meta: {
    color: c.textSecondary,
    fontSize: fs(13),
    marginTop: sp(2),
  },
  classText: {
    color: c.textSecondary,
    fontSize: fs(13),
  },
  separator: {
    color: c.brand,
  },
});



