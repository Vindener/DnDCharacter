import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CharacterActionsReadyState } from '../hooks/useCharacterActions';

type CharacterTabsProps = Pick<
  CharacterActionsReadyState,
  'styles' | 'colors' | 'tabOrder' | 'tabLabels' | 'selectedTab' | 'hasConflictForTab' | 'openTab'
>;

type TabItem = {
  tab: CharacterActionsReadyState['selectedTab'];
  label: string;
  hasConflict: boolean;
};

function CharacterTabsBase({ styles, colors, tabOrder, tabLabels, selectedTab, hasConflictForTab, openTab }: CharacterTabsProps) {
  const tabItems = useMemo<TabItem[]>(
    () => tabOrder.map((tab) => ({ tab, label: tabLabels[tab], hasConflict: hasConflictForTab(tab) })),
    [hasConflictForTab, tabLabels, tabOrder],
  );

  const keyExtractor = useCallback((item: TabItem) => item.tab, []);

  const renderItem = useCallback(
    ({ item }: { item: TabItem }) => (
      <Pressable
        style={[
          styles.tabChip,
          selectedTab === item.tab ? styles.tabChipActive : null,
          item.hasConflict ? styles.tabChipConflict : null,
        ]}
        onPress={() => openTab(item.tab)}
        android_ripple={{ color: colors.ripple }}
      >
        <View style={styles.tabChipInner}>
          <Text style={[styles.tabChipText, selectedTab === item.tab ? styles.tabChipTextActive : null]}>{item.label}</Text>
          {item.hasConflict && <MaterialCommunityIcons name='alert-circle' size={14} color={colors.warning} />}
        </View>
      </Pressable>
    ),
    [colors.ripple, colors.warning, openTab, selectedTab, styles.tabChip, styles.tabChipActive, styles.tabChipConflict, styles.tabChipInner, styles.tabChipText, styles.tabChipTextActive],
  );

  return (
    <View style={styles.tabsWrap}>
      <FlatList
        horizontal
        data={tabItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        initialNumToRender={6}
        windowSize={5}
      />
    </View>
  );
}

export const CharacterTabs = React.memo(CharacterTabsBase);
