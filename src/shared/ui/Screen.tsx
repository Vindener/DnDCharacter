import React from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import type { SpacingToken } from '@/shared/styles/tokens';
import { sp } from '@/shared/styles/tokens';

export interface ScreenProps extends Omit<ScrollViewProps, 'contentContainerStyle' | 'style'> {
  children: React.ReactNode;
  scrollable?: boolean;
  insets?: SpacingToken | number;
  contentSpacing?: SpacingToken | number;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle | ViewStyle[];
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = true,
  insets = 14,
  contentSpacing = 12,
  style,
  contentStyle,
  ...rest
}) => {
  const colors = useThemeStore((s) => s.colors);

  const sharedContainer = [
    styles.base,
    {
      backgroundColor: colors.background,
      padding: sp(insets),
      gap: sp(contentSpacing),
    },
    contentStyle,
  ];

  if (!scrollable) {
    return <View style={[styles.fill, { backgroundColor: colors.background }, style, sharedContainer]}>{children}</View>;
  }

  return (
    <ScrollView style={[styles.fill, { backgroundColor: colors.background }, style]} contentContainerStyle={sharedContainer} {...rest}>
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  base: {
    minHeight: '100%',
  },
});

export default Screen;
