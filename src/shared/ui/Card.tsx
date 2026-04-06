import React from 'react';
import { View, StyleSheet, type ViewProps, type ViewStyle } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import type { SpacingToken } from '@/shared/styles/tokens';
import { rd, sp } from '@/shared/styles/tokens';
import { resolveCardVariant as resolveVariant } from '@/shared/ui/variantResolvers';

export type CardVariant = 'default' | 'outlined' | 'elevated';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: SpacingToken | number;
  style?: ViewStyle | ViewStyle[];
}

export const resolveCardVariant = resolveVariant;

export const Card: React.FC<CardProps> = ({ variant = 'default', padding = 12, style, children, ...rest }) => {
  const colors = useThemeStore((s) => s.colors);
  const tokenized = resolveCardVariant(variant, colors);

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: tokenized.backgroundColor,
          borderColor: tokenized.borderColor,
          padding: sp(padding),
          elevation: tokenized.elevation,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: rd('xl'),
  },
});

export default Card;

