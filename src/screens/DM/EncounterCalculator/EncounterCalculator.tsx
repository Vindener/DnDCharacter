import React, { useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import useMonsterStore from '@/context/Monster-store';
import TextInput from '@/shared/components/TextInput/TextInput';
import { Modal } from '@/shared/components/Modal/Modal';
import { evaluateEncounterDifficulty } from '@/dm/domain/encounter';
import { getStyles } from './style';
import { fs, sp } from '@/shared/styles/tokens';

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

const uid = () => Math.random().toString(36).slice(2, 9);

const EncounterCalculator: React.FC = () => {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const characters = useCharacterStore((s) => s.characters);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);

  const monstersStore = useMonsterStore((s) => s.monsters);
  const loadMonsters = useMonsterStore((s) => s.loadMonsters);

  useFocusEffect(
    React.useCallback(() => {
      loadMonsters();
      loadCharacters();
    }, [loadMonsters, loadCharacters]),
  );

  const [players, setPlayers] = useState<PlayerGroup[]>([{ id: uid(), level: '1', count: '1' }]);
  const [monsters, setMonsters] = useState<MonsterGroup[]>([{ id: uid(), name: '', cr: '1/8', count: '1' }]);

  const [isHeroesModal, setHeroesModal] = useState(false);
  const [isBestiaryModal, setBestiaryModal] = useState(false);

  const addPlayer = () => setPlayers((p) => [...p, { id: uid(), level: '1', count: '1' }]);
  const removePlayer = (id: string) => setPlayers((p) => p.filter((x) => x.id != id));
  const updatePlayer = (id: string, patch: Partial<PlayerGroup>) =>
    setPlayers((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const addMonster = () => setMonsters((m) => [...m, { id: uid(), name: '', cr: '1/8', count: '1' }]);
  const removeMonster = (id: string) => setMonsters((m) => m.filter((x) => x.id != id));
  const updateMonster = (id: string, patch: Partial<MonsterGroup>) =>
    setMonsters((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const pickHero = (heroId: string) => {
    const hero = characters.find((c) => c.id === heroId);
    if (!hero) return;
    setPlayers((p) => [...p, { id: uid(), level: String(hero.level ?? 1), count: '1' }]);
    setHeroesModal(false);
  };

  const pickMonster = (monsterId: string) => {
    const mon = monstersStore.find((m) => m.id === monsterId);
    if (!mon) return;
    setMonsters((m) => [...m, { id: uid(), name: mon.name || '', cr: mon.challenge || '0', count: '1' }]);
    setBestiaryModal(false);
  };

  const result = useMemo(() => {
    const playerInputs: Array<{ level: number }> = [];
    for (const playerGroup of players) {
      const level = Math.max(1, Math.min(20, Number(playerGroup.level) || 1));
      const count = Math.max(0, Number(playerGroup.count) || 0);
      for (let index = 0; index < count; index += 1) {
        playerInputs.push({ level });
      }
    }

    const monsterInputs = monsters.map((monsterGroup) => ({
      challenge: String(monsterGroup.cr || ''),
      count: Math.max(0, Number(monsterGroup.count) || 0),
    }));

    const evaluated = evaluateEncounterDifficulty(playerInputs, monsterInputs);

    return {
      adjustedXP: evaluated.adjustedXP,
      difficulty: evaluated.difficulty,
      xpPerPlayer: evaluated.xpPerPlayer,
      partySize: evaluated.thresholds.partySize,
      totalXP: evaluated.adjustedXP,
    };
  }, [players, monsters]);

  return (
    <View style={styles.container}>
      <Text style={styles.section}>Гравці</Text>

      {players.map((p) => (
        <View key={p.id} style={styles.row}>
          <TextInput
            value={p.level}
            keyboardType='numeric'
            onChangeText={(t) => updatePlayer(p.id, { level: t })}
            placeholder='Рівень'
            style={{ width: 70, marginRight: sp(8) }}
          />
          <TextInput
            value={p.count}
            keyboardType='numeric'
            onChangeText={(t) => updatePlayer(p.id, { count: t })}
            placeholder='К-сть'
            style={{ width: 70, marginRight: sp(8) }}
          />
          <TouchableOpacity onPress={() => removePlayer(p.id)} style={styles.deleteBtn}>
            <Ionicons name='trash-outline' size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.addButton}>
        <TouchableOpacity onPress={addPlayer} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name='add-circle-outline' size={20} color={colors.text} />
          <Text style={styles.addText}>Додати групу вручну</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addButton}>
        <TouchableOpacity onPress={() => setHeroesModal(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name='person-add-outline' size={20} color={colors.text} />
          <Text style={styles.addText}>Додати з героїв</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.section, { marginTop: sp(12) }]}>Монстри</Text>

      {monsters.map((m) => (
        <View key={m.id} style={styles.row}>
          <TextInput
            value={m.name}
            onChangeText={(t) => updateMonster(m.id, { name: t })}
            placeholder='Назва'
            style={{ flex: 1, marginRight: sp(8) }}
          />
          <TextInput
            value={m.cr}
            onChangeText={(t) => updateMonster(m.id, { cr: t })}
            placeholder='CR'
            style={{ width: 70, marginRight: sp(8) }}
          />
          <TextInput
            value={m.count}
            keyboardType='numeric'
            onChangeText={(t) => updateMonster(m.id, { count: t })}
            placeholder='К-сть'
            style={{ width: 70, marginRight: sp(8) }}
          />
          <TouchableOpacity onPress={() => removeMonster(m.id)} style={styles.deleteBtn}>
            <Ionicons name='trash-outline' size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.addButton}>
        <TouchableOpacity onPress={addMonster} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name='add-circle-outline' size={20} color={colors.text} />
          <Text style={styles.addText}>Додати монстра вручну</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addButton}>
        <TouchableOpacity onPress={() => setBestiaryModal(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name='skull-outline' size={20} color={colors.text} />
          <Text style={styles.addText}>Додати з бестіарія</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.result}>
        <Text style={styles.resultText}>Складність: {result.difficulty}</Text>
        {result.totalXP > 0 && (
          <Text style={styles.resultText}>Досвід за бій: {result.totalXP} (≈{result.xpPerPlayer} за гравця)</Text>
        )}
      </View>

      <Modal isVisible={isHeroesModal} title='Додати героя' onClose={() => setHeroesModal(false)}>
        <ScrollView style={{ maxHeight: 360 }}>
          {characters.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>Немає збережених героїв</Text>
          ) : (
            characters.map((hero) => (
              <TouchableOpacity
                key={hero.id}
                onPress={() => pickHero(hero.id)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: sp(10) }}
              >
                <Ionicons name='person-outline' size={18} color={colors.textSecondary} />
                <Text style={{ marginLeft: sp(8), color: colors.text, fontSize: fs(16) }}>{hero.name || 'Без імені'}</Text>
                <Text style={{ marginLeft: sp(8), color: colors.textSecondary, fontSize: fs(14) }}>
                  {hero.class || '???'} · {hero.level || '?'} рівень
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </Modal>

      <Modal isVisible={isBestiaryModal} title='Додати монстра' onClose={() => setBestiaryModal(false)}>
        <ScrollView style={{ maxHeight: 360 }}>
          {monstersStore.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>Бестіарій порожній</Text>
          ) : (
            monstersStore.map((mon) => (
              <TouchableOpacity
                key={mon.id}
                onPress={() => pickMonster(mon.id)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: sp(10) }}
              >
                <Ionicons name='skull-outline' size={18} color={colors.textSecondary} />
                <Text style={{ marginLeft: sp(8), color: colors.text, fontSize: fs(16) }}>{mon.name || 'Без назви'}</Text>
                {!!mon.challenge && (
                  <Text style={{ marginLeft: sp(8), color: colors.textSecondary, fontSize: fs(14) }}>CR {mon.challenge}</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </Modal>
    </View>
  );
};

export default EncounterCalculator;














