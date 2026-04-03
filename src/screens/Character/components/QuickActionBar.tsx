import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type QuickActionBarProps = {
  styles: any;
  colors: any;
  quickActions: Array<{ id: string; label: string; icon: string; onPress: () => void }>;
  onQuickActionPress: (action: { id: string; onPress: () => void }) => void;
};

export function QuickActionBar({ styles, colors, quickActions, onQuickActionPress }: QuickActionBarProps) {
  return (
    <View style={styles.quickActionsWrapper}>
      <Text style={styles.sectionTitle}>Панель швидких дій</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
        {quickActions.map((action) => (
          <Pressable key={action.id} style={styles.quickActionButton} onPress={() => onQuickActionPress(action)} android_ripple={{ color: '#999' }}>
            <MaterialCommunityIcons name={action.icon as never} size={18} color={colors.text} />
            <Text style={styles.quickActionText}>{action.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
