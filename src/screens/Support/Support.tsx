import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Linking, Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import { fs, rd, sp } from '@/shared/styles/tokens';

const donationUrl = 'https://t.me/mythgatednd/12';

export default function Support() {
  const { t } = useTranslation('support');
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(
    () => ({
      screen: { flex: 1, backgroundColor: colors.background },
      container: { padding: sp(16), gap: sp(16) },
      card: { backgroundColor: colors.card, borderRadius: rd(12), padding: sp(16), borderWidth: 1, borderColor: colors.border },
      title: { fontSize: fs(18), fontWeight: '600' as const, color: colors.text, marginBottom: sp(8) },
      text: { color: colors.textSecondary, lineHeight: 20 },
      input: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.inputBackground,
        color: colors.text,
        borderRadius: rd(10),
        paddingHorizontal: sp(12),
        paddingVertical: sp(10),
        marginTop: sp(8),
      },
      btn: {
        marginTop: sp(12),
        paddingVertical: sp(12),
        borderRadius: rd(10),
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.inputBackground,
        alignItems: 'center' as const,
      },
      btnText: { color: colors.text, fontWeight: '600' as const },
    }),
    [colors],
  );

  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');

  const openUrl = async (url: string) => {
    const can = await Linking.canOpenURL(url);
    if (!can) return Alert.alert(t('errors.openLinkTitle'), t('errors.openLinkMessage'));
    Linking.openURL(url);
  };

  const sendFeedback = () => {
    if (!feedback.trim()) return Alert.alert(t('feedback.emptyTitle'), t('feedback.emptyMessage'));
    const subject = encodeURIComponent(t('feedback.emailSubject'));
    const body = encodeURIComponent(`${feedback}\n\n${t('feedback.emailLabel')}: ${email || '-'}`);
    const mailto = `mailto:vindener12@gmail.com?subject=${subject}&body=${body}`;
    openUrl(mailto);
  };

  const openTelegram = () => openUrl('https://t.me/mythgatednd?direct');
  const openTelegramNews = () => openUrl('https://t.me/mythgatednd');

  const openDonation = () => openUrl(donationUrl);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('sections.donation')}</Text>
          <Text style={{ color: colors.warning, fontWeight: '600' as const }}>{t('donation.warning')}</Text>
          <Text style={styles.text}>{t('donation.description')}</Text>
          <TouchableOpacity onPress={openDonation} style={styles.btn}>
            <Text style={styles.btnText}>{t('donation.cta')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{t('feedback.title')}</Text>
          <TouchableOpacity onPress={openTelegramNews} style={styles.btn}>
            <Text style={styles.btnText}>{t('feedback.telegramNews')}</Text>
          </TouchableOpacity>
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            multiline
            placeholder={t('feedback.messagePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            placeholder={t('feedback.emailPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TouchableOpacity onPress={sendFeedback} style={styles.btn}>
            <Text style={styles.btnText}>{t('feedback.sendEmail')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openTelegram} style={styles.btn}>
            <Text style={styles.btnText}>{t('feedback.telegramDirect')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
