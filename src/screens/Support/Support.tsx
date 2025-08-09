import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Linking, Alert, Platform, ScrollView } from 'react-native';
import useThemeStore from '@/context/Theme-store';

const donateLinks = [
  { label: 'PayPal', url: 'https://www.paypal.me/Vindener' },
  { label: 'Buy Me a Coffee', url: 'https://www.buymeacoffee.com/Vindener' },
  { label: 'Monobank (банка)', url: 'https://send.monobank.ua/jar/XXXXXXXXXXXX' },
];

const cryptoWallets = [{ label: 'USDT (TRC20)', value: 'TC3Ad4JQJDLeiBPCXRRqkKsikFFiTdjGvq' }];

export default function Support() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => ({
    screen: { flex: 1, backgroundColor: colors.background },
    container: { padding: 16, gap: 16 },
    card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border },
    title: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 },
    text: { color: colors.textSecondary, lineHeight: 20 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    pill: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground },
    pillText: { color: colors.text },
    input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8 },
    btn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground, alignItems: 'center' },
    btnText: { color: colors.text, fontWeight: '600' }
  }), [colors]);

  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');

  const openUrl = async (url: string) => {
    const can = await Linking.canOpenURL(url);
    if (!can) return Alert.alert('Помилка', 'Не вдалося відкрити посилання');
    Linking.openURL(url);
  };

  const sendFeedback = () => {
    if (!feedback.trim()) return Alert.alert('Заповни повідомлення', 'Напиши кілька слів 🙂');
    const subject = encodeURIComponent('Відгук щодо MythgateDND');
    const body = encodeURIComponent(`${feedback}\n\nEmail: ${email || '-'}`);
    const mailto = `mailto:vindener12@gmail.com?subject=${subject}&body=${body}`;
    openUrl(mailto);
  };

  const openTelegram = () => openUrl('https://t.me/Vindener_work');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Підтримати проєкт</Text>
          <Text style={styles.text}>Твоя підтримка допомагає розвивати застосунок. Обери зручний спосіб:</Text>
          <View style={styles.row}>
            {donateLinks.map((d) => (
              <TouchableOpacity key={d.label} onPress={() => openUrl(d.url)} style={styles.pill}>
                <Text style={styles.pillText}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Криптогаманці</Text>
          {cryptoWallets.map((w) => (
            <View key={w.label} style={{ marginTop: 10 }}>
              <Text style={[styles.text, { marginBottom: 6 }]}>{w.label}</Text>
              <TextInput value={w.value} editable={false} selectTextOnFocus style={styles.input} />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Зворотній зв’язок</Text>
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            multiline
            placeholder="Напиши свої ідеї, баги або побажання..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Email (за бажанням)"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TouchableOpacity onPress={sendFeedback} style={styles.btn}>
            <Text style={styles.btnText}>Надіслати лист</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openTelegram} style={styles.btn}>
            <Text style={styles.btnText}>Написати в Telegram</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );


}