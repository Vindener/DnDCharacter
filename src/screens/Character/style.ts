import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: c.background, overflow: 'scroll' },
  header: { marginBottom: 16, alignItems: 'center' },
  characterPhoto: { width: 120, height: 120, borderRadius: 60, marginBottom: 8 },
  placeholderPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: c.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeholderText: { color: c.textSecondary },
  characterName: { fontSize: 24, fontWeight: 'bold', marginRight: 8, color: c.text },
  level: { fontSize: 16, color: c.text },
  exp: { fontSize: 14, color: c.text },
  changeHP: { fontSize: 16, color: c.text },
});
