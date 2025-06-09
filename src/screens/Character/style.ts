import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#1c1c1e', overflow: 'scroll' },
  header: { marginBottom: 16, alignItems: 'center' },
  characterPhoto: { width: 120, height: 120, borderRadius: 60, marginBottom: 8 },
  placeholderPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeholderText: { color: '#666' },
  characterName: { fontSize: 24, fontWeight: 'bold', marginRight: 8, color: '#fff' },
  level: { fontSize: 16, color: '#fff' },
  exp: { fontSize: 14, color: '#fff' },
  changeHP: { fontSize: 16, color: '#fff' },
});
