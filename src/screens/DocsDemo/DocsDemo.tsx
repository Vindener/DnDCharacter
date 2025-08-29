import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Linking, Alert, Platform, ScrollView } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import NewPersonalDocButton from '@/shared/components/DocsDemo/NewPersonalDocButton'
import { subscribeMyPersonalDocs } from '@/shared/services/firestore/pdocs';

export default function DocsDemo() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(
    () => ({
      screen: { flex: 1, backgroundColor: colors.background },
      container: { padding: 16, gap: 16 },
    }),
    [colors],
  );

  const [docs, setDocs] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let u;
    try {
      u = subscribeMyPersonalDocs(setDocs, (e) => setErr(e.message || String(e)));
    } catch (e) {
      setErr(e.message || String(e));
    }
    return () => {
      u && u();
    };
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {!!err && <Text style={{ color: 'red' }}>{err}</Text>}
        <Text>My Personal Docs</Text>
        <NewPersonalDocButton onCreated={() => {}} />

      </ScrollView>
    </View>
  );
}
