import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: c.background },
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
  diceIcon: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    padding: 8,
    borderRadius: 24,
    backgroundColor: c.card,
    zIndex: 1,
  },
});
