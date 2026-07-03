import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';
export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  safeArea: {
    backgroundColor: c.card,
    borderBottomWidth: 1,
    borderColor: c.border,
  },
  header: {
    minHeight: 56,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingVertical: sp(8),
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
    color: c.onBrand,
    fontSize: fs(18),
    fontWeight: 'bold',
  },
  title: {
    color: c.text,
    fontSize: fs(18),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  trailingSpacer: {
    width: 36,
  },
});


