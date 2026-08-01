import React from 'react';
import { View, Text } from 'react-native';
import type { MonsterDto } from '@/types/Monster';
import type { SpellbookSpell } from '@/types/Spellbook';
import { getLocalizedMonster, getLocalizedSpellFields } from '@/domain/srd/localization';
import type { getStyles } from './style';

type DmStyles = ReturnType<typeof getStyles>;
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

type Props = {
  pinnedMonsters: MonsterDto[];
  pinnedSpells: SpellbookSpell[];
  language: string;
  t: TranslateFn;
  styles: DmStyles;
};

export const PinnedReferencesList: React.FC<Props> = ({ pinnedMonsters, pinnedSpells, language, t, styles }) => (
  <>
    {pinnedMonsters.map((monster) => {
      const display = getLocalizedMonster(monster, language);
      return (
        <View key={`monster-${monster.id}`} style={styles.updateRow}>
          <Text style={styles.updateTitle}>{display.name}</Text>
          <Text style={styles.updateMeta}>
            {t('dm:dashboard.monsterSummary', {
              cr: display.challenge || '—',
              ac: display.armorClass ?? '—',
              hp: display.hitPoints ?? '—',
            })}
          </Text>
        </View>
      );
    })}
    {pinnedSpells.map((spell) => {
      const display = getLocalizedSpellFields(spell, language);
      return (
        <View key={`spell-${spell.id}`} style={styles.updateRow}>
          <Text style={styles.updateTitle}>{display.name}</Text>
          <Text style={styles.updateMeta}>
            {t('dm:dashboard.spellSummary', {
              level: spell.level === 0 ? t('dm:dashboard.cantrip') : spell.level,
              school: display.school,
            })}
          </Text>
        </View>
      );
    })}
    {!pinnedMonsters.length && !pinnedSpells.length ? <Text style={styles.hint}>{t('dm:dashboard.noPinnedReferences')}</Text> : null}
  </>
);
