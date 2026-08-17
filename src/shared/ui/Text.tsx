import React, { useMemo } from 'react';
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import type { TypographyVariant, TypographyWeightToken } from '@/shared/styles/tokens';
import { resolveTextStyleVariant } from '@/shared/ui/variantResolvers';

export type TextTone = 'default' | 'secondary' | 'muted' | 'brand' | 'success' | 'warning' | 'danger' | 'inverse';

const toneMap = {
  default: 'text',
  secondary: 'textSecondary',
  muted: 'muted',
  brand: 'brand',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  inverse: 'onPrimary',
} as const;

export const resolveTextStyle = resolveTextStyleVariant;

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
  weight?: TypographyWeightToken;
}

export const Text: React.FC<TextProps> = ({ variant = 'body', tone = 'default', weight, style, ...rest }) => {
  const colors = useThemeStore((s) => s.colors);
  const resolved = useMemo(() => resolveTextStyle(variant, weight), [variant, weight]);

  return <RNText style={[styles.base, { color: colors[toneMap[tone]] }, resolved, style]} {...rest} />;
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});

export default Text;
