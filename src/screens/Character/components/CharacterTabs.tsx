import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type CharacterTabsProps = {
  styles: any;
  tabOrder: string[];
  tabLabels: Record<string, string>;
  selectedTab: string;
  hasConflictForTab: (tab: any) => boolean;
  openTab: (tab: any) => void;
};

export function CharacterTabs({ styles, tabOrder, tabLabels, selectedTab, hasConflictForTab, openTab }: CharacterTabsProps) {
  return (
    <View style={styles.tabsWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {tabOrder.map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabChip, selectedTab === tab ? styles.tabChipActive : null, hasConflictForTab(tab) ? styles.tabChipConflict : null]}
            onPress={() => openTab(tab)}
            android_ripple={{ color: '#999' }}
          >
            <View style={styles.tabChipInner}>
              <Text style={[styles.tabChipText, selectedTab === tab ? styles.tabChipTextActive : null]}>{tabLabels[tab]}</Text>
              {hasConflictForTab(tab) && <MaterialCommunityIcons name='alert-circle' size={14} color='#f59e0b' />}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
