import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import type { DMCampaign, InitiativeSeed } from '@/dm/domain/types';
import { evaluateEncounterDifficulty } from '@/dm/domain/encounter';
import { subscribeAccessibleCampaigns } from '@/dm/repositories/campaignRepository';
import useCharacterStore from '@/context/Character-store';
import useMonsterStore from '@/context/Monster-store';
import { getCharacterCampaignLabel, isCharacterInCampaign } from '@/screens/DM/adapters';

type Props = StackScreenProps<DMStackParamList, 'DMEncounterPrep'>;

type EncounterMonster = {
  id: string;
  name: string;
  challenge: string;
  count: number;
};

type PlayerSourceMode = 'campaign' | 'all';

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
  const [playerSourceMode, setPlayerSourceMode] = useState<PlayerSourceMode>('campaign');
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

  const campaignParty = useMemo(() => {
    return characters.filter((character) => isCharacterInCampaign(character, selectedCampaign));
  }, [characters, selectedCampaign]);

  const party = useMemo(() => {
    return playerSourceMode === 'campaign' ? campaignParty : characters;
  }, [campaignParty, characters, playerSourceMode]);

  const campaignNamesById = useMemo(() => {
    return new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));
  }, [campaigns]);

  const selectedParty = useMemo(() => {
    return party.filter((player) => selectedPlayers[player.id]);
  }, [party, selectedPlayers]);

  useEffect(() => {
    setSelectedPlayers((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const player of party) {
        next[player.id] = prev[player.id] ?? (playerSourceMode === 'campaign');
      }
      return next;
    });
  }, [party, playerSourceMode]);

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

  const encounterResult = useMemo(() => {
    return evaluateEncounterDifficulty(
      selectedParty.map((player) => ({ level: Number(player.level) || 1 })),
      encounterMonsters.map((monster) => ({
        challenge: String(monster.challenge || ''),
        count: Math.max(1, Number(monster.count) || 1),
      })),
    );
  }, [encounterMonsters, selectedParty]);

  const startInitiative = () => {
    const entries: InitiativeSeed['entries'] = [];

    selectedParty.forEach((player) => {
      entries.push({
        id: `player-${player.id}`,
        name: player.name || 'Гравець',
        roll: '',
        hits: String(player.hp?.current || 0),
      });
    });

    encounterMonsters.forEach((monster) => {
      for (let index = 0; index < Math.max(1, monster.count); index += 1) {
        entries.push({
          id: `monster-${monster.id}-${index}`,
          name: monster.name || 'Монстр',
          roll: '',
          hits: '',
        });
      }
    });

    const root = navigation.getParent();
    if (!root) return;
    if (!entries.length) {
      root.dispatch(
        CommonActions.navigate({
          name: 'Initiative',
        }),
      );
      return;
    }

    const seed: InitiativeSeed = {
      source: 'dm-encounter-prep',
      campaignId: selectedCampaignId || 'no-campaign',
      entries,
    };

    root.dispatch(
      CommonActions.navigate({
        name: 'Initiative',
        params: { seed },
      }),
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Підготовка сутички</Text>
        <Text style={styles.hint}>Оберіть кампанію, персонажів та монстрів, потім запустіть Ініціативу з підготовленими записами.</Text>
        <View style={styles.statsRow}>
          {campaigns.map((campaign) => (
            <Pressable
              key={campaign.id}
              style={[styles.statChip, selectedCampaignId === campaign.id ? { borderColor: colors.text } : null]}
              onPress={() => setSelectedCampaignId(campaign.id)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={styles.statChipText}>{campaign.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Персонажі ({selectedParty.length})</Text>
        <View style={styles.statsRow}>
          <Pressable
            style={[styles.statChip, playerSourceMode === 'campaign' ? { borderColor: colors.text } : null]}
            onPress={() => setPlayerSourceMode('campaign')}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={styles.statChipText}>Група кампанії</Text>
          </Pressable>
          <Pressable
            style={[styles.statChip, playerSourceMode === 'all' ? { borderColor: colors.text } : null]}
            onPress={() => setPlayerSourceMode('all')}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={styles.statChipText}>Усі персонажі</Text>
          </Pressable>
        </View>
        {!party.length && playerSourceMode === 'campaign' && <Text style={styles.hint}>До вибраної кампанії не прив’язано учасників групи.</Text>}
        {!party.length && playerSourceMode === 'all' && <Text style={styles.hint}>У списку персонажів поки порожньо.</Text>}
        {party.map((player) => {
          const selected = selectedPlayers[player.id];
          const campaignLabel = getCharacterCampaignLabel(player, campaignNamesById);
          return (
            <Pressable
              key={player.id}
              style={styles.updateRow}
              onPress={() => setSelectedPlayers((prev) => ({ ...prev, [player.id]: !prev[player.id] }))}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={styles.updateTitle}>{player.name || 'Персонаж'} {selected ? '• Обрано' : ''}</Text>
              <Text style={styles.updateMeta}>Кампанія: {campaignLabel}</Text>
              <Text style={styles.updateMeta}>Рів. {player.level || 1} • Ініц. {player.initiative || 0} • HP {player.hp?.current || 0}/{player.hp?.max || 0}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Монстри</Text>
        <TextInput
          value={monsterSearch}
          onChangeText={setMonsterSearch}
          placeholder={pinnedMonsters.length ? 'Пошук у закріпленому бестіарії' : 'Пошук у бестіарії'}
          placeholderTextColor={colors.textSecondary}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }}
        />

        {filteredMonsters.map((monster) => (
          <Pressable
            key={monster.id}
            style={styles.updateRow}
            onPress={() => addMonster(monster.name || 'Монстр', monster.challenge || '0')}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={styles.updateTitle}>{monster.name || 'Монстр'}</Text>
            <Text style={styles.updateMeta}>CR {monster.challenge || '0'} • {monster.type || 'Невідомий тип'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Склад сутички ({encounterMonsters.length})</Text>
        {!encounterMonsters.length && <Text style={styles.hint}>Додайте монстрів зі списку вище.</Text>}
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
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.laneButtonText}>К-сть -1</Text>
              </Pressable>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  setEncounterMonsters((prev) =>
                    prev.map((item) => (item.id === monster.id ? { ...item, count: item.count + 1 } : item)),
                  );
                }}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.laneButtonText}>К-сть +1</Text>
              </Pressable>
              <Pressable style={styles.laneButton} onPress={() => removeMonster(monster.id)} android_ripple={{ color: colors.ripple }}>
                <Text style={styles.laneButtonText}>Видалити</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Оцінка складності</Text>
        <Text style={styles.updateMeta}>Кампанія: {selectedCampaign?.name || '—'}</Text>
        <Text style={styles.updateMeta}>Складність: {encounterResult.difficulty}</Text>
        <Text style={styles.updateMeta}>Скоригований XP: {encounterResult.adjustedXP}</Text>
        <Text style={styles.updateMeta}>XP на гравця: {encounterResult.xpPerPlayer}</Text>

        <Pressable style={styles.authButton} onPress={startInitiative} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.authButtonText}>Почати ініціативу</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default DMEncounterPrep;

