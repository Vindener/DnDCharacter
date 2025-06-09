import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#2c2c2e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#444',
  },
  info: {
    flex: 1,
  },
  name: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    color: 'gray',
    fontSize: 13,
    marginTop: 2,
  },
  classText: {
    color: '#999',
    fontSize: 13,
  },
  separator: {
    color: '#ff2d55',
  },
});
