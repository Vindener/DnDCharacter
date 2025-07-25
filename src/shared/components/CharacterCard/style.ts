import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: c.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: c.inputBackground,
  },
  info: {
    flex: 1,
  },
  name: {
    color: c.text,
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    color: c.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  classText: {
    color: c.textSecondary,
    fontSize: 13,
  },
  separator: {
    color: '#ff2d55',
  },
});
