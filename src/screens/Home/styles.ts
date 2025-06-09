import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sortLabel: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 4,
  },
  sortValue: {
    color: '#2f95dc',
    fontWeight: '600',
    marginRight: 12,
  },
  slotBadge: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  slotText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  search: {
    backgroundColor: '#2c2c2e',
    padding: 10,
    borderRadius: 8,
    color: 'white',
    marginBottom: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});
