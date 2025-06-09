import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#222' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { color: 'white', fontSize: 16, flex: 1 },
  input: {
    backgroundColor: '#555',
    color: 'white',
    padding: 8,
    borderRadius: 5,
    width: 60,
    textAlign: 'center',
  },
  modifier: { color: 'white', fontSize: 16, marginLeft: 10, width: 40, textAlign: 'center' },
  rollButton: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  rollButtonText: { color: 'white', fontSize: 16 },
});
