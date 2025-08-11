import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    flex: 1,
    backgroundColor: c.card,
    borderRadius: 13,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
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
    paddingTop: 16,
    flexGrow: 1,
  },
  submit: {
    marginTop: 16,
    backgroundColor: '#95acda',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitText: {
    color: '#1f2633',
    fontWeight: 'bold',
  },
});
