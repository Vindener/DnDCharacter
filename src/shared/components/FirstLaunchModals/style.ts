import { StyleSheet } from 'react-native';
import { sp } from '@/shared/styles/tokens';

export const styles = StyleSheet.create({
  body: {
    marginBottom: sp(16),
  },
  action: {
    marginTop: sp(4),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: sp(12),
  },
  actionHalf: {
    flex: 1,
  },
});
