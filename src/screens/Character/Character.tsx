import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { CharacterViewModel } from '@/types/Character';
import { useCharacterActions } from './hooks/useCharacterActions';
import type { CharacterActionsReadyState } from './hooks/useCharacterActions';
import type { CharacterChangeHistoryEntry } from '@/repositories/characterCloudRepository';
import { CharacterHeader } from './components/CharacterHeader';
import { CombatSummaryCard } from './components/CombatSummaryCard';
import { QuickActionBar } from './components/QuickActionBar';
import { CharacterTabs } from './components/CharacterTabs';
import { CharacterTabContent } from './tabs/CharacterTabContent';
import { CharacterModals } from './components/CharacterModals';
import useCharacterStore from '@/context/Character-store';
import { SkeletonCharacterSheet } from '@/shared/ui/skeleton';
import { DeferredMount } from '@/shared/components/DeferredMount/DeferredMount';

interface CharacterProps {
  route: {
    params: {
      character: CharacterViewModel;
    };
  };
}

type CharacterScreenProps = Partial<CharacterProps> & { route?: CharacterProps['route'] };

function CharacterScreen({ route }: CharacterScreenProps) {
  const { t } = useTranslation('character');
  const state = useCharacterActions({ route });
  const insets = useSafeAreaInsets();
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);
  const charactersLoaded = useCharacterStore((s) => s.isLoaded);
  const charactersLoadError = useCharacterStore((s) => s.loadError);

  if (state.isCharacterMissing) {
    if (charactersLoadError) {
      return (
        <View style={state.styles.emptyState}>
          <Text style={state.styles.emptyText}>{charactersLoadError}</Text>
        </View>
      );
    }

    if (currentCharacterId && !charactersLoaded) {
      return <SkeletonCharacterSheet />;
    }

    return (
      <View style={state.styles.emptyState}>
        <Text style={state.styles.emptyText}>{t('empty.notFound')}</Text>
      </View>
    );
  }

  const viewState = state as CharacterActionsReadyState;
  const {
    styles,
    colors,
    characterData,
    currentSync,
    resolveConflictWithLocal,
    resolveConflictWithCloud,
    resolveConflictManual,
    mode,
    quickActions,
    onQuickActionPress,
    selectedTab,
    tabOrder,
    tabLabels,
    hasConflictForTab,
    openTab,
    isSharedSheet,
    latestTabChange,
    latestTabChangeLabel,
    tabHistory,
    getHistoryAuthorLabel,
  } = viewState;
  const hasStickyQuickActions = mode === 'play';

  const formatHistorySummary = (entry: CharacterChangeHistoryEntry) => {
    const summary = entry.summary || entry.paths.join(', ');
    if (!summary) return '—';
    return t(`dm:sharedUpdates.pathLabels.${summary}`, { defaultValue: summary });
  };

  return (
    <View style={styles.screen} testID='character.screen'>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          hasStickyQuickActions ? { paddingBottom: Math.max(insets.bottom, 8) + 104 } : null,
        ]}
      >
        <CharacterHeader
          styles={styles}
          colors={colors}
          characterData={characterData}
          isCloudDoc={viewState.isCloudDoc}
          isSharedSheet={viewState.isSharedSheet}
          isOwnedByMe={viewState.isOwnedByMe}
          onCharacterMenuChange={viewState.onCharacterMenuChange}
          syncBadges={viewState.syncBadges}
          renderBadge={viewState.renderBadge}
          syncStatusLabel={viewState.syncStatusLabel}
          syncFeedback={viewState.syncFeedback}
          currentSync={viewState.currentSync}
          syncNow={viewState.syncNow}
          mode={viewState.mode}
          setMode={viewState.setMode}
          toggleSessionMode={viewState.toggleSessionMode}
        />

        {currentSync?.status === 'conflict' && (
          <View style={styles.conflictCard}>
            <View style={styles.conflictHeader}>
              <Text style={styles.conflictTitle}>{t('conflict.title')}</Text>
            </View>
            <Text style={styles.conflictText}>{t('conflict.message')}</Text>
            {currentSync.conflictPaths.length > 0 && (
              <Text style={styles.conflictPaths}>{t('conflict.paths', { paths: currentSync.conflictPaths.join(', ') })}</Text>
            )}
            <View style={styles.conflictActionsRow}>
              <Pressable style={styles.conflictAction} onPress={resolveConflictWithLocal} android_ripple={{ color: colors.ripple }}>
                <Text style={styles.conflictActionText}>{t('conflict.keepLocal')}</Text>
              </Pressable>
              <Pressable style={styles.conflictAction} onPress={resolveConflictWithCloud} android_ripple={{ color: colors.ripple }}>
                <Text style={styles.conflictActionText}>{t('conflict.useCloud')}</Text>
              </Pressable>
              <Pressable style={styles.conflictAction} onPress={resolveConflictManual} android_ripple={{ color: colors.ripple }}>
                <Text style={styles.conflictActionText}>{t('conflict.resolveLater')}</Text>
              </Pressable>
            </View>
          </View>
        )}

        <CombatSummaryCard
          styles={styles}
          characterData={characterData}
          hpPercent={viewState.hpPercent}
          proficiency={viewState.proficiency}
          passivePerception={viewState.passivePerception}
          sectionConflictLabel={viewState.sectionConflictLabel}
        />

        <CharacterTabs
          styles={styles}
          colors={colors}
          tabOrder={tabOrder}
          tabLabels={tabLabels}
          selectedTab={selectedTab}
          hasConflictForTab={hasConflictForTab}
          openTab={openTab}
        />

        {isSharedSheet && (
          <View style={styles.cardSecondary}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>{t('history.title', { tab: tabLabels[selectedTab] })}</Text>
            </View>
            {latestTabChangeLabel && latestTabChange ? (
              <Text style={styles.blockTextMuted}>
                {t('history.latestChange', { label: latestTabChangeLabel, date: new Date(latestTabChange.atMs).toLocaleString() })}
              </Text>
            ) : null}
            {!tabHistory.length && <Text style={styles.blockTextMuted}>{t('history.empty')}</Text>}
            {tabHistory.map((entry: CharacterChangeHistoryEntry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyAuthor}>{getHistoryAuthorLabel(entry)}</Text>
                <Text style={styles.historyMeta}>{new Date(entry.atMs).toLocaleString()}</Text>
                <Text style={styles.historyPaths}>{formatHistorySummary(entry)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.tabContent}>
          <CharacterTabContent
            selectedTab={selectedTab}
            mode={mode}
            renderOverviewPlay={viewState.renderOverviewPlay}
            renderOverviewEdit={viewState.renderOverviewEdit}
            renderCombatPlay={viewState.renderCombatPlay}
            renderCombatEdit={viewState.renderCombatEdit}
            renderMagicPlay={viewState.renderMagicPlay}
            renderMagicEdit={viewState.renderMagicEdit}
            renderInventoryPlay={viewState.renderInventoryPlay}
            renderInventoryEdit={viewState.renderInventoryEdit}
            renderNotesPlay={viewState.renderNotesPlay}
            renderNotesEdit={viewState.renderNotesEdit}
            renderHomebrewPlay={viewState.renderHomebrewPlay}
            renderHomebrewEdit={viewState.renderHomebrewEdit}
          />
        </View>
      </ScrollView>

      {hasStickyQuickActions && (
        <View style={[styles.quickActionsDock, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <QuickActionBar styles={styles} colors={colors} quickActions={quickActions} onQuickActionPress={onQuickActionPress} />
        </View>
      )}

      <CharacterModals {...viewState} />
    </View>
  );
}

export default function Character(props: CharacterScreenProps) {
  return (
    <DeferredMount>
      <CharacterScreen {...props} />
    </DeferredMount>
  );
}
