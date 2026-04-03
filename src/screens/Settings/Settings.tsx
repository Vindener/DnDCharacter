import React from 'react';
import { View, Text, Switch, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
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
  }, [load]);

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
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Оформлення</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Темна тема</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.inputBackground }}
              thumbColor={isDark ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Акаунт</Text>
          <Text style={styles.sectionHint}>Синхронізація і резервне збереження через Google акаунт.</Text>
          <Auth />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Кастомні монети</Text>
          <Text style={styles.sectionHint}>Додай свої номінали для інвентарю та економіки кампанії.</Text>

          <TouchableOpacity onPress={openModal} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Додати монету</Text>
          </TouchableOpacity>

          {coins.length ? (
            <View style={styles.coinsList}>
              {coins.map((item) => (
                <View key={item.id} style={styles.coinRow}>
                  <View style={styles.coinMeta}>
                    <Text style={styles.coinName}>{item.name}</Text>
                    <Text style={styles.coinCode}>{item.code}</Text>
                  </View>
                  <TouchableOpacity onPress={() => remove(item.id)} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>Видалити</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Поки що немає кастомних монет</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Бестіарій</Text>
          <Text style={styles.sectionHint}>Імпортуй книжку монстрів з файлу в локальну базу.</Text>
          <TouchableOpacity onPress={importMonsterBook} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Імпортувати книжку</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType='fade' onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Нова монета</Text>

            <Text style={styles.modalLabel}>Назва</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder='Напр., Платина'
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Код</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder='Напр., ПЛТ'
              placeholderTextColor={colors.textSecondary}
              autoCapitalize='characters'
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeModal} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSave} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Зберегти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Settings;
