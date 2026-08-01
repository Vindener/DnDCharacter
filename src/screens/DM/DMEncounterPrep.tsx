import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CommonActions } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import type { DMCampaign, DMCampaignEncounter, EncounterPrepMonsterSeed } from '@/dm/domain/types';
import { evaluateEncounterDifficulty } from '@/dm/domain/encounter';
import { rollInitiativeFor, sortByInitiative } from '@/dm/domain/initiative';
import { subscribeAccessibleCampaigns } from '@/dm/repositories/campaignRepository';
import { upsertCampaignEncounter } from '@/dm/repositories/campaignEncountersRepository';
import { startCampaignInitiative } from '@/dm/repositories/campaignInitiativeRepository';
import useCharacterStore from '@/context/Character-store';
import useMonsterStore from '@/context/Monster-store';
import useDmSettingsStore from '@/context/DmSettings-store';
import { getCharacterCampaignLabel, isCharacterInCampaign } from '@/screens/DM/adapters';
import { fbAuth } from '@/services/firebase';
import { rd, sp } from '@/shared/styles/tokens';
import { getLocalizedMonster } from '@/domain/srd/localization';
import { abilityMod } from '@/shared/helpers/combat';

type Props = StackScreenProps<DMStackParamList, 'DMEncounterPrep'>;

type EncounterMonster = {
  id: string;
  monsterId?: string;
  name: string;
  challenge: string;
  count: number;
  hitPoints?: number;
  dexMod?: number;
};

type PlayerSourceMode = 'campaign' | 'all';

const DIFFICULTY_KEYS: Record<string, string> = {
  'Немає даних': 'none',
  'Дуже легко': 'trivial',
  Легко: 'easy',
  Середньо: 'medium',
  Складно: 'hard',
  Смертельно: 'deadly',
};

const DMEncounterPrep: React.FC<Props> = ({ route, navigation }) => {
  const { i18n, t } = useTranslation(['dm', 'common']);
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const characters = useCharacterStore((s) => s.characters);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const monsters = useMonsterStore((s) => s.monsters);
  const pinnedMonsterIds = useMonsterStore((s) => s.pinnedMonsterIds);
  const loadMonsters = useMonsterStore((s) => s.loadMonsters);

  const [campaigns, setCampaigns] = useState<DMCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(route.params?.campaignId || '');
  const defaultCampaignId = useDmSettingsStore((s) => s.defaultCampaignId);
  const loadDefaultCampaignId = useDmSettingsStore((s) => s.loadDefaultCampaignId);

  useEffect(() => {
    void loadDefaultCampaignId();
  }, [loadDefaultCampaignId]);
  const [playerSourceMode, setPlayerSourceMode] = useState<PlayerSourceMode>('campaign');
  const [selectedPlayers, setSelectedPlayers] = useState<Record<string, boolean>>({});
  const [monsterSearch, setMonsterSearch] = useState('');
  const [encounterMonsters, setEncounterMonsters] = useState<EncounterMonster[]>([]);
  const [saveStatus, setSaveStatus] = useState('');
  const consumedSeedKey = useRef('');
  const consumedPlayerSeedKey = useRef('');

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
          const preferred = defaultCampaignId ? next.find((campaign) => campaign.id === defaultCampaignId) : undefined;
          setSelectedCampaignId((preferred || next[0]).id);
        }
      });
    };

    void run();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, [defaultCampaignId, selectedCampaignId]);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId],
  );

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
        next[player.id] = prev[player.id] ?? playerSourceMode === 'campaign';
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
    return list
      .filter((monster) => {
        return (
          (monster.name || '').toLowerCase().includes(text) ||
          (monster.type || '').toLowerCase().includes(text) ||
          (monster.challenge || '').toLowerCase().includes(text)
        );
      })
      .slice(0, 24);
  }, [localizedMonsters, monsterSearch, pinnedMonsters]);

  const addMonsterSeed = useCallback(
    (seed: EncounterPrepMonsterSeed) => {
      const localizedMatch = seed.monsterId ? localizedMonsters.find((monster) => monster.id === seed.monsterId) : undefined;
      const name = localizedMatch?.name || seed.name || t('encounterPrep.monsterFallback');
      const challenge = seed.challenge || '0';
      const count = Math.max(1, Number(seed.count) || 1);
      // Undefined (no SRD/homebrew match, e.g. a hand-typed monster) rolls initiative with
      // modifier 0 — there is no other DEX source available for an unmatched monster.
      const dexMod = localizedMatch ? abilityMod(localizedMatch.stats.dexterity) : undefined;

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
                  dexMod: item.dexMod ?? dexMod,
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
            dexMod,
          },
        ];
      });
    },
    [localizedMonsters, t],
  );

  useEffect(() => {
    const seeds = [route.params?.initialMonster, ...(route.params?.initialMonsters || [])].filter(Boolean) as EncounterPrepMonsterSeed[];
    const seedKey = seeds.map((seed) => `${seed.monsterId || seed.name}:${seed.challenge || '0'}:${seed.count || 1}`).join('|');
    if (!seedKey || consumedSeedKey.current === seedKey) return;
    consumedSeedKey.current = seedKey;
    seeds.forEach(addMonsterSeed);
    navigation.setParams({ initialMonster: undefined, initialMonsters: undefined });
  }, [addMonsterSeed, navigation, route.params?.initialMonster, route.params?.initialMonsters]);

  useEffect(() => {
    const ids = route.params?.initialSelectedCharacterIds;
    const seedKey = (ids || []).join('|');
    if (!seedKey || consumedPlayerSeedKey.current === seedKey) return;
    consumedPlayerSeedKey.current = seedKey;
    setSelectedPlayers((prev) => {
      const next = { ...prev };
      (ids || []).forEach((id) => {
        next[id] = true;
      });
      return next;
    });
    navigation.setParams({ initialSelectedCharacterIds: undefined });
  }, [navigation, route.params?.initialSelectedCharacterIds]);

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

  const formatSyncStatus = (status: string) => {
    if (status === 'Synced') return t('common:status.synced');
    if (status === 'Pending sync') return t('common:status.pendingSync');
    if (status === 'Offline changes pending') return t('common:status.offlineChanges');
    if (status === 'Conflict detected') return t('common:status.conflictDetected');
    if (status === 'Local only') return t('common:status.localOnly');
    return status;
  };

  const saveEncounterToCampaign = async () => {
    if (!selectedCampaignId) return;
    const me = fbAuth.currentUser?.uid || 'local';
    const timestamp = Date.now();
    const draft: DMCampaignEncounter = {
      id: `encounter-${timestamp}`,
      campaignId: selectedCampaignId,
      label: `${selectedCampaign?.name || t('encounterPrep.title')} — ${new Date(timestamp).toLocaleString()}`,
      players: selectedParty.map((player) => ({
        id: `player-${player.id}`,
        characterId: player.id,
        name: player.name || t('encounterPrep.playerFallback'),
        level: Number(player.level) || 1,
        initiativeMod: Number(player.initiative) || 0,
        selected: true,
      })),
      monsters: encounterMonsters.map((monster) => ({ ...monster, selected: true })),
      difficulty: encounterResult,
      status: 'planned',
      ownerUid: me,
      owners: me ? [me] : [],
      editors: [],
      createdAtMs: timestamp,
      updatedAtMs: timestamp,
      baseUpdatedAtMs: timestamp,
      syncStatus: fbAuth.currentUser ? 'Pending sync' : 'Local only',
    };

    const saved = await upsertCampaignEncounter(draft);
    setSaveStatus(t('encounterPrep.savedToCampaign', { status: formatSyncStatus(saved.syncStatus) }));
  };

  const startInitiative = async () => {
    if (!selectedCampaignId) return;

    const rolledPlayers = selectedParty.map((player) => {
      const mod = Number(player.initiative) || 0;
      const { total } = rollInitiativeFor(mod, player.name);
      return {
        id: `player-${player.id}`,
        name: player.name || t('encounterPrep.playerFallback'),
        source: 'player' as const,
        characterId: player.id,
        roll: total,
        initiativeMod: mod,
        hpCurrent: player.hp?.current || 0,
        hpMax: player.hp?.max,
        conditions: [],
        defeated: false,
        order: 0,
      };
    });

    const rolledMonsters = encounterMonsters.flatMap((monster) =>
      Array.from({ length: Math.max(1, monster.count) }, (_unused, index) => {
        const mod = monster.dexMod ?? 0;
        const { total } = rollInitiativeFor(mod, monster.name);
        return {
          id: `monster-${monster.id}-${index}`,
          name: monster.name || t('encounterPrep.monsterFallback'),
          source: 'monster' as const,
          monsterId: monster.monsterId,
          roll: total,
          initiativeMod: mod,
          hpCurrent: monster.hitPoints ?? 0,
          hpMax: monster.hitPoints,
          conditions: [],
          defeated: false,
          order: 0,
        };
      }),
    );

    const combatants = sortByInitiative([...rolledPlayers, ...rolledMonsters]);
    if (!combatants.length) return;

    await startCampaignInitiative(selectedCampaignId, combatants);

    const root = navigation.getParent();
    if (!root) return;
    root.dispatch(
      CommonActions.navigate({
        name: 'Initiative',
        params: { campaignId: selectedCampaignId },
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
              <Text style={styles.updateTitle}>
                {player.name || t('encounterPrep.characterFallback')} {selected ? `• ${t('encounterPrep.selected')}` : ''}
              </Text>
              <Text style={styles.updateMeta}>{t('encounterPrep.campaign', { campaign: campaignLabel })}</Text>
              <Text style={styles.updateMeta}>
                {t('encounterPrep.playerMeta', {
                  level: player.level || 1,
                  initiative: player.initiative || 0,
                  current: player.hp?.current || 0,
                  max: player.hp?.max || 0,
                })}
              </Text>
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
            <Text style={styles.updateMeta}>
              {t('encounterPrep.monsterMeta', {
                challenge: monster.challenge || '0',
                type: monster.type || t('encounterPrep.unknownType'),
              })}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('encounterPrep.encounterRoster', { count: encounterMonsters.length })}</Text>
        {!encounterMonsters.length && <Text style={styles.hint}>{t('encounterPrep.emptyRoster')}</Text>}
        {encounterMonsters.map((monster) => (
          <View key={monster.id} style={styles.updateRow}>
            <Text style={styles.updateTitle}>{monster.name}</Text>
            <Text style={styles.updateMeta}>
              {t('encounterPrep.rosterMeta', { challenge: monster.challenge, count: monster.count, hp: monster.hitPoints ?? '—' })}
            </Text>
            <View style={styles.laneGrid}>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  setEncounterMonsters((prev) =>
                    prev.map((item) => (item.id === monster.id ? { ...item, count: Math.max(1, item.count - 1) } : item)),
                  );
                }}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.laneButtonText}>{t('encounterPrep.countMinus')}</Text>
              </Pressable>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  setEncounterMonsters((prev) => prev.map((item) => (item.id === monster.id ? { ...item, count: item.count + 1 } : item)));
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

        <Pressable
          style={styles.authButton}
          onPress={() => {
            void startInitiative();
          }}
          disabled={!selectedCampaignId}
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={styles.authButtonText}>{t('encounterPrep.startInitiative')}</Text>
        </Pressable>
        <Pressable
          style={styles.authButton}
          onPress={() => {
            void saveEncounterToCampaign();
          }}
          disabled={!selectedCampaignId}
          android_ripple={{ color: colors.ripple }}
          testID='encounterPrep.saveToCampaignButton'
        >
          <Text style={styles.authButtonText}>{t('encounterPrep.saveToCampaign')}</Text>
        </Pressable>
        {!!saveStatus && <Text style={styles.hint}>{saveStatus}</Text>}
      </View>
    </ScrollView>
  );
};

export default DMEncounterPrep;
