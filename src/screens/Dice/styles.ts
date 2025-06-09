import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  diceButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6200EE',
    padding: 15,
    borderRadius: 50,
  },
  diceText: {
    color: 'white',
    fontSize: 24,
  },
  diceMenu: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 10,
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 180,
  },
  diceOption: {
    width: '30%',
    margin: 5,
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  diceOptionText: {
    color: 'white',
    fontSize: 16,
  },
  diceClose: {
    width: '30%',
    margin: 5,
    backgroundColor: '#6200EE',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  diceCloseText: {
    color: 'white',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
  },
  modalResult: {
    color: '#B39DDB',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#6200EE',
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#555',
    color: 'white',
    padding: 8,
    borderRadius: 5,
    width: 60,
    textAlign: 'center',
    marginBottom: 10,
  },
});
