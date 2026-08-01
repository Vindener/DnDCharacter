import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useThemeStore from '@/context/Theme-store';
import TextInput from '@/shared/components/TextInput/TextInput';
import { getStyles as getInitiativeStyles } from './style';
import { getStyles as getDmStyles } from '@/screens/DM/style';
import { fs, sp } from '@/shared/styles/tokens';
import type { DMCampaign, InitiativeCombatant, InitiativeTracker } from '@/dm/domain/types';
import {
  endCampaignInitiative,
  subscribeCampaignInitiative,
  updateCampaignInitiative,
} from '@/dm/repositories/campaignInitiativeRepository';

type Props = {
  campaignId: string;
  campaign: DMCampaign | null;
  isOwner: boolean;
};

const CampaignInitiativeBoard: React.FC<Props> = ({ campaignId, campaign, isOwner }) => {
  const { t } = useTranslation('initiative');
  const colors = useThemeStore((s) => s.colors);
  const styles = getInitiativeStyles(colors);
  const dmStyles = getDmStyles(colors);

  const [tracker, setTracker] = useState<InitiativeTracker | null>(null);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;

    const run = async () => {
      unsub = await subscribeCampaignInitiative(campaignId, (next) => {
        if (!cancelled) setTracker(next);
      });
    };

    void run();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, [campaignId]);

  const combatants = tracker ? [...tracker.combatants].sort((a, b) => a.order - b.order) : [];

  // Applies the patch to local state immediately (the GM is the only writer, so there's no
  // concurrent-edit risk) instead of waiting on the Firestore round-trip — otherwise every
  // action (next turn, reorder, HP, defeated, remove) appears to silently do nothing until
  // the onSnapshot echo arrives, which can be slow or, if the write is ever rejected, never.
  const commitCombatants = useCallback(
    (next: InitiativeCombatant[]) => {
      setTracker((prev) => (prev ? { ...prev, combatants: next } : prev));
      void updateCampaignInitiative(campaignId, { combatants: next });
    },
    [campaignId],
  );

  const updateCombatant = useCallback((id: string, patch: Partial<InitiativeCombatant>) => {
    setTracker((prev) => (prev ? { ...prev, combatants: prev.combatants.map((c) => (c.id === id ? { ...c, ...patch } : c)) } : prev));
  }, []);

  const commitCombatant = useCallback(
    (id: string, patch: Partial<InitiativeCombatant>) => {
      if (!tracker) return;
      const next = tracker.combatants.map((c) => (c.id === id ? { ...c, ...patch } : c));
      commitCombatants(next);
    },
    [commitCombatants, tracker],
  );

  const toggleDefeated = useCallback(
    (combatant: InitiativeCombatant) => {
      commitCombatant(combatant.id, { defeated: !combatant.defeated });
    },
    [commitCombatant],
  );

  const removeCombatant = useCallback(
    (id: string) => {
      if (!tracker) return;
      commitCombatants(tracker.combatants.filter((c) => c.id !== id));
    },
    [commitCombatants, tracker],
  );

  const onDragEnd = (data: InitiativeCombatant[]) => {
    const reordered = data.map((combatant, index) => ({ ...combatant, order: index }));
    commitCombatants(reordered);
  };

  const advanceTurn = () => {
    if (!tracker || !combatants.length) return;
    const currentIndex = Math.max(
      0,
      combatants.findIndex((c) => c.id === tracker.activeCombatantId),
    );
    const nextIndex = (currentIndex + 1) % combatants.length;
    const wrapped = nextIndex === 0;
    const patch = { activeCombatantId: combatants[nextIndex].id, round: wrapped ? tracker.round + 1 : tracker.round };
    setTracker((prev) => (prev ? { ...prev, ...patch } : prev));
    void updateCampaignInitiative(campaignId, patch);
  };

  const endCombat = () => {
    setTracker(null);
    void endCampaignInitiative(campaignId);
  };

  const keyExtractor = useCallback((item: InitiativeCombatant) => item.id, []);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<InitiativeCombatant>) => {
      const isCurrentTurn = tracker?.activeCombatantId === item.id;
      const draggingStyle = isActive
        ? { shadowColor: colors.overlayStrong, shadowOpacity: 0.2, shadowRadius: 5, transform: [{ scale: 1.01 }] }
        : null;

      return (
        <View
          style={[
            styles.row,
            { height: undefined, paddingVertical: sp(6) },
            item.defeated ? styles.rowDefeated : null,
            isCurrentTurn ? { borderLeftWidth: 3, borderLeftColor: colors.brand, paddingLeft: 6 } : null,
            draggingStyle,
          ]}
        >
          <TouchableOpacity
            activeOpacity={isOwner ? 0.6 : 1}
            onLongPress={isOwner ? drag : undefined}
            delayLongPress={150}
            style={styles.rowContent}
            disabled={!isOwner}
          >
            <Text style={styles.order}>{item.order + 1}.</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text }}>{item.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>
                {t('campaign.rollLine', { roll: item.roll, mod: item.initiativeMod })}
              </Text>
            </View>

            {isOwner ? (
              <TextInput
                style={styles.inputHits}
                editable={!item.defeated}
                value={String(item.hpCurrent)}
                keyboardType='number-pad'
                onChangeText={(value) => updateCombatant(item.id, { hpCurrent: Number(value.replace(/[^\d]/g, '')) || 0 })}
                onEndEditing={() => commitCombatant(item.id, { hpCurrent: item.hpCurrent })}
              />
            ) : (
              <Text style={{ color: colors.text, width: 70, textAlign: 'center' }}>{item.hpCurrent}</Text>
            )}

            {isOwner && (
              <View style={styles.moveButtons}>
                <Ionicons name='reorder-three-outline' size={24} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>

          {isOwner && (
            <>
              <TouchableOpacity
                onPress={() => toggleDefeated(item)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                style={styles.defeatedButton}
                disabled={isActive}
                accessibilityLabel={item.defeated ? t('actions.returnToFight') : t('actions.markDefeated')}
              >
                <Ionicons
                  name={item.defeated ? 'refresh-circle-outline' : 'skull-outline'}
                  size={22}
                  color={item.defeated ? colors.success : colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => removeCombatant(item.id)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                style={styles.deleteButton}
                disabled={isActive}
                accessibilityLabel={t('campaign.remove')}
              >
                <Ionicons name='trash-outline' size={22} color={colors.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      );
    },
    [colors, commitCombatant, isOwner, removeCombatant, styles, t, toggleDefeated, tracker?.activeCombatantId, updateCombatant],
  );

  if (!tracker) {
    return (
      <View style={dmStyles.container}>
        <View style={dmStyles.card}>
          <Text style={dmStyles.title}>{campaign?.name || t('campaign.title')}</Text>
          <Text style={dmStyles.hint}>{t('campaign.empty')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={dmStyles.card}>
        <Text style={dmStyles.title}>{campaign?.name || t('campaign.title')}</Text>
        <Text style={dmStyles.hint}>{t('campaign.round', { round: tracker.round })}</Text>
        {!isOwner && <Text style={dmStyles.hint}>{t('campaign.readOnlyHint')}</Text>}
        {isOwner && (
          <View style={dmStyles.laneGrid}>
            <TouchableOpacity style={dmStyles.laneButton} onPress={advanceTurn}>
              <Ionicons name='play-skip-forward-outline' size={18} color={colors.text} />
              <Text style={dmStyles.laneButtonText}>{t('campaign.nextTurn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dmStyles.laneButton} onPress={endCombat}>
              <Ionicons name='stop-circle-outline' size={18} color={colors.text} />
              <Text style={dmStyles.laneButtonText}>{t('campaign.endCombat')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {combatants.length ? (
        <DraggableFlatList
          data={combatants}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onDragEnd={({ data }) => onDragEnd(data)}
          keyboardShouldPersistTaps='handled'
          contentContainerStyle={{ padding: sp(16), paddingBottom: sp(96) }}
        />
      ) : (
        <View style={dmStyles.card}>
          <Text style={dmStyles.hint}>{t('campaign.emptyCombatants')}</Text>
        </View>
      )}
    </View>
  );
};

export default CampaignInitiativeBoard;
