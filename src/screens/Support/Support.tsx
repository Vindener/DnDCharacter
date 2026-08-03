import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Linking, Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import { fs, rd, sp } from '@/shared/styles/tokens';

const donationUrl = 'https://t.me/mythgatednd/12';
const telegramChannelUrl = 'https://t.me/mythgatednd';
// A personal-account chat, unlike a group/channel, honors Telegram's undocumented
// but universally-supported `?text=` param and prefills the composer with it.
const telegramContactUrl = 'https://t.me/arbuzka_baza';

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

  const openUrl = async (url: string) => {
    const can = await Linking.canOpenURL(url);
    if (!can) return Alert.alert(t('errors.openLinkTitle'), t('errors.openLinkMessage'));
    Linking.openURL(url);
  };

  const sendFeedbackToTelegram = () => {
    const message = feedback.trim();
    if (!message) return Alert.alert(t('feedback.emptyTitle'), t('feedback.emptyMessage'));
    openUrl(`${telegramContactUrl}?text=${encodeURIComponent(message)}`);
  };

  const openTelegramNews = () => openUrl(telegramChannelUrl);

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
          <TouchableOpacity onPress={sendFeedbackToTelegram} style={styles.btn}>
            <Text style={styles.btnText}>{t('feedback.telegramDirect')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
