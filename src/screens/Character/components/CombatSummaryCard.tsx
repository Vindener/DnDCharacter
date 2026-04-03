import React from 'react';
import { View, Text } from 'react-native';

type CombatSummaryCardProps = {
  styles: any;
  characterData: any;
  hpPercent: number;
  proficiency: number;
  passivePerception: number;
  sectionConflictLabel: (prefixes: string[]) => React.ReactNode;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function CombatSummaryCard({
  styles,
  characterData,
  hpPercent,
  proficiency,
  passivePerception,
  sectionConflictLabel,
}: CombatSummaryCardProps) {
  return (
    <View style={styles.combatSummaryCard}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.summaryTitle}>Бойовий підсумок</Text>
        {sectionConflictLabel(['combat.hp', 'combat.core'])}
      </View>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryTileWide}>
          <Text style={styles.summaryLabel}>HP</Text>
          <Text style={styles.summaryValue}>
            {characterData.hp.current}/{characterData.hp.max}
          </Text>
          <Text style={styles.summarySubValue}>Тимч. {characterData.hp.temp}</Text>
          <View style={styles.hpBarBase}>
            <View style={[styles.hpBarFill, { width: `${clamp(hpPercent, 0, 100)}%` }]} />
          </View>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>AC</Text>
          <Text style={styles.summaryValue}>{characterData.ac}</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>Швидк.</Text>
          <Text style={styles.summaryValue}>{characterData.speed}</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>Ініц.</Text>
          <Text style={styles.summaryValue}>{characterData.initiative >= 0 ? `+${characterData.initiative}` : characterData.initiative}</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>Майст.</Text>
          <Text style={styles.summaryValue}>+{proficiency}</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>DC заклять</Text>
          <Text style={styles.summaryValue}>{characterData.spells.spellSaveDC || 0}</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>Пасивне сприйняття</Text>
          <Text style={styles.summaryValue}>{passivePerception}</Text>
        </View>
      </View>
    </View>
  );
}
