import React, { useEffect, useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { DMStackParamList } from '@/navigation/DMNavigator';
import { TextInput, MultiTextInput } from '@/shared/components/TextInput';
import useThemeStore from '@/context/Theme-store';
import { getEditStyles } from './style';

export interface DMNote {
  id: string;
  title: string;
  content: string;
  campaign: string;
  lastEdited: number;
}

const STORAGE_KEY = 'DM_NOTES_V2';

type Props = StackScreenProps<DMStackParamList, 'DMNoteEdit'>;

const DMNoteEdit: React.FC<Props> = ({ route }) => {
  const { id } = route.params;
  const [note, setNote] = useState<DMNote | null>(null);
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getEditStyles(colors), [colors]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      try {
        const parsed: DMNote[] = JSON.parse(val || '[]');
        const found = parsed.find((n) => n.id === id);
        if (found) setNote(found);
      } catch {}
    });
  }, [id]);

  useEffect(() => {
    if (!note) return;
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      try {
        const parsed: DMNote[] = JSON.parse(val || '[]');
        const updated = parsed.map((n) => (n.id === id ? note : n));
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      } catch {}
    });
  }, [note, id]);

  if (!note) return null;

  const handleChange = (key: keyof DMNote, value: string) => {
    setNote((prev) => prev && { ...prev, [key]: value, lastEdited: Date.now() });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Заголовок:</Text>
      <TextInput style={styles.input} value={note.title} onChangeText={(t) => handleChange('title', t)} />
      <Text style={styles.label}>Кампанія:</Text>
      <TextInput style={styles.input} value={note.campaign} onChangeText={(t) => handleChange('campaign', t)} />
      <Text style={styles.label}>Вміст:</Text>
      <MultiTextInput numberOfLines={8} value={note.content} onChangeText={(t) => handleChange('content', t)} />
      <View style={styles.dateRow}>
        <Ionicons name='time-outline' size={16} color={colors.textSecondary} />
        <Text style={styles.dateText}>Остання зміна: {new Date(note.lastEdited).toLocaleString()}</Text>
      </View>
    </View>
  );
};

export default DMNoteEdit;
