import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, Button, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, RouteProp, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './style';
import { MonsterDto } from '@/types/Monster';
import useMonsterStore from '@/context/Monster-store';
import TextInput from '@/shared/components/TextInput/TextInput';
import FileService from '@/shared/services/fileSerice';
import type { ReferencesStackParamList } from '@/navigation/ReferencesNavigator';
import { sp } from '@/shared/styles/tokens';
import { isBuiltInRulesSource, shouldDisplaySourceMetadata } from '@/shared/helpers/sourcePresentation';
import { getLocalizedMonster } from '@/domain/srd/localization';

type MonsterRouteProp = RouteProp<ReferencesStackParamList, 'Monster'>;
type MonsterTextField =
  | 'type'
  | 'size'
  | 'alignment'
  | 'challenge'
  | 'environment'
  | 'source'
  | 'mainAttack'
  | 'attackBonus'
  | 'damage'
  | 'speed'
  | 'savingThrows'
  | 'skills'
  | 'senses'
  | 'languages'
  | 'traits'
  | 'actions'
  | 'reactions'
  | 'legendaryActions'
  | 'notes';
type MonsterNumberField = 'armorClass' | 'hitPoints';

interface Props {
  route: MonsterRouteProp;
}

const COLLAPSE_LIMIT = 220;

const previewText = (value?: string): string => {
  if (!value) return '—';
  if (value.length <= COLLAPSE_LIMIT) return value;
  return `${value.slice(0, COLLAPSE_LIMIT).trim()}...`;
};

const createMonsterSeed = (monster: MonsterDto, monsterFallback: string) => ({
  monsterId: monster.id,
  name: monster.name || monsterFallback,
  challenge: monster.challenge || '0',
  count: 1,
  hitPoints: monster.hitPoints,
});

const createDuplicateMonster = (monster: MonsterDto, monsterFallback: string, copyLabel: string): MonsterDto => ({
  ...monster,
  id: `${monster.id}-copy-${Date.now()}`,
  name: `${monster.name || monsterFallback} ${copyLabel}`,
  source: 'user-custom',
  license: 'custom',
  isCustom: true,
});

const getMetaLine = (monster: MonsterDto): string =>
  [monster.size, monster.type, monster.alignment].filter(Boolean).join(' · ') || '—';

const getMainAttack = (monster: MonsterDto, fallback: string): string => {
  if (monster.mainAttack) return monster.mainAttack;
  if (monster.normalizedActions?.[0]?.name) return monster.normalizedActions[0].name;
  const match = (monster.actions || '').match(/(?:\*\*)?([^.*\n]+)\./);
  return match?.[1]?.trim() || fallback;
};

const getSourceLabel = (monster: MonsterDto, t: (key: string) => string): string | null => {
  if (!shouldDisplaySourceMetadata(monster.source)) return null;
  if (monster.source === 'user-custom') return t('sources.userCustom');
  if (monster.source === 'homebrew') return t('sources.homebrew');
  if (monster.source === 'imported') return t('sources.imported');
  return monster.source || t('sources.unknown');
};

const getLicenseLabel = (monster: MonsterDto, t: (key: string) => string): string | null => {
  if (monster.license === 'ogl-1.0a') return null;
  if (monster.license === 'custom') return t('licenses.custom');
  return t('licenses.unknown');
};

const CollapsibleTextBlock = ({
  title,
  value,
  emptyText,
  expanded,
  onToggle,
  style,
  rippleColor,
  showLessLabel,
  showMoreLabel,
  testID,
}: {
  title: string;
  value?: string;
  emptyText?: string;
  expanded: boolean;
  onToggle: () => void;
  style: ReturnType<typeof getStyles>;
  rippleColor: string;
  showLessLabel: string;
  showMoreLabel: string;
  testID?: string;
}) => {
  const content = value?.trim() || emptyText || '—';
  const text = expanded ? content : previewText(content);
  const canToggle = content.length > COLLAPSE_LIMIT;

  return (
    <View style={style.collapsibleBlock} testID={testID}>
      <Text style={style.sectionTitle}>{title}</Text>
      <Text style={style.value}>{text}</Text>
      {canToggle && (
        <Pressable style={style.collapseButton} onPress={onToggle} android_ripple={{ color: rippleColor }}>
          <Text style={style.collapseButtonText}>{expanded ? showLessLabel : showMoreLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default function Monster({ route }: Props) {
  const { monster } = route.params;
  const { i18n, t } = useTranslation('bestiary');
  const navigation = useNavigation<StackNavigationProp<ReferencesStackParamList, 'Monster'>>();
  const updateMonster = useMonsterStore((s) => s.updateMonster);
  const addMonster = useMonsterStore((s) => s.addMonster);
  const pinnedMonsterIds = useMonsterStore((s) => s.pinnedMonsterIds);
  const favoriteMonsterIds = useMonsterStore((s) => s.favoriteMonsterIds);
  const togglePinnedMonster = useMonsterStore((s) => s.togglePinnedMonster);
  const toggleFavoriteMonster = useMonsterStore((s) => s.toggleFavoriteMonster);
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [data, setData] = useState<MonsterDto>(() => getLocalizedMonster(monster, i18n.language));
  const [editing, setEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const isPinned = pinnedMonsterIds.includes(data.id);
  const isFavorite = favoriteMonsterIds.includes(data.id);
  const canEditMonster = !isBuiltInRulesSource(data.source);
  const sourceLabel = getSourceLabel(data, t);
  const licenseLabel = getLicenseLabel(data, t);

  useEffect(() => {
    if (isBuiltInRulesSource(monster.source)) {
      setData(getLocalizedMonster(monster, i18n.language));
    }
  }, [i18n.language, monster]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setData((prev) => ({ ...prev, photoUri: uri }));
      }
    } catch (_error) { /* intentionally ignored */ }
  };

  const removePhoto = () => {
    setData((prev) => ({ ...prev, photoUri: undefined }));
  };

  const handleSave = () => {
    if (!canEditMonster) {
      setEditing(false);
      return;
    }
    void updateMonster(data.id, data);
    setEditing(false);
  };

  const duplicateCurrent = () => {
    void addMonster(createDuplicateMonster(data, t('defaults.monster'), t('defaults.copy')));
  };

  const addToEncounter = () => {
    navigation.getParent()?.dispatch(
      CommonActions.navigate({
        name: 'DM',
        params: {
          screen: 'DMEncounterPrep',
            params: {
            initialMonster: createMonsterSeed(data, t('defaults.monster')),
          },
        },
      }),
    );
  };

  const setTextField = (field: MonsterTextField, text: string) => {
    setData((prev) => ({ ...prev, [field]: text }));
  };

  const setNumberField = (field: MonsterNumberField, text: string) => {
    const value = Number.parseInt(text, 10);
    setData((prev) => ({ ...prev, [field]: Number.isNaN(value) ? undefined : value }));
  };

  const renderTextField = (label: string, field: MonsterTextField, placeholder = label) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={String(data[field] || '')}
        onChangeText={(text) => setTextField(field, text)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
      />
    </>
  );

  const renderStatInput = (key: keyof MonsterDto['stats']) => (
    <TextInput
      unstyled
      style={styles.statInput}
      value={String(data.stats[key])}
      onChangeText={(text) => {
        const val = Number.parseInt(text, 10);
        setData((prev) => ({
          ...prev,
          stats: { ...prev.stats, [key]: Number.isNaN(val) ? 0 : val },
        }));
      }}
      keyboardType='numeric'
    />
  );

  const Stat = ({ label, stat }: { label: string; stat: keyof MonsterDto['stats'] }) => (
    <View style={styles.statBox}>
      <Text style={styles.statName}>{label}</Text>
      {editing ? renderStatInput(stat) : <Text style={styles.statValue}>{data.stats[stat]}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps='handled'>
      {data.photoUri ? <Image source={{ uri: data.photoUri }} style={styles.photo} /> : <View style={styles.placeholderPhoto} />}
      {editing && (
        <View style={styles.photoButtonsRow}>
          <Button title={t('detail.actions.uploadPhoto')} onPress={pickPhoto} />
          {data.photoUri && (
            <>
              <View style={{ width: 8 }} />
              <Button title={t('detail.actions.removePhoto')} onPress={removePhoto} />
            </>
          )}
        </View>
      )}

      <View style={styles.headerRow}>
        {editing ? (
          <TextInput style={[styles.name, styles.nameInput]} value={data.name} onChangeText={(text) => setData((prev) => ({ ...prev, name: text }))} />
        ) : (
          <View style={styles.headerTextBlock}>
            <Text style={styles.name}>{data.name}</Text>
            <Text style={styles.meta}>{getMetaLine(data)}</Text>
          </View>
        )}
        {canEditMonster ? (
          <Pressable style={styles.iconButton} onPress={editing ? handleSave : () => setEditing(true)} android_ripple={{ color: colors.ripple }}>
            <Ionicons name={editing ? 'checkmark' : 'pencil'} size={22} color={colors.text} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={addToEncounter} android_ripple={{ color: colors.ripple }} testID='monster.addToEncounterButton'>
          <Ionicons name='add-circle-outline' size={16} color={colors.text} />
          <Text style={styles.actionText}>{t('actions.addToEncounterShort')}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => void togglePinnedMonster(data.id)} android_ripple={{ color: colors.ripple }}>
          <Ionicons name={isPinned ? 'bookmark' : 'bookmark-outline'} size={16} color={colors.text} />
          <Text style={styles.actionText}>{isPinned ? t('detail.actions.unpin') : t('actions.pin')}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => void toggleFavoriteMonster(data.id)} android_ripple={{ color: colors.ripple }}>
          <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={16} color={colors.text} />
          <Text style={styles.actionText}>{isFavorite ? t('detail.actions.removeFavorite') : t('detail.actions.addFavorite')}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={duplicateCurrent} android_ripple={{ color: colors.ripple }}>
          <Ionicons name='copy-outline' size={16} color={colors.text} />
          <Text style={styles.actionText}>{t('detail.actions.duplicate')}</Text>
        </Pressable>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCell}>
          <Text style={styles.statName}>{t('labels.armorClassShort')}</Text>
          <Text style={styles.summaryValue}>{data.armorClass ?? '—'}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.statName}>{t('labels.hitPointsShort')}</Text>
          <Text style={styles.summaryValue}>{data.hitPoints ?? '—'}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.statName}>{t('labels.speedShort')}</Text>
          <Text style={styles.summaryValue}>{data.speed || '—'}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.statName}>{t('labels.challengeShort')}</Text>
          <Text style={styles.summaryValue}>{data.challenge || '—'}</Text>
        </View>
      </View>

      <View style={styles.quickBlock}>
        <Text style={styles.sectionTitle}>{t('quick.title')}</Text>
        <Text style={styles.value}>
          {getMainAttack(data, '—')}
          {data.attackBonus ? ` · ${t('labels.attackBonus', { value: data.attackBonus })}` : ''}
          {data.damage ? ` · ${t('detail.labels.damageValue', { value: data.damage })}` : ''}
        </Text>
      </View>

      {editing ? (
        <>
          {renderTextField(t('detail.fields.type'), 'type')}
          {renderTextField(t('detail.fields.size'), 'size')}
          {renderTextField(t('detail.fields.alignment'), 'alignment')}
          {renderTextField(t('detail.fields.challenge'), 'challenge')}
          {renderTextField(t('detail.fields.environment'), 'environment')}
          {renderTextField(t('detail.fields.source'), 'source')}
          {renderTextField(t('detail.fields.mainAttack'), 'mainAttack')}
          {renderTextField(t('detail.fields.attackBonus'), 'attackBonus', '+4')}
          {renderTextField(t('detail.fields.damage'), 'damage', '1d6+2')}
          <Text style={styles.label}>{t('detail.fields.armorClass')}</Text>
          <TextInput
            style={styles.input}
            value={typeof data.armorClass === 'number' ? String(data.armorClass) : ''}
            onChangeText={(text) => setNumberField('armorClass', text)}
            keyboardType='numeric'
          />
          <Text style={styles.label}>{t('labels.hitPointsShort')}</Text>
          <TextInput
            style={styles.input}
            value={typeof data.hitPoints === 'number' ? String(data.hitPoints) : ''}
            onChangeText={(text) => setNumberField('hitPoints', text)}
            keyboardType='numeric'
          />
          {renderTextField(t('detail.fields.speed'), 'speed')}
          {renderTextField(t('detail.fields.savingThrows'), 'savingThrows')}
          {renderTextField(t('detail.fields.skills'), 'skills')}
          {renderTextField(t('detail.fields.senses'), 'senses')}
          {renderTextField(t('detail.fields.languages'), 'languages')}
          <Text style={styles.label}>{t('detail.fields.tags')}</Text>
          <TextInput
            style={styles.input}
            value={(data.tags || []).join(', ')}
            onChangeText={(text) =>
              setData((prev) => ({
                ...prev,
                tags: text
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              }))
            }
            placeholder={t('detail.placeholders.tags')}
            placeholderTextColor={colors.textSecondary}
          />
        </>
      ) : (
        <View style={styles.metadataGrid}>
          <Text style={styles.metadataText}>{t('detail.fields.savingThrows')}: {data.savingThrows || '—'}</Text>
          <Text style={styles.metadataText}>{t('detail.fields.skills')}: {data.skills || '—'}</Text>
          <Text style={styles.metadataText}>{t('detail.fields.senses')}: {data.senses || '—'}</Text>
          <Text style={styles.metadataText}>{t('detail.fields.languages')}: {data.languages || '—'}</Text>
          <Text style={styles.metadataText}>{t('detail.fields.hitDice')}: {data.hitDice || '—'}</Text>
          <Text style={styles.metadataText}>{t('detail.fields.xp')}: {data.xp ?? '—'}</Text>
          <Text style={styles.metadataText}>{t('detail.fields.damageVulnerabilities')}: {data.damageVulnerabilities || '—'}</Text>
          <Text style={styles.metadataText}>{t('detail.fields.damageResistances')}: {data.damageResistances || '—'}</Text>
          <Text style={styles.metadataText}>{t('detail.fields.damageImmunities')}: {data.damageImmunities || '—'}</Text>
          <Text style={styles.metadataText}>{t('detail.fields.conditionImmunities')}: {data.conditionImmunities || '—'}</Text>
          {sourceLabel ? (
            <Text style={styles.metadataText}>
              {t('detail.fields.source')}: {sourceLabel}
              {licenseLabel ? ` · ${t('detail.fields.license')}: ${licenseLabel}` : ''}
            </Text>
          ) : null}
          <Text style={styles.metadataText}>{t('detail.fields.environment')}: {data.environment || '—'}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t('detail.sections.abilities')}</Text>
      <View style={styles.statRow}>
        <Stat label={t('detail.abilities.strength')} stat='strength' />
        <Stat label={t('detail.abilities.dexterity')} stat='dexterity' />
        <Stat label={t('detail.abilities.constitution')} stat='constitution' />
      </View>
      <View style={styles.statRow}>
        <Stat label={t('detail.abilities.intelligence')} stat='intelligence' />
        <Stat label={t('detail.abilities.wisdom')} stat='wisdom' />
        <Stat label={t('detail.abilities.charisma')} stat='charisma' />
      </View>

      {editing ? (
        <>
          <Text style={styles.label}>{t('detail.sections.traits')}</Text>
          <TextInput style={styles.textArea} multiline value={data.traits || ''} onChangeText={(text) => setTextField('traits', text)} />
          <Text style={styles.label}>{t('detail.sections.actions')}</Text>
          <TextInput style={styles.textArea} multiline value={data.actions || ''} onChangeText={(text) => setTextField('actions', text)} />
          <Text style={styles.label}>{t('detail.sections.reactions')}</Text>
          <TextInput style={styles.textArea} multiline value={data.reactions || ''} onChangeText={(text) => setTextField('reactions', text)} />
          <Text style={styles.label}>{t('detail.sections.legendaryActions')}</Text>
          <TextInput
            style={styles.textArea}
            multiline
            value={data.legendaryActions || ''}
            onChangeText={(text) => setTextField('legendaryActions', text)}
          />
          <Text style={styles.label}>{t('detail.sections.notes')}</Text>
          <TextInput style={styles.textArea} multiline value={data.notes || ''} onChangeText={(text) => setTextField('notes', text)} />
        </>
      ) : (
        <>
          <CollapsibleTextBlock
            title={t('detail.sections.traits')}
            value={data.traits}
            emptyText={t('detail.empty.traits')}
            expanded={Boolean(expandedSections.traits)}
            onToggle={() => toggleSection('traits')}
            style={styles}
            rippleColor={colors.ripple}
            showLessLabel={t('detail.actions.showLess')}
            showMoreLabel={t('detail.actions.showMore')}
            testID='monster.traitsSection'
          />
          <CollapsibleTextBlock
            title={t('detail.sections.actions')}
            value={data.actions}
            emptyText={t('detail.empty.actions')}
            expanded={Boolean(expandedSections.actions)}
            onToggle={() => toggleSection('actions')}
            style={styles}
            rippleColor={colors.ripple}
            showLessLabel={t('detail.actions.showLess')}
            showMoreLabel={t('detail.actions.showMore')}
            testID='monster.actionsSection'
          />
          <CollapsibleTextBlock
            title={t('detail.sections.reactions')}
            value={data.reactions}
            emptyText={t('detail.empty.reactions')}
            expanded={Boolean(expandedSections.reactions)}
            onToggle={() => toggleSection('reactions')}
            style={styles}
            rippleColor={colors.ripple}
            showLessLabel={t('detail.actions.showLess')}
            showMoreLabel={t('detail.actions.showMore')}
            testID='monster.reactionsSection'
          />
          {data.legendaryActions ? (
            <CollapsibleTextBlock
              title={t('detail.sections.legendaryActions')}
              value={data.legendaryActions}
              expanded={Boolean(expandedSections.legendaryActions)}
              onToggle={() => toggleSection('legendaryActions')}
              style={styles}
              rippleColor={colors.ripple}
              showLessLabel={t('detail.actions.showLess')}
              showMoreLabel={t('detail.actions.showMore')}
              testID='monster.legendaryActionsSection'
            />
          ) : null}
          <CollapsibleTextBlock
            title={t('detail.sections.notes')}
            value={data.notes}
            emptyText={t('detail.empty.notes')}
            expanded={Boolean(expandedSections.notes)}
            onToggle={() => toggleSection('notes')}
            style={styles}
            rippleColor={colors.ripple}
            showLessLabel={t('detail.actions.showLess')}
            showMoreLabel={t('detail.actions.showMore')}
            testID='monster.notesSection'
          />
        </>
      )}

      <View style={{ marginTop: sp(12) }}>
        <Button title={t('detail.actions.exportJson')} onPress={() => FileService.exportMonster(data)} />
      </View>
    </ScrollView>
  );
}
