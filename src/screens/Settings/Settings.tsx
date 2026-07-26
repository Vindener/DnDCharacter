import React from 'react';
import { View, Text, Switch, Modal, TextInput, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { getStyles } from '@/screens/Settings/styles';
import useThemeStore from '@/context/Theme-store';
import useCustomCoinsStore from '@/context/CustomCoins-store';
import FileService from '@/shared/services/fileSerice';
import useMonsterStore from '@/context/Monster-store';
import Auth from '@/shared/components/Firebase/Auth';
import DeleteAccountModal from '@/screens/Settings/DeleteAccountModal';
import { changeAppLanguage, getCurrentLanguage } from '@/i18n';
import type { AppLanguage } from '@/i18n/languageStorage';
import type { TabStackParamList } from '@/navigation/TabNavigator';

type SettingsNavigation = StackNavigationProp<TabStackParamList, 'Settings'>;

const Settings = () => {
  const { i18n, t } = useTranslation(['settings', 'common']);
  const navigation = useNavigation<SettingsNavigation>();
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
  const [selectedLanguage, setSelectedLanguage] = React.useState<AppLanguage>(getCurrentLanguage());

  React.useEffect(() => {
    setSelectedLanguage(getCurrentLanguage());
  }, [i18n.language]);

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
  const openLegalLicenses = () => navigation.navigate('LegalLicenses');
  const handleLanguageChange = React.useCallback(
    async (language: AppLanguage) => {
      if (language === selectedLanguage) return;
      const previousLanguage = selectedLanguage;
      setSelectedLanguage(language);

      try {
        await changeAppLanguage(language);
      } catch (error) {
        console.warn('[i18n] Failed to change language:', error);
        setSelectedLanguage(previousLanguage);
      }
    },
    [selectedLanguage],
  );

  const renderLanguageButton = (language: AppLanguage, label: string) => {
    const isActive = selectedLanguage === language;

    return (
      <Pressable
        accessibilityRole='button'
        accessibilityState={{ selected: isActive }}
        android_ripple={{ color: colors.ripple }}
        onPress={() => handleLanguageChange(language)}
        style={({ pressed }) => [
          styles.languageButton,
          isActive ? styles.languageButtonActive : null,
          pressed ? styles.languageButtonPressed : null,
        ]}
      >
        <Text style={[styles.languageButtonText, isActive ? styles.languageButtonTextActive : null]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('settings:appearance.title')}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t('settings:appearance.darkTheme')}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.inputBackground }}
              thumbColor={isDark ? colors.onPrimary : colors.card}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('settings:account.title')}</Text>
          <Text style={styles.sectionHint}>{t('settings:account.hint')}</Text>
          <Auth />
        </View>

        <DeleteAccountModal />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('settings:language.title')}</Text>
          <Text style={styles.sectionHint}>{t('settings:language.hint')}</Text>
          <View style={styles.languageRow}>
            {renderLanguageButton('uk', t('settings:language.ukrainian'))}
            {renderLanguageButton('en', t('settings:language.english'))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('settings:customCoins.title')}</Text>
          <Text style={styles.sectionHint}>{t('settings:customCoins.hint')}</Text>

          <Pressable onPress={openModal} style={styles.actionButton} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.actionButtonText}>{t('settings:customCoins.add')}</Text>
          </Pressable>

          {coins.length ? (
            <View style={styles.coinsList}>
              {coins.map((item) => (
                <View key={item.id} style={styles.coinRow}>
                  <View style={styles.coinMeta}>
                    <Text style={styles.coinName}>{item.name}</Text>
                    <Text style={styles.coinCode}>{item.code}</Text>
                  </View>
                  <Pressable onPress={() => remove(item.id)} style={styles.removeButton} android_ripple={{ color: colors.ripple }}>
                    <Text style={styles.removeButtonText}>{t('common:actions.delete')}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>{t('settings:customCoins.empty')}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('settings:bestiary.title')}</Text>
          <Text style={styles.sectionHint}>{t('settings:bestiary.hint')}</Text>
          <Pressable onPress={importMonsterBook} style={styles.actionButton} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.actionButtonText}>{t('settings:bestiary.importBook')}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('settings:legal.title')}</Text>
          <Text style={styles.sectionHint}>{t('settings:legal.hint')}</Text>
          <Pressable onPress={openLegalLicenses} style={styles.actionButton} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.actionButtonText}>{t('settings:legal.open')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType='fade' onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('settings:customCoins.newCoin')}</Text>

            <Text style={styles.modalLabel}>{t('settings:customCoins.name')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('settings:customCoins.namePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>{t('settings:customCoins.code')}</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder={t('settings:customCoins.codePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize='characters'
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <Pressable onPress={closeModal} style={styles.modalButton} android_ripple={{ color: colors.ripple }}>
                <Text style={styles.modalButtonText}>{t('common:actions.cancel')}</Text>
              </Pressable>
              <Pressable onPress={onSave} style={styles.modalButton} android_ripple={{ color: colors.ripple }}>
                <Text style={styles.modalButtonText}>{t('common:actions.save')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Settings;
