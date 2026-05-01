import React, { useCallback } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CharacterActionsReadyState } from '../hooks/useCharacterActions';

type QuickActionBarProps = Pick<CharacterActionsReadyState, 'styles' | 'colors' | 'quickActions' | 'onQuickActionPress'>;

const QUICK_ACTION_TEST_IDS: Record<string, string> = {
  'minus-hp': 'character.quickAction.hpMinus',
  'plus-hp': 'character.quickAction.hpPlus',
  roll: 'character.quickAction.roll',
};

function QuickActionBarBase({ styles, colors, quickActions, onQuickActionPress }: QuickActionBarProps) {
  const keyExtractor = useCallback((item: CharacterActionsReadyState['quickActions'][number]) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: CharacterActionsReadyState['quickActions'][number] }) => (
      <Pressable
        style={styles.quickActionButton}
        onPress={() => onQuickActionPress(item)}
        android_ripple={{ color: colors.ripple }}
        testID={QUICK_ACTION_TEST_IDS[item.id]}
      >
        <MaterialCommunityIcons name={item.icon as never} size={18} color={colors.text} />
        <Text style={styles.quickActionText}>{item.label}</Text>
      </Pressable>
    ),
    [colors.ripple, colors.text, onQuickActionPress, styles.quickActionButton, styles.quickActionText],
  );

  return (
    <View style={styles.quickActionsWrapper}>
      <Text style={styles.sectionTitle}>Панель швидких дій</Text>
      <FlatList
        horizontal
        data={quickActions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickActionsRow}
        initialNumToRender={6}
        windowSize={5}
        maxToRenderPerBatch={8}
      />
    </View>
  );
}

export const QuickActionBar = React.memo(QuickActionBarBase);
