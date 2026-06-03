import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/shared/components/CharacterStats/Tabs/style';
import { CharacterViewModel } from '@/types/Character';
import useCharacterStore from '@/context/Character-store';
import useCustomCoinsStore from '@/context/CustomCoins-store';
import { fs, rd, sp } from '@/shared/styles/tokens';

interface CoinsProps {
  data: CharacterViewModel;
}

const clampToNonNegativeInt = (value: string | number) => {
  const n = Math.max(0, parseInt(String(value ?? '0').replace(/[^0-9]/g, ''), 10) || 0);
  return n;
};

const Coins: React.FC<CoinsProps> = ({ data }) => {
  const colors = useThemeStore((s) => s.colors);
  const sharedStyles = useMemo(() => getStyles(colors), [colors]);
  const local = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', marginBottom: sp(12) },
        rowLabel: { flex: 1, fontSize: fs(16), color: colors.text },
        btn: {
          paddingHorizontal: sp(14),
          paddingVertical: sp(8),
          borderRadius: rd(10),
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.inputBackground,
          minWidth: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
        btnText: { fontSize: fs(18), color: colors.text },
        input: {
          width: 90,
          marginHorizontal: 10,
          paddingHorizontal: sp(12),
          paddingVertical: sp(8),
          borderRadius: rd(10),
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.inputBackground,
          color: colors.text,
          textAlign: 'center',
        },
        sectionTitle: { ...sharedStyles.label, marginBottom: sp(8) },
        subTitle: { ...sharedStyles.label, marginTop: sp(12), marginBottom: sp(6), fontSize: fs(15), opacity: 0.9 },
        divider: { height: 1, backgroundColor: colors.border, opacity: 0.5, marginVertical: 12 },
      }),
    [colors, sharedStyles.label]
  );

  const { updateCharacterCoins, updateCharacterCustomCoins } = useCharacterStore();
  const { coins: customCoinsList, load } = useCustomCoinsStore();

  useEffect(() => { load(); }, []);

  const initial = data.coins ?? { gold: 0, silver: 0, copper: 0 };
  const [gold, setGold] = useState<number>(initial.gold ?? 0);
  const [silver, setSilver] = useState<number>(initial.silver ?? 0);
  const [copper, setCopper] = useState<number>(initial.copper ?? 0);

  const initialCustom = data.customCoins ?? {};
  const [customMap, setCustomMap] = useState<{ [id: string]: number }>(initialCustom);

  useEffect(() => {
    const nextBuiltIn = data.coins ?? { gold: 0, silver: 0, copper: 0 };
    setGold(nextBuiltIn.gold ?? 0);
    setSilver(nextBuiltIn.silver ?? 0);
    setCopper(nextBuiltIn.copper ?? 0);

    const nextCustom = { ...(data.customCoins ?? {}) };
    for (const c of customCoinsList) {
      if (nextCustom[c.id] == null) nextCustom[c.id] = 0;
    }
    setCustomMap(nextCustom);
  }, [data.id, data.coins?.gold, data.coins?.silver, data.coins?.copper, JSON.stringify(data.customCoins), JSON.stringify(customCoinsList.map(c => c.id))]);

  const commitBuiltIn = (next: { gold: number; silver: number; copper: number }) => {
    updateCharacterCoins(data.id, next);
  };
  const commitCustom = (next: { [id: string]: number }) => {
    updateCharacterCustomCoins(data.id, next);
  };

  const updateGold = (v: number) => {
    const vv = clampToNonNegativeInt(v);
    setGold(vv);
    commitBuiltIn({ gold: vv, silver, copper });
  };
  const updateSilver = (v: number) => {
    const vv = clampToNonNegativeInt(v);
    setSilver(vv);
    commitBuiltIn({ gold, silver: vv, copper });
  };
  const updateCopper = (v: number) => {
    const vv = clampToNonNegativeInt(v);
    setCopper(vv);
    commitBuiltIn({ gold, silver, copper: vv });
  };

  const updateCustomValue = (id: string, v: number) => {
    const vv = clampToNonNegativeInt(v);
    const next = { ...customMap, [id]: vv };
    setCustomMap(next);
    commitCustom(next);
  };

  const Row = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <View style={local.row}>
      <Text style={local.rowLabel}>{label}</Text>
      <TouchableOpacity onPress={() => onChange(Math.max(0, (value ?? 0) - 1))} activeOpacity={0.7} style={local.btn}>
        <Text style={local.btnText}>-</Text>
      </TouchableOpacity>
      <TextInput
        keyboardType='numeric'
        value={String(value ?? 0)}
        onChangeText={(t) => onChange(clampToNonNegativeInt(t))}
        style={local.input}
      />
      <TouchableOpacity onPress={() => onChange(Math.max(0, (value ?? 0) + 1))} activeOpacity={0.7} style={local.btn}>
        <Text style={local.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={sharedStyles.container}>
      <Text style={local.sectionTitle}>Монети персонажа</Text>

      <Row label='Золото' value={gold} onChange={updateGold} />
      <Row label='Срібло' value={silver} onChange={updateSilver} />
      <Row label='Мідь' value={copper} onChange={updateCopper} />

      <View style={local.divider} />
      <Text style={local.subTitle}>Кастомні монети</Text>
      {customCoinsList.length === 0 ? (
        <Text style={{ color: colors.text, opacity: 0.7 }}>Немає кастомних монет. Додайте в Налаштуваннях.</Text>
      ) : (
        <FlatList
          data={customCoinsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Row
              label={`${item.name} (${item.code})`}
              value={customMap[item.id] ?? 0}
              onChange={(v) => updateCustomValue(item.id, v)}
            />
          )}
        />
      )}
    </View>
  );
};

export default Coins;



