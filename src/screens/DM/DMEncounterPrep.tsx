import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import type { DMCampaign, InitiativeSeed } from '@/types/DM';
import { subscribeAccessibleCampaigns } from '@/services/dmCampaigns';
import useCharacterStore from '@/context/Character-store';
import useMonsterStore from '@/context/Monster-store';
import { CHALLENGE_XP, DIFFICULTY_THRESHOLDS, getMonsterMultiplier } from '@/shared/const/encounter';

type Props = StackScreenProps<DMStackParamList, 'DMEncounterPrep'>;

type EncounterMonster = {
  id: string;
  name: string;
  challenge: string;
  count: number;
};

const DMEncounterPrep: React.FC<Props> = ({ route, navigation }) => {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const characters = useCharacterStore((s) => s.characters);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const monsters = useMonsterStore((s) => s.monsters);
  const pinnedMonsterIds = useMonsterStore((s) => s.pinnedMonsterIds);
  const loadMonsters = useMonsterStore((s) => s.loadMonsters);

  const [campaigns, setCampaigns] = useState<DMCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(route.params?.campaignId || '');
  const [selectedPlayers, setSelectedPlayers] = useState<Record<string, boolean>>({});
  const [monsterSearch, setMonsterSearch] = useState('');
  const [encounterMonsters, setEncounterMonsters] = useState<EncounterMonster[]>([]);

  useEffect(() => {
    void loadCharacters();
    void loadMonsters();
  }, [loadCharacters, loadMonsters]);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;

    const run = async () => {
      unsub = await subscribeAccessibleCampaigns((next) => {
        if (cancelled) return;
        setCampaigns(next);
        if (!selectedCampaignId && next.length) {
          setSelectedCampaignId(next[0].id);
        }
      });
    };

    void run();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, [selectedCampaignId]);

  const selectedCampaign = useMemo(() => campaigns.find((campaign) => campaign.id === selectedCampaignId) || null, [campaigns, selectedCampaignId]);

  const party = useMemo(() => {
    return characters.filter((character) => {
      if (!selectedCampaign) return false;
      if (character.campaignId && character.campaignId === selectedCampaign.id) return true;
      const legacy = String(character.campaign || '').trim().toLowerCase();
      return legacy && legacy === selectedCampaign.name.trim().toLowerCase();
    });
  }, [characters, selectedCampaign]);

  useEffect(() => {
    setSelectedPlayers((prev) => {
      const next: Record<string, boolean> = {};
      for (const player of party) {
        next[player.id] = prev[player.id] ?? true;
      }
      return next;
    });
  }, [party]);

  const pinnedMonsters = useMemo(() => monsters.filter((monster) => pinnedMonsterIds.includes(monster.id)), [monsters, pinnedMonsterIds]);

  const filteredMonsters = useMemo(() => {
    const text = monsterSearch.trim().toLowerCase();
    const list = pinnedMonsters.length ? pinnedMonsters : monsters;
    if (!text) return list.slice(0, 24);
    return list.filter((monster) => {
      return (
        (monster.name || '').toLowerCase().includes(text) ||
        (monster.type || '').toLowerCase().includes(text) ||
        (monster.challenge || '').toLowerCase().includes(text)
      );
    }).slice(0, 24);
  }, [monsterSearch, monsters, pinnedMonsters]);

  const addMonster = (name: string, challenge: string) => {
    setEncounterMonsters((prev) => {
      const existing = prev.find((item) => item.name === name && item.challenge === challenge);
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                count: item.count + 1,
              }
            : item,
        );
      }

      return [
        ...prev,
        {
          id: `${name}-${challenge}-${Date.now()}`,
          name,
          challenge,
          count: 1,
        },
      ];
    });
  };

  const removeMonster = (id: string) => {
    setEncounterMonsters((prev) => prev.filter((item) => item.id !== id));
  };

  const result = useMemo(() => {
    const selectedParty = party.filter((player) => selectedPlayers[player.id]);

    const thresholds = selectedParty.reduce(
      (acc, player) => {
        const level = Math.max(1, Math.min(20, Number(player.level) || 1));
        const table = DIFFICULTY_THRESHOLDS[level];
        if (!table) return acc;
        acc.easy += table.easy;
        acc.medium += table.medium;
        acc.hard += table.hard;
        acc.deadly += table.deadly;
        acc.partySize += 1;
        return acc;
      },
      { easy: 0, medium: 0, hard: 0, deadly: 0, partySize: 0 },
    );

    let baseXP = 0;
    let monstersCount = 0;
    for (const monster of encounterMonsters) {
      const xp = CHALLENGE_XP[monster.challenge as keyof typeof CHALLENGE_XP] ?? 0;
      baseXP += xp * Math.max(1, monster.count);
      monstersCount += Math.max(1, monster.count);
    }

    const multiplier = getMonsterMultiplier(monstersCount, thresholds.partySize || 1);
    const adjustedXP = Math.round(baseXP * multiplier);
    let difficulty: 'Немає даних' | 'Дуже легко' | 'Легко' | 'Середньо' | 'Складно' | 'Смертельно' = 'Немає даних';

    if (adjustedXP > 0) {
      if (adjustedXP < thresholds.easy) difficulty = 'Дуже легко';
      else if (adjustedXP < thresholds.medium) difficulty = 'Легко';
      else if (adjustedXP < thresholds.hard) difficulty = 'Середньо';
      else if (adjustedXP < thresholds.deadly) difficulty = 'Складно';
      else difficulty = 'Смертельно';
    }

    const xpPerPlayer = thresholds.partySize > 0 ? Math.round(adjustedXP / thresholds.partySize) : 0;

    return {
      selectedParty,
      adjustedXP,
      xpPerPlayer,
      difficulty,
    };
  }, [encounterMonsters, party, selectedPlayers]);

  const startInitiative = () => {
    if (!selectedCampaignId) return;

    const entries: InitiativeSeed['entries'] = [];

    result.selectedParty.forEach((player) => {
      entries.push({
        id: `player-${player.id}`,
        name: player.name || 'Player',
        roll: '',
        hits: String(player.hp?.current || 0),
      });
    });

    encounterMonsters.forEach((monster) => {
      for (let index = 0; index < Math.max(1, monster.count); index += 1) {
        entries.push({
          id: `monster-${monster.id}-${index}`,
          name: monster.count > 1 ? `${monster.name} #${index + 1}` : monster.name,
          roll: '',
          hits: '',
        });
      }
    });

    const seed: InitiativeSeed = {
      source: 'dm-encounter-prep',
      campaignId: selectedCampaignId,
      entries,
    };

    const root = navigation.getParent() as any;
    if (!root) return;
    root.navigate('Initiative', { seed });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Encounter Prep Starter</Text>
        <Text style={styles.hint}>Select campaign, pick party and monsters, then start Initiative with seeded entries.</Text>
        <View style={styles.statsRow}>
          {campaigns.map((campaign) => (
            <Pressable
              key={campaign.id}
              style={[styles.statChip, selectedCampaignId === campaign.id ? { borderColor: colors.text } : null]}
              onPress={() => setSelectedCampaignId(campaign.id)}
              android_ripple={{ color: '#999' }}
            >
              <Text style={styles.statChipText}>{campaign.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Party ({result.selectedParty.length})</Text>
        {!party.length && <Text style={styles.hint}>No party members linked to selected campaign.</Text>}
        {party.map((player) => {
          const selected = selectedPlayers[player.id];
          return (
            <Pressable
              key={player.id}
              style={styles.updateRow}
              onPress={() => setSelectedPlayers((prev) => ({ ...prev, [player.id]: !prev[player.id] }))}
              android_ripple={{ color: '#999' }}
            >
              <Text style={styles.updateTitle}>{player.name || 'Character'} {selected ? '• Selected' : ''}</Text>
              <Text style={styles.updateMeta}>Lvl {player.level || 1} • Init {player.initiative || 0} • HP {player.hp?.current || 0}/{player.hp?.max || 0}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Monsters</Text>
        <TextInput
          value={monsterSearch}
          onChangeText={setMonsterSearch}
          placeholder={pinnedMonsters.length ? 'Search pinned bestiary' : 'Search bestiary'}
          placeholderTextColor={colors.textSecondary}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }}
        />

        {filteredMonsters.map((monster) => (
          <Pressable
            key={monster.id}
            style={styles.updateRow}
            onPress={() => addMonster(monster.name || 'Monster', monster.challenge || '0')}
            android_ripple={{ color: '#999' }}
          >
            <Text style={styles.updateTitle}>{monster.name || 'Monster'}</Text>
            <Text style={styles.updateMeta}>CR {monster.challenge || '0'} • {monster.type || 'Unknown type'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Encounter Lineup ({encounterMonsters.length})</Text>
        {!encounterMonsters.length && <Text style={styles.hint}>Add monsters from the list above.</Text>}
        {encounterMonsters.map((monster) => (
          <View key={monster.id} style={styles.updateRow}>
            <Text style={styles.updateTitle}>{monster.name}</Text>
            <Text style={styles.updateMeta}>CR {monster.challenge} • Count {monster.count}</Text>
            <View style={styles.laneGrid}>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  setEncounterMonsters((prev) =>
                    prev.map((item) =>
                      item.id === monster.id ? { ...item, count: Math.max(1, item.count - 1) } : item,
                    ),
                  );
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.laneButtonText}>Count -1</Text>
              </Pressable>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  setEncounterMonsters((prev) =>
                    prev.map((item) => (item.id === monster.id ? { ...item, count: item.count + 1 } : item)),
                  );
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.laneButtonText}>Count +1</Text>
              </Pressable>
              <Pressable style={styles.laneButton} onPress={() => removeMonster(monster.id)} android_ripple={{ color: '#999' }}>
                <Text style={styles.laneButtonText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Difficulty Preview</Text>
        <Text style={styles.updateMeta}>Campaign: {selectedCampaign?.name || '—'}</Text>
        <Text style={styles.updateMeta}>Difficulty: {result.difficulty}</Text>
        <Text style={styles.updateMeta}>Adjusted XP: {result.adjustedXP}</Text>
        <Text style={styles.updateMeta}>XP per player: {result.xpPerPlayer}</Text>

        <Pressable style={styles.authButton} onPress={startInitiative} android_ripple={{ color: '#999' }}>
          <Text style={styles.authButtonText}>Start Initiative</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default DMEncounterPrep;
