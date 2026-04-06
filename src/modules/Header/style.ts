import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';
export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  header: {
    paddingTop: 8,
    height: 64,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    borderBottomWidth: 1,
    borderColor: c.border,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: rd(18),
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoAvatar: {
    width: 36,
    height: 36,
    borderRadius: rd(18),
  },
  logoText: {
    color: c.text,
    fontSize: fs(18),
    fontWeight: 'bold',
  },
  title: {
    color: c.text,
    fontSize: fs(18),
    fontWeight: '600',
  },
});



