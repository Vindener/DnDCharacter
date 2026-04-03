import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
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

interface CharacterProps {
  route: {
    params: {
      character: CharacterViewModel;
    };
  };
}

export default function Character({ route }: Partial<CharacterProps> & { route?: CharacterProps['route'] }) {
  const state = useCharacterActions({ route });

  if (state.isCharacterMissing) {
    return (
      <View style={state.styles.emptyState}>
        <Text style={state.styles.emptyText}>Персонаж не знайдений</Text>
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

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <CharacterHeader
          styles={styles}
          colors={colors}
          characterData={characterData}
          isCloudDoc={viewState.isCloudDoc}
          isSharedSheet={viewState.isSharedSheet}
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
              <Text style={styles.conflictTitle}>Виявлено конфлікт синхронізації</Text>
            </View>
            <Text style={styles.conflictText}>Локальні та cloud зміни перетнулися в одній секції. Обери стратегію злиття.</Text>
            {currentSync.conflictPaths.length > 0 && <Text style={styles.conflictPaths}>Шляхи: {currentSync.conflictPaths.join(', ')}</Text>}
            <View style={styles.conflictActionsRow}>
              <Pressable style={styles.conflictAction} onPress={resolveConflictWithLocal} android_ripple={{ color: '#999' }}>
                <Text style={styles.conflictActionText}>Залишити локальне</Text>
              </Pressable>
              <Pressable style={styles.conflictAction} onPress={resolveConflictWithCloud} android_ripple={{ color: '#999' }}>
                <Text style={styles.conflictActionText}>Використати хмару</Text>
              </Pressable>
              <Pressable style={styles.conflictAction} onPress={resolveConflictManual} android_ripple={{ color: '#999' }}>
                <Text style={styles.conflictActionText}>Вирішити пізніше</Text>
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

        {mode === 'play' && <QuickActionBar styles={styles} colors={colors} quickActions={quickActions} onQuickActionPress={onQuickActionPress} />}

        <CharacterTabs
          styles={styles}
          tabOrder={tabOrder}
          tabLabels={tabLabels}
          selectedTab={selectedTab}
          hasConflictForTab={hasConflictForTab}
          openTab={openTab}
        />

        {isSharedSheet && (
          <View style={styles.cardSecondary}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Історія спільних змін ({tabLabels[selectedTab]})</Text>
            </View>
            {latestTabChangeLabel && latestTabChange ? (
              <Text style={styles.blockTextMuted}>Маркер останньої зміни: {latestTabChangeLabel} о {new Date(latestTabChange.atMs).toLocaleString()}</Text>
            ) : null}
            {!tabHistory.length && <Text style={styles.blockTextMuted}>Для цієї вкладки ще немає спільної історії.</Text>}
            {tabHistory.map((entry: CharacterChangeHistoryEntry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyAuthor}>{getHistoryAuthorLabel(entry)}</Text>
                <Text style={styles.historyMeta}>{new Date(entry.atMs).toLocaleString()}</Text>
                <Text style={styles.historyPaths}>{entry.summary || entry.paths.join(', ') || '—'}</Text>
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

      <CharacterModals {...viewState} />
    </View>
  );
}
