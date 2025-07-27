import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sortLabel: {
    color: c.text,
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
    color: c.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  search: {
    backgroundColor: c.card,
    padding: 10,
    borderRadius: 8,
    color: c.text,
    marginBottom: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});
