import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: sp(16) },
  title: { fontSize: fs(20), marginBottom: sp(16), color: c.text },
  result: { fontSize: fs(22), marginTop: sp(16), color: c.text },
  rollButton: {
    marginTop: sp(10),
    padding: sp(10),
    backgroundColor: c.magic,
    borderRadius: rd(5),
  },
  rollButtonText: { color: c.text, fontSize: fs(16) },
  diceButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: c.magic,
    padding: sp(15),
    borderRadius: rd(50),
  },
  diceText: {
    color: c.text,
    fontSize: fs(24),
  },
  diceMenu: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: c.card,
    padding: sp(10),
    borderRadius: rd(10),
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 180,
  },
  diceOption: {
    width: '30%',
    margin: sp(5),
    backgroundColor: c.inputBackground,
    padding: sp(10),
    borderRadius: rd(5),
    alignItems: 'center',
  },
  diceOptionText: {
    color: c.text,
    fontSize: fs(16),
  },
  diceClose: {
    width: '30%',
    margin: sp(5),
    backgroundColor: c.magic,
    padding: sp(10),
    borderRadius: rd(5),
    alignItems: 'center',
  },
  diceCloseText: {
    color: c.text,
    fontSize: fs(16),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.overlayStrong,
  },
  modalContent: {
    backgroundColor: c.card,
    padding: sp(20),
    borderRadius: rd(10),
    alignItems: 'center',
  },
  modalTitle: {
    color: c.text,
    fontSize: fs(18),
    marginBottom: sp(10),
  },
  modalResult: {
    color: c.highlight,
    fontSize: fs(20),
    fontWeight: 'bold',
  },
  modalButton: {
    marginTop: sp(10),
    padding: sp(10),
    backgroundColor: c.magic,
    borderRadius: rd(5),
  },
  modalButtonText: {
    color: c.text,
    fontSize: fs(16),
  },
  input: {
    backgroundColor: c.inputBackground,
    color: c.text,
    padding: sp(8),
    borderRadius: rd(5),
    width: 60,
    textAlign: 'center',
    marginBottom: sp(10),
  },
});



