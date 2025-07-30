import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DMStackParamList } from '@/navigation/DMNavigator';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './style';
import type { DMNote } from './DMNoteEdit';

const STORAGE_KEY = 'DM_NOTES_V2';

type Nav = StackNavigationProp<DMStackParamList, 'DMNotes'>;

const DMNotes: React.FC = () => {
  const [notes, setNotes] = useState<DMNote[]>([]);
  const navigation = useNavigation<Nav>();
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const loadNotes = useCallback(async () => {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: DMNote[] = JSON.parse(val || '[]');
      setNotes(Array.isArray(parsed) ? parsed : []);
    } catch {
      setNotes([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes]),
  );

  const saveNotes = (newNotes: DMNote[]) => {
    setNotes(newNotes);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes)).catch(() => {});
  };

  const addNote = () => {
    const newNote: DMNote = {
      id: Date.now().toString(),
      title: '',
      content: '',
      campaign: '1 компанія',
      lastEdited: Date.now(),
    };
    const updated = [newNote, ...notes];
    saveNotes(updated);
    navigation.navigate('DMNoteEdit', { id: newNote.id });
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    saveNotes(updated);
  };

  const openNote = (id: string) => navigation.navigate('DMNoteEdit', { id });

  const renderItem = ({ item }: { item: DMNote }) => (
    <TouchableOpacity style={styles.noteRow} onPress={() => openNote(item.id)}>
      <View style={styles.noteInfo}>
        <Text style={styles.noteTitle}>{item.title || 'Без назви'}</Text>
        <Text style={styles.noteCampaign}>{item.campaign}</Text>
        <Text style={styles.noteDate}>{new Date(item.lastEdited).toLocaleString()}</Text>
      </View>
      <TouchableOpacity onPress={() => deleteNote(item.id)} style={styles.deleteBtn}>
        <Ionicons name='trash-outline' size={20} color='#d00' />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList data={notes} keyExtractor={(n) => n.id} renderItem={renderItem} />
      <TouchableOpacity onPress={addNote} style={styles.addButton}>
        <Ionicons name='add-circle-outline' size={28} color='#28a745' />
        <Text style={styles.addText}>Нова нотатка</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DMNotes;
