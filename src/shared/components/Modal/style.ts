import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
    backgroundColor: '#222222',
    color: 'white',
    borderRadius: 13,
    padding: 32,
    width: '90%',
    maxWidth: 400,
  },
  close: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    color: '#fff',
  },
  title: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
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
