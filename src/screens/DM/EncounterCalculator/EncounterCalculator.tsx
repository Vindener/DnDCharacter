import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/context/Theme-store';
import TextInput from '@/shared/components/TextInput/TextInput';
import { DIFFICULTY_THRESHOLDS, CHALLENGE_XP, getMonsterMultiplier } from '@/shared/const/encounter';
import { getStyles } from './style';

interface PlayerGroup {
  id: string;
  level: string;
  count: string;
}
interface MonsterGroup {
  id: string;
  name: string;
  cr: string;
  count: string;
}

const EncounterCalculator: React.FC = () => {
  const [players, setPlayers] = useState<PlayerGroup[]>([{ id: Date.now().toString(), level: '1', count: '1' }]);
  const [monsters, setMonsters] = useState<MonsterGroup[]>([{ id: Date.now().toString() + 'm', name: '', cr: '1', count: '1' }]);
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const result = useMemo(() => {
    let thresholds = { easy: 0, medium: 0, hard: 0, deadly: 0 };
    let partySize = 0;
    players.forEach((p) => {
      const lvl = parseInt(p.level, 10);
      const cnt = parseInt(p.count, 10);
      if (!lvl || !cnt) return;
      partySize += cnt;
      const t = DIFFICULTY_THRESHOLDS[lvl as keyof typeof DIFFICULTY_THRESHOLDS];
      if (!t) return;
      thresholds.easy += t.easy * cnt;
      thresholds.medium += t.medium * cnt;
      thresholds.hard += t.hard * cnt;
      thresholds.deadly += t.deadly * cnt;
    });

    let baseXP = 0;
    let monstersCount = 0;
    monsters.forEach((m) => {
      const crXP = CHALLENGE_XP[m.cr.trim()];
      const cnt = parseInt(m.count, 10);
      if (!crXP || !cnt) return;
      monstersCount += cnt;
      baseXP += crXP * cnt;
    });

    if (baseXP === 0 || partySize === 0) {
      return { difficulty: '', xpPerPlayer: 0, totalXP: 0 };
    }

    const multiplier = getMonsterMultiplier(monstersCount, partySize);
    const adjusted = baseXP * multiplier;

    let difficulty = '';
    if (adjusted >= thresholds.deadly) difficulty = 'Смертельно';
    else if (adjusted >= thresholds.hard) difficulty = 'Складно';
    else if (adjusted >= thresholds.medium) difficulty = 'Середньо';
    else if (adjusted >= thresholds.easy) difficulty = 'Легко';
    else difficulty = 'Дуже легко';

    const xpPerPlayer = Math.round(baseXP / partySize);
    return { difficulty, xpPerPlayer, totalXP: baseXP };
  }, [players, monsters]);

  const updatePlayer = (i: number, key: keyof PlayerGroup, value: string) => {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  };

  const updateMonster = (i: number, key: keyof MonsterGroup, value: string) => {
    setMonsters((prev) => prev.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)));
  };

  const removePlayer = (i: number) => setPlayers((prev) => prev.filter((_, idx) => idx !== i));
  const removeMonster = (i: number) => setMonsters((prev) => prev.filter((_, idx) => idx !== i));

  const addPlayer = () => setPlayers((prev) => [...prev, { id: Date.now().toString(), level: '1', count: '1' }]);
  const addMonster = () => setMonsters((prev) => [...prev, { id: Date.now().toString() + 'm', name: '', cr: '1', count: '1' }]);

  return (
    <View style={styles.container}>
      <Text style={styles.section}>Гравці</Text>
      {players.map((p, i) => (
        <View style={styles.row} key={p.id}>
          <TextInput
            style={styles.inputSmall}
            keyboardType='numeric'
            value={p.count}
            onChangeText={(t) => updatePlayer(i, 'count', t)}
            placeholder='К-сть'
          />
          <TextInput
            style={styles.inputSmall}
            keyboardType='numeric'
            value={p.level}
            onChangeText={(t) => updatePlayer(i, 'level', t)}
            placeholder='Рівень'
          />
          <TouchableOpacity onPress={() => removePlayer(i)} style={styles.deleteBtn}>
            <Ionicons name='trash-outline' size={20} color='#d00' />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={addPlayer} style={styles.addButton}>
        <Ionicons name='add-circle-outline' size={28} color='#28a745' />
        <Text style={styles.addText}>Додати ще</Text>
      </TouchableOpacity>

      <Text style={[styles.section, { marginTop: 16 }]}>Вороги</Text>
      {monsters.map((m, i) => (
        <View style={styles.row} key={m.id}>
          <TextInput style={styles.inputName} value={m.name} onChangeText={(t) => updateMonster(i, 'name', t)} placeholder='Назва' />
          <TextInput
            style={styles.inputSmall}
            keyboardType='numeric'
            value={m.count}
            onChangeText={(t) => updateMonster(i, 'count', t)}
            placeholder='К-сть'
          />
          <TextInput style={styles.inputSmall} value={m.cr} onChangeText={(t) => updateMonster(i, 'cr', t)} placeholder='CR' />
          <TouchableOpacity onPress={() => removeMonster(i)} style={styles.deleteBtn}>
            <Ionicons name='trash-outline' size={20} color='#d00' />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={addMonster} style={styles.addButton}>
        <Ionicons name='add-circle-outline' size={28} color='#28a745' />
        <Text style={styles.addText}>Додати ще</Text>
      </TouchableOpacity>

      <View style={styles.result}>
        <Text style={styles.resultText}>Складність: {result.difficulty}</Text>
        {result.totalXP > 0 && (
          <Text style={styles.resultText}>
            Досвід за бій: {result.totalXP} (≈{result.xpPerPlayer} за гравця)
          </Text>
        )}
      </View>
    </View>
  );
};

export default EncounterCalculator;
