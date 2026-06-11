import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import CharacterMenu from '@/shared/components/CharacterMenu/CharacterMenu';
import type { CharacterActionsReadyState } from '../hooks/useCharacterActions';

type CharacterHeaderProps = Pick<
  CharacterActionsReadyState,
  | 'styles'
  | 'colors'
  | 'characterData'
  | 'isCloudDoc'
  | 'isSharedSheet'
  | 'onCharacterMenuChange'
  | 'syncBadges'
  | 'renderBadge'
  | 'syncStatusLabel'
  | 'syncFeedback'
  | 'currentSync'
  | 'syncNow'
  | 'mode'
  | 'setMode'
  | 'toggleSessionMode'
>;

function CharacterHeaderBase({
  styles,
  colors,
  characterData,
  isCloudDoc,
  isSharedSheet,
  onCharacterMenuChange,
  syncBadges,
  renderBadge,
  syncStatusLabel,
  syncFeedback,
  currentSync,
  syncNow,
  mode,
  setMode,
  toggleSessionMode,
}: CharacterHeaderProps) {
  const { t } = useTranslation('character');
  return (
    <View style={styles.headerCard} testID='character.header'>
      <View style={styles.headerTop}>
        {characterData.photoUri ? (
          <Image source={{ uri: characterData.photoUri }} style={styles.characterPhoto} />
        ) : (
          <View style={styles.placeholderPhoto}>
            <MaterialCommunityIcons name='account-outline' size={30} color={colors.textSecondary} />
          </View>
        )}

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.characterName}>{characterData.name || t('header.unnamed')}</Text>
            <CharacterMenu
              character={characterData}
              isCloudDoc={isCloudDoc}
              isSharedSheet={isSharedSheet}
              onSyncNow={syncNow}
              onChange={onCharacterMenuChange}
            />
          </View>
          <Text style={styles.characterMeta}>
            {characterData.race || t('header.raceFallback')} · {characterData.class || t('header.classFallback')} · {t('header.level', { level: characterData.level })}
          </Text>
          <View style={styles.badgesRow}>{syncBadges.map(renderBadge)}</View>
          <View style={styles.syncIndicatorRow}>
            <Text style={styles.syncIndicatorText}>{syncStatusLabel} · {syncFeedback}</Text>
            {currentSync?.transportMessage ? <Text style={styles.syncIndicatorText}>{currentSync.transportMessage}</Text> : null}
          </View>
          <Pressable style={styles.syncNowButton} onPress={syncNow} android_ripple={{ color: colors.ripple }}>
            <MaterialCommunityIcons name='sync' size={16} color={colors.text} />
            <Text style={styles.syncNowButtonText}>{t('sync.syncNow')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.modeRow}>
        <View style={styles.modeSwitch}>
          <Pressable
            style={[styles.modeButton, mode === 'play' ? styles.modeButtonActive : null]}
            onPress={() => setMode('play')}
            android_ripple={{ color: colors.ripple }}
            accessibilityRole='button'
            accessibilityState={{ selected: mode === 'play' }}
            testID='character.mode.play'
          >
            <Text numberOfLines={1} ellipsizeMode='tail' style={[styles.modeButtonText, mode === 'play' ? styles.modeButtonTextActive : null]}>
              Play
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, mode === 'edit' ? styles.modeButtonActive : null]}
            onPress={() => setMode('edit')}
            android_ripple={{ color: colors.ripple }}
            accessibilityRole='button'
            accessibilityState={{ selected: mode === 'edit' }}
            testID='character.mode.edit'
          >
            <Text numberOfLines={1} ellipsizeMode='tail' style={[styles.modeButtonText, mode === 'edit' ? styles.modeButtonTextActive : null]}>
              Edit
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.sessionToggle, characterData.sessionMode ? styles.sessionToggleActive : null]}
          onPress={toggleSessionMode}
          android_ripple={{ color: colors.ripple }}
          testID='character.sessionMode.toggle'
        >
          <Text style={[styles.sessionToggleText, characterData.sessionMode ? styles.sessionToggleTextActive : null]}>{t('header.session')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const CharacterHeader = React.memo(CharacterHeaderBase);
