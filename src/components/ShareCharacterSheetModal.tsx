import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { fs, rd, sp } from '@/shared/styles/tokens';
import {
  addEditorByEmail,
  characterCloudRepository,
  removeEditor,
  subscribeCharacterSheet,
} from '@/repositories/characterCloudRepository';
import useThemeStore from '@/context/Theme-store';

type Props = {
  visible: boolean;
  onClose: () => void;
  sheetId: string;
};

export default function ShareCharacterSheetModal({ visible, onClose, sheetId }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: colors.overlaySoft,
          justifyContent: 'center',
          padding: sp(20),
        },
        card: {
          backgroundColor: colors.card,
          borderRadius: rd(16),
          padding: sp(16),
          borderWidth: 1,
          borderColor: colors.border,
        },
        title: {
          color: colors.text,
          fontSize: fs(18),
          fontWeight: '600',
          marginBottom: sp(8),
        },
        sectionLabel: {
          color: colors.textSecondary,
          marginBottom: sp(8),
        },
        input: {
          backgroundColor: colors.inputBackground,
          color: colors.text,
          padding: sp(12),
          borderRadius: rd(10),
          marginBottom: sp(8),
          borderWidth: 1,
          borderColor: colors.border,
        },
        shareButton: {
          backgroundColor: colors.primary,
          padding: sp(12),
          borderRadius: rd(10),
          alignItems: 'center',
          marginBottom: sp(16),
        },
        shareButtonText: {
          color: colors.onPrimary,
          fontWeight: '600',
        },
        editorsTitle: {
          color: colors.text,
          fontWeight: '600',
          marginBottom: sp(8),
        },
        editorRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: sp(6),
        },
        editorEmail: {
          color: colors.text,
        },
        removeText: {
          color: colors.danger,
        },
        emptyText: {
          color: colors.textSecondary,
        },
        closeButton: {
          marginTop: sp(16),
          alignItems: 'center',
        },
        closeText: {
          color: colors.textSecondary,
        },
        errorText: {
          color: colors.danger,
          marginBottom: sp(8),
        },
      }),
    [colors],
  );

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

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message) return error.message;
    return String(error);
  };

  async function onShare() {
    setError(null);
    try {
      await addEditorByEmail(sheetId, email);
      setEmail('');
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  }

  async function onRemove(uid: string) {
    try {
      await removeEditor(sheetId, uid);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  }

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Поділитися персонажем</Text>

          <Text style={styles.sectionLabel}>Запросити редактора за email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder='name@example.com'
            placeholderTextColor={colors.textSecondary}
            autoCapitalize='none'
            keyboardType='email-address'
            style={styles.input}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity onPress={onShare} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Поділитися</Text>
          </TouchableOpacity>

          <Text style={styles.editorsTitle}>Редактори</Text>
          <FlatList
            data={editors}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <View style={styles.editorRow}>
                <Text style={styles.editorEmail}>{item.email}</Text>
                <TouchableOpacity onPress={() => onRemove(item.uid)}>
                  <Text style={styles.removeText}>Видалити</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Поки що немає редакторів</Text>}
          />

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Закрити</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}








