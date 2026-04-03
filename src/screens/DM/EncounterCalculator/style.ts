import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/shared/styles/theme';

export const getStyles = (c: ThemeColors) =>
StyleSheet.create({
container: { flex: 1, padding: 16, backgroundColor: c.background },
section: { color: c.text, fontSize: 18, marginBottom: 8 },
row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
inputSmall: {
    width: 70,
    backgroundColor: c.inputBackground,
    color: c.text,
    padding: 8,
    borderRadius: 5,
    marginRight: 8,
    textAlign: 'center',
},
inputName: { flex: 1, backgroundColor: c.inputBackground, color: c.text, padding: 8, borderRadius: 5, marginRight: 8 },
addButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
addText: { marginLeft: 8, color: c.success, fontSize: 16 },
deleteBtn: { marginLeft: 4 },
result: { marginTop: 16 },
resultText: { color: c.text, fontSize: 16, marginBottom: 4 },
});

