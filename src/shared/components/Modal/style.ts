import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  wrapper: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.492)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    position: 'relative',
    backgroundColor: c.card,
    color: c.text,
    borderRadius: 13,
    padding: 32,
    width: '100%',
    maxWidth: '100%',
    height: '75%',
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
