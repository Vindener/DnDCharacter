import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { ReferencesStackParamList } from '@/navigation/ReferencesNavigator';
import { getConditions, getEquipment, getSrdReferences } from '@/domain/srd/srdRepository';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './styles';

type ReferenceEntry = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  testID: string;
  disabled?: boolean;
  onPress?: () => void;
  details?: Array<{ title: string; body: string }>;
};

type Navigation = StackNavigationProp<ReferencesStackParamList, 'ReferencesHome'>;

export default function References() {
  const { t } = useTranslation('references');
  const navigation = useNavigation<Navigation>();
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const srdEntries = getSrdReferences();
  const entries: ReferenceEntry[] = [
    {
      id: 'bestiary',
      title: t('entries.bestiary.title'),
      description: t('entries.bestiary.description'),
      icon: 'skull-outline',
      testID: 'references.openBestiaryButton',
      onPress: () => navigation.navigate('List'),
    },
    {
      id: 'spellbook',
      title: t('entries.spellbook.title'),
      description: t('entries.spellbook.description'),
      icon: 'book-outline',
      testID: 'references.openSpellbookButton',
      onPress: () => navigation.navigate('Spellbook'),
    },
    ...srdEntries.map((entry) => ({
      id: entry.id,
      title: t(`srd.${entry.id}.title`, { defaultValue: entry.title }),
      description: t(`srd.${entry.id}.summary`, { defaultValue: entry.summary }),
      icon: entry.id === 'conditions'
        ? 'pulse-outline' as const
        : entry.id === 'equipment'
          ? 'cube-outline' as const
          : entry.id === 'spellcasting-basics'
            ? 'sparkles-outline' as const
            : 'reader-outline' as const,
      testID: `references.srd.${entry.id}`,
      details: entry.id === 'conditions'
        ? getConditions().slice(0, 8).map((condition) => ({
            title: t(`srd.conditions.details.${condition.id}.title`, { defaultValue: condition.name }),
            body: t(`srd.conditions.details.${condition.id}.body`, { defaultValue: condition.summary }),
          }))
        : entry.id === 'equipment'
          ? getEquipment().slice(0, 8).map((item) => ({
              title: t(`srd.equipment.details.${item.id}.title`, { defaultValue: item.name }),
              body: t(`srd.equipment.details.${item.id}.body`, { defaultValue: item.category }),
            }))
          : entry.entries.map((detail, index) => ({
              title: t(`srd.${entry.id}.details.${index}.title`, { defaultValue: detail.title }),
              body: t(`srd.${entry.id}.details.${index}.body`, { defaultValue: detail.body }),
            })),
    })),
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID='references.screen'>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>{t('title')}</Text>
        <Text style={styles.hint}>{t('hint')}</Text>
      </View>

      <View style={styles.grid}>
        {entries.map((entry) => (
          <Pressable
            key={entry.id}
            style={[styles.card, entry.disabled ? styles.cardDisabled : null]}
            onPress={entry.onPress}
            disabled={entry.disabled}
            android_ripple={{ color: colors.ripple }}
            testID={entry.testID}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name={entry.icon} size={20} color={colors.text} />
              </View>
              {entry.disabled ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t('soon')}</Text>
                </View>
              ) : entry.onPress ? (
                <Ionicons name='chevron-forward-outline' size={18} color={colors.textSecondary} />
              ) : null}
            </View>
            <Text style={styles.cardTitle}>{entry.title}</Text>
            <Text style={styles.cardDescription}>{entry.description}</Text>
            {entry.details?.slice(0, 3).map((detail) => (
              <Text key={`${entry.id}-${detail.title}`} style={styles.detailText}>
                {detail.title}: {detail.body}
              </Text>
            ))}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
