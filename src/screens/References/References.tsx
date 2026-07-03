import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { ReferencesStackParamList } from '@/navigation/ReferencesNavigator';
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
};

type Navigation = StackNavigationProp<ReferencesStackParamList, 'ReferencesHome'>;

export default function References() {
  const { t } = useTranslation('references');
  const navigation = useNavigation<Navigation>();
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

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
    {
      id: 'items',
      title: t('entries.items.title'),
      description: t('entries.items.description'),
      icon: 'cube-outline',
      testID: 'references.placeholder.items',
      disabled: true,
    },
    {
      id: 'conditions',
      title: t('entries.conditions.title'),
      description: t('entries.conditions.description'),
      icon: 'pulse-outline',
      testID: 'references.placeholder.conditions',
      disabled: true,
    },
    {
      id: 'rules',
      title: t('entries.rules.title'),
      description: t('entries.rules.description'),
      icon: 'reader-outline',
      testID: 'references.placeholder.rules',
      disabled: true,
    },
    {
      id: 'classes',
      title: t('entries.classes.title'),
      description: t('entries.classes.description'),
      icon: 'people-outline',
      testID: 'references.placeholder.classes',
      disabled: true,
    },
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
              ) : (
                <Ionicons name='chevron-forward-outline' size={18} color={colors.textSecondary} />
              )}
            </View>
            <Text style={styles.cardTitle}>{entry.title}</Text>
            <Text style={styles.cardDescription}>{entry.description}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
