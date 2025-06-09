import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 20, marginBottom: 16, textAlign: 'center' },
  diceButton: {
    padding: 16,
    marginVertical: 4,
    backgroundColor: '#2f95dc',
    borderRadius: 8,
    alignItems: 'center',
  },
  diceText: { fontSize: 18, color: '#fff' },
  result: { fontSize: 22, textAlign: 'center', marginTop: 16 },
});
