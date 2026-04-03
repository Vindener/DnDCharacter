import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, marginBottom: 16, color: c.text },
  result: { fontSize: 22, marginTop: 16, color: c.text },
  rollButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: c.magic,
    borderRadius: 5,
  },
  rollButtonText: { color: c.text, fontSize: 16 },
  diceButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: c.magic,
    padding: 15,
    borderRadius: 50,
  },
  diceText: {
    color: c.text,
    fontSize: 24,
  },
  diceMenu: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: c.card,
    padding: 10,
    borderRadius: 10,
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 180,
  },
  diceOption: {
    width: '30%',
    margin: 5,
    backgroundColor: c.inputBackground,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  diceOptionText: {
    color: c.text,
    fontSize: 16,
  },
  diceClose: {
    width: '30%',
    margin: 5,
    backgroundColor: c.magic,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  diceCloseText: {
    color: c.text,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.overlayStrong,
  },
  modalContent: {
    backgroundColor: c.card,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    color: c.text,
    fontSize: 18,
    marginBottom: 10,
  },
  modalResult: {
    color: c.highlight,
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: c.magic,
    borderRadius: 5,
  },
  modalButtonText: {
    color: c.text,
    fontSize: 16,
  },
  input: {
    backgroundColor: c.inputBackground,
    color: c.text,
    padding: 8,
    borderRadius: 5,
    width: 60,
    textAlign: 'center',
    marginBottom: 10,
  },
});

