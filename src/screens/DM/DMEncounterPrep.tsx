import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CommonActions } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import type { DMCampaign, EncounterPrepMonsterSeed, InitiativeSeed } from '@/dm/domain/types';
import { evaluateEncounterDifficulty } from '@/dm/domain/encounter';
import { subscribeAccessibleCampaigns } from '@/dm/repositories/campaignRepository';
import useCharacterStore from '@/context/Character-store';
import useMonsterStore from '@/context/Monster-store';
import { getCharacterCampaignLabel, isCharacterInCampaign } from '@/screens/DM/adapters';
import { rd, sp } from '@/shared/styles/tokens';
import { getLocalizedMonster } from '@/domain/srd/localization';

type Props = StackScreenProps<DMStackParamList, 'DMEncounterPrep'>;

type EncounterMonster = {
  id: string;
  monsterId?: string;
  name: string;
  challenge: string;
  count: number;
  hitPoints?: number;
};

type PlayerSourceMode = 'campaign' | 'all';

const DIFFICULTY_KEYS: Record<string, string> = {
  'Немає даних': 'none',
  'Дуже легко': 'trivial',
  'Легко': 'easy',
  'Середньо': 'medium',
  'Складно': 'hard',
  'Смертельно': 'deadly',
};

const DMEncounterPrep: React.FC<Props> = ({ route, navigation }) => {
  const { i18n, t } = useTranslation('dm');
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
  const consumedSeedKey = useRef('');

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

  const localizedMonsters = useMemo(
    () => monsters.map((monster) => getLocalizedMonster(monster, i18n.language)),
    [i18n.language, monsters],
  );
  const pinnedMonsters = useMemo(
    () => localizedMonsters.filter((monster) => pinnedMonsterIds.includes(monster.id)),
    [localizedMonsters, pinnedMonsterIds],
  );

  const filteredMonsters = useMemo(() => {
    const text = monsterSearch.trim().toLowerCase();
    const list = pinnedMonsters.length ? pinnedMonsters : localizedMonsters;
    if (!text) return list.slice(0, 24);
    return list.filter((monster) => {
      return (
        (monster.name || '').toLowerCase().includes(text) ||
        (monster.type || '').toLowerCase().includes(text) ||
        (monster.challenge || '').toLowerCase().includes(text)
      );
    }).slice(0, 24);
  }, [localizedMonsters, monsterSearch, pinnedMonsters]);

  const addMonsterSeed = useCallback((seed: EncounterPrepMonsterSeed) => {
    const localizedMatch = seed.monsterId ? localizedMonsters.find((monster) => monster.id === seed.monsterId) : undefined;
    const name = localizedMatch?.name || seed.name || t('encounterPrep.monsterFallback');
    const challenge = seed.challenge || '0';
    const count = Math.max(1, Number(seed.count) || 1);

    setEncounterMonsters((prev) => {
      const existing = prev.find((item) =>
        seed.monsterId ? item.monsterId === seed.monsterId : item.name === name && item.challenge === challenge,
      );
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                count: item.count + count,
                hitPoints: item.hitPoints ?? seed.hitPoints,
              }
            : item,
        );
      }

      return [
        ...prev,
        {
          id: `${seed.monsterId || name}-${challenge}-${Date.now()}`,
          monsterId: seed.monsterId,
          name,
          challenge,
          count,
          hitPoints: seed.hitPoints,
        },
      ];
    });
  }, [localizedMonsters, t]);

  useEffect(() => {
    const seeds = [route.params?.initialMonster, ...(route.params?.initialMonsters || [])].filter(Boolean) as EncounterPrepMonsterSeed[];
    const seedKey = seeds.map((seed) => `${seed.monsterId || seed.name}:${seed.challenge || '0'}:${seed.count || 1}`).join('|');
    if (!seedKey || consumedSeedKey.current === seedKey) return;
    consumedSeedKey.current = seedKey;
    seeds.forEach(addMonsterSeed);
    navigation.setParams({ initialMonster: undefined, initialMonsters: undefined });
  }, [addMonsterSeed, navigation, route.params?.initialMonster, route.params?.initialMonsters]);

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
  const difficultyLabel = t(`encounterPrep.difficulties.${DIFFICULTY_KEYS[encounterResult.difficulty] || 'none'}`);

  const startInitiative = () => {
    const entries: InitiativeSeed['entries'] = [];

    selectedParty.forEach((player) => {
      entries.push({
        id: `player-${player.id}`,
        name: player.name || t('encounterPrep.playerFallback'),
        roll: '',
        hits: String(player.hp?.current || 0),
      });
    });

    encounterMonsters.forEach((monster) => {
      for (let index = 0; index < Math.max(1, monster.count); index += 1) {
        entries.push({
          id: `monster-${monster.id}-${index}`,
          name: monster.name || t('encounterPrep.monsterFallback'),
          roll: '',
          hits: monster.hitPoints ? String(monster.hitPoints) : '',
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
        <Text style={styles.title}>{t('encounterPrep.title')}</Text>
        <Text style={styles.hint}>{t('encounterPrep.hint')}</Text>
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
        <Text style={styles.title}>{t('encounterPrep.characters', { count: selectedParty.length })}</Text>
        <View style={styles.statsRow}>
          <Pressable
            style={[styles.statChip, playerSourceMode === 'campaign' ? { borderColor: colors.text } : null]}
            onPress={() => setPlayerSourceMode('campaign')}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={styles.statChipText}>{t('encounterPrep.campaignParty')}</Text>
          </Pressable>
          <Pressable
            style={[styles.statChip, playerSourceMode === 'all' ? { borderColor: colors.text } : null]}
            onPress={() => setPlayerSourceMode('all')}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={styles.statChipText}>{t('encounterPrep.allCharacters')}</Text>
          </Pressable>
        </View>
        {!party.length && playerSourceMode === 'campaign' && <Text style={styles.hint}>{t('encounterPrep.emptyCampaignParty')}</Text>}
        {!party.length && playerSourceMode === 'all' && <Text style={styles.hint}>{t('encounterPrep.emptyAllCharacters')}</Text>}
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
              <Text style={styles.updateTitle}>{player.name || t('encounterPrep.characterFallback')} {selected ? `• ${t('encounterPrep.selected')}` : ''}</Text>
              <Text style={styles.updateMeta}>{t('encounterPrep.campaign', { campaign: campaignLabel })}</Text>
            <Text style={styles.updateMeta}>{t('encounterPrep.playerMeta', { level: player.level || 1, initiative: player.initiative || 0, current: player.hp?.current || 0, max: player.hp?.max || 0 })}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('encounterPrep.monsters')}</Text>
        <TextInput
          value={monsterSearch}
          onChangeText={setMonsterSearch}
          placeholder={pinnedMonsters.length ? t('encounterPrep.searchPinned') : t('encounterPrep.searchBestiary')}
          placeholderTextColor={colors.textSecondary}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: rd(8), padding: sp(10), color: colors.text }}
        />

        {filteredMonsters.map((monster) => (
          <Pressable
            key={monster.id}
            style={styles.updateRow}
            onPress={() =>
              addMonsterSeed({
                monsterId: monster.id,
                name: monster.name || t('encounterPrep.monsterFallback'),
                challenge: monster.challenge || '0',
                count: 1,
                hitPoints: monster.hitPoints,
              })
            }
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={styles.updateTitle}>{monster.name || t('encounterPrep.monsterFallback')}</Text>
            <Text style={styles.updateMeta}>{t('encounterPrep.monsterMeta', { challenge: monster.challenge || '0', type: monster.type || t('encounterPrep.unknownType') })}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('encounterPrep.encounterRoster', { count: encounterMonsters.length })}</Text>
        {!encounterMonsters.length && <Text style={styles.hint}>{t('encounterPrep.emptyRoster')}</Text>}
        {encounterMonsters.map((monster) => (
          <View key={monster.id} style={styles.updateRow}>
            <Text style={styles.updateTitle}>{monster.name}</Text>
            <Text style={styles.updateMeta}>{t('encounterPrep.rosterMeta', { challenge: monster.challenge, count: monster.count, hp: monster.hitPoints ?? '—' })}</Text>
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
                <Text style={styles.laneButtonText}>{t('encounterPrep.countMinus')}</Text>
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
                <Text style={styles.laneButtonText}>{t('encounterPrep.countPlus')}</Text>
              </Pressable>
              <Pressable style={styles.laneButton} onPress={() => removeMonster(monster.id)} android_ripple={{ color: colors.ripple }}>
                <Text style={styles.laneButtonText}>{t('encounterPrep.delete')}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('encounterPrep.difficultyTitle')}</Text>
        <Text style={styles.updateMeta}>{t('encounterPrep.campaign', { campaign: selectedCampaign?.name || '—' })}</Text>
        <Text style={styles.updateMeta}>{t('encounterPrep.difficulty', { difficulty: difficultyLabel })}</Text>
        <Text style={styles.updateMeta}>{t('encounterPrep.adjustedXp', { xp: encounterResult.adjustedXP })}</Text>
        <Text style={styles.updateMeta}>{t('encounterPrep.xpPerPlayer', { xp: encounterResult.xpPerPlayer })}</Text>

        <Pressable style={styles.authButton} onPress={startInitiative} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.authButtonText}>{t('encounterPrep.startInitiative')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default DMEncounterPrep;
