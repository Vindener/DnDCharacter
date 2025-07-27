import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.492)',
  },
  container: {
    position: 'relative',
    backgroundColor: c.card,
    borderRadius: 13,
    padding: 32,
    width: '90%',
    maxWidth: 480,
    maxHeight: '90%',
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
