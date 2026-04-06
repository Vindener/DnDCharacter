import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: c.overlayStrong,
  },
  container: {
    backgroundColor: c.card,
    borderRadius: 13,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  close: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    color: c.text,
  },
  title: {
    fontSize: 18,
    color: c.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: c.text,
    marginBottom: 16,
  },
  content: {
    minHeight: 0,
    paddingTop: 16,
  },
  scrollArea: {
    maxHeight: '100%',
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: 18,
  },
  submit: {
    marginTop: 12,
    backgroundColor: c.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: c.onPrimary,
    fontWeight: 'bold',
  },
});



