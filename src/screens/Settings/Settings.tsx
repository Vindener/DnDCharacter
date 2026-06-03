import React from 'react';
import { View, Text, Switch, Modal, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { getStyles } from '@/screens/Settings/styles';
import useThemeStore from '@/context/Theme-store';
import useCustomCoinsStore from '@/context/CustomCoins-store';
import FileService from '@/shared/services/fileSerice';
import useMonsterStore from '@/context/Monster-store';
import Auth from '@/shared/components/Firebase/Auth';

const Settings = () => {
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const { coins, load, add, remove } = useCustomCoinsStore();
  React.useEffect(() => {
    load();
  }, []);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');

  const openModal = () => {
    setName('');
    setCode('');
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);
  const onSave = async () => {
    if (!name.trim() || !code.trim()) return;
    await add({ name: name.trim(), code: code.trim().toUpperCase() });
    closeModal();
  };
  const addMonsters = useMonsterStore((st) => st.addMonsters);
  const importMonsterBook = async () => {
    const monsters = await FileService.importMonsterBookFromFile();
    if (monsters && monsters.length) {
      await addMonsters(monsters);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.label}>Темна тема</Text>
      <Switch value={isDark} onValueChange={toggleTheme} />
      <Auth />
      <View style={{ width: '100%', marginTop: 12, maxWidth: 560 }}>
        <Text style={{ color: colors.text, fontSize: 18, marginBottom: 8 }}>Кастомні монети</Text>

        <TouchableOpacity
          onPress={openModal}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: colors.inputBackground,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            alignSelf: 'flex-start',
          }}
        >
          <Text style={{ color: colors.text }}>Додати монету</Text>
        </TouchableOpacity>

        <FlatList
          data={coins}
          keyExtractor={(item) => item.id}
          style={{ marginTop: 12 }}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16 }}>{item.name}</Text>
                <Text style={{ color: colors.text, opacity: 0.7 }}>{item.code}</Text>
              </View>
              <TouchableOpacity
                onPress={() => remove(item.id)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}
              >
                <Text style={{ color: colors.text }}>Видалити</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: colors.text, opacity: 0.7 }}>Поки що немає кастомних монет</Text>}
        />
      </View>

      <View style={{ width: '100%', marginTop: 32, maxWidth: 560 }}>
        <Text style={{ color: colors.text, fontSize: 18, marginBottom: 8 }}>Бестіарій</Text>
        <TouchableOpacity
          onPress={importMonsterBook}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: colors.inputBackground,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            alignSelf: 'flex-start',
          }}
        >
          <Text style={{ color: colors.text }}>Імпортувати книжку</Text>
        </TouchableOpacity>
      </View>



      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16 }}>
            <Text style={{ color: colors.text, fontSize: 18, marginBottom: 12 }}>Нова монета</Text>

            <Text style={{ color: colors.text, marginBottom: 6 }}>Назва</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Напр., Платина"
              placeholderTextColor={colors.text}
              style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 }}
            />

            <Text style={{ color: colors.text, marginBottom: 6 }}>Код</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Напр., ПЛТ"
              placeholderTextColor={colors.text}
              autoCapitalize="characters"
              style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 16 }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={closeModal} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginRight: 8 }}>
                <Text style={{ color: colors.text }}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSave} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.text }}>Зберегти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Settings;
