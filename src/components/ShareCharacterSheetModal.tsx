import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import {
  addEditorByEmail,
  characterCloudRepository,
  removeEditor,
  subscribeCharacterSheet,
} from '@/repositories/characterCloudRepository';

type Props = {
  visible: boolean;
  onClose: () => void;
  sheetId: string;
};

export default function ShareCharacterSheetModal({ visible, onClose, sheetId }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editors, setEditors] = useState<{ uid: string; email: string }[]>([]);

  useEffect(() => {
    if (!visible) return;

    const unsub = subscribeCharacterSheet(sheetId, async (doc) => {
      if (!doc) return;

      const uids: string[] = doc.editors || [];
      if (uids.length === 0) {
        setEditors([]);
        return;
      }

      try {
        const list = await characterCloudRepository.getEditorsForSheet(uids);
        setEditors(list);
      } catch {
        setEditors(uids.map((uid) => ({ uid, email: uid })));
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [visible, sheetId]);

  async function onShare() {
    setError(null);
    try {
      await addEditorByEmail(sheetId, email);
      setEmail('');
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function onRemove(uid: string) {
    try {
      await removeEditor(sheetId, uid);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 16 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Поділитися персонажем</Text>

          <Text style={{ color: '#aaa', marginBottom: 8 }}>Запросити редактора за email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder='name@example.com'
            autoCapitalize='none'
            keyboardType='email-address'
            style={{ backgroundColor: '#222', color: 'white', padding: 12, borderRadius: 10, marginBottom: 8 }}
          />
          {error ? <Text style={{ color: 'tomato', marginBottom: 8 }}>{error}</Text> : null}

          <TouchableOpacity
            onPress={onShare}
            style={{ backgroundColor: '#4c8bf5', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Поділитися</Text>
          </TouchableOpacity>

          <Text style={{ color: 'white', fontWeight: '600', marginBottom: 8 }}>Редактори</Text>
          <FlatList
            data={editors}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: 'white' }}>{item.email}</Text>
                <TouchableOpacity onPress={() => onRemove(item.uid)}>
                  <Text style={{ color: '#f55' }}>Видалити</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={{ color: '#888' }}>Поки що немає редакторів</Text>}
          />

          <TouchableOpacity onPress={onClose} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: '#ddd' }}>Закрити</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}





