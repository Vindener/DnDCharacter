import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CharacterActionsReadyState } from '../hooks/useCharacterActions';

type CombatSummaryCardProps = Pick<
  CharacterActionsReadyState,
  'styles' | 'characterData' | 'hpPercent' | 'proficiency' | 'passivePerception' | 'sectionConflictLabel'
>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function CombatSummaryCardBase({
  styles,
  characterData,
  hpPercent,
  proficiency,
  passivePerception,
  sectionConflictLabel,
}: CombatSummaryCardProps) {
  const { t } = useTranslation('character');
  return (
    <View style={styles.combatSummaryCard}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.summaryTitle}>{t('summary.title')}</Text>
        {sectionConflictLabel(['combat.hp', 'combat.core'])}
      </View>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryTileWide}>
          <Text style={styles.summaryLabel}>HP</Text>
          <Text style={styles.summaryValue}>
            {characterData.hp.current}/{characterData.hp.max}
          </Text>
          <Text style={styles.summarySubValue}>{t('summary.tempHp', { value: characterData.hp.temp })}</Text>
          <View style={styles.hpBarBase}>
            <View style={[styles.hpBarFill, { width: `${clamp(hpPercent, 0, 100)}%` }]} />
          </View>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>AC</Text>
          <Text style={styles.summaryValue}>{characterData.ac}</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>{t('summary.speed')}</Text>
          <Text style={styles.summaryValue}>{characterData.speed}</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>{t('summary.initiative')}</Text>
          <Text style={styles.summaryValue}>
            {characterData.initiative >= 0 ? `+${characterData.initiative}` : characterData.initiative}
          </Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>{t('summary.proficiency')}</Text>
          <Text style={styles.summaryValue}>+{proficiency}</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>{t('summary.spellDc')}</Text>
          <Text style={styles.summaryValue}>{characterData.spells.spellSaveDC || 0}</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>{t('summary.passivePerception')}</Text>
          <Text style={styles.summaryValue}>{passivePerception}</Text>
        </View>
      </View>
    </View>
  );
}

function areEqual(prev: CombatSummaryCardProps, next: CombatSummaryCardProps): boolean {
  return (
    prev.styles === next.styles &&
    prev.sectionConflictLabel === next.sectionConflictLabel &&
    prev.hpPercent === next.hpPercent &&
    prev.proficiency === next.proficiency &&
    prev.passivePerception === next.passivePerception &&
    prev.characterData.hp.current === next.characterData.hp.current &&
    prev.characterData.hp.max === next.characterData.hp.max &&
    prev.characterData.hp.temp === next.characterData.hp.temp &&
    prev.characterData.ac === next.characterData.ac &&
    prev.characterData.speed === next.characterData.speed &&
    prev.characterData.initiative === next.characterData.initiative &&
    prev.characterData.spells.spellSaveDC === next.characterData.spells.spellSaveDC
  );
}

export const CombatSummaryCard = React.memo(CombatSummaryCardBase, areEqual);
