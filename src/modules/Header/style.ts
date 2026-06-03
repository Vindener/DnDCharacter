import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  header: {
    paddingTop: 8,
    height: 64,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: c.border,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff2d55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  logoText: {
    color: c.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: c.text,
    fontSize: 18,
    fontWeight: '600',
  },
});
