import type { TextStyle } from 'react-native';
import type { ThemeColors } from '@/shared/styles/theme';
import type { TypographyVariant, TypographyWeightToken } from '@/shared/styles/tokens';
import { fs, typography } from '@/shared/styles/tokens';

const weightMap: Record<TypographyWeightToken, NonNullable<TextStyle['fontWeight']>> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
};

export function resolveTextStyleVariant(
  variant: TypographyVariant,
  weight?: TypographyWeightToken,
): Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight'> {
  const base = typography(variant);
  return {
    fontSize: fs(base.fontSize ?? 13),
    lineHeight: base.lineHeight,
    fontWeight: weight ? weightMap[weight] : (base.fontWeight as NonNullable<TextStyle['fontWeight']>),
  };
}

export function resolveButtonVariant(variant: 'primary' | 'secondary' | 'ghost' | 'danger', colors: ThemeColors) {
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.primary, borderColor: colors.primary, textColor: colors.onPrimary };
    case 'danger':
      return { backgroundColor: colors.danger, borderColor: colors.danger, textColor: colors.onDanger };
    case 'ghost':
      return { backgroundColor: colors.background, borderColor: colors.border, textColor: colors.text };
    case 'secondary':
    default:
      return { backgroundColor: colors.card, borderColor: colors.border, textColor: colors.text };
  }
}

export function resolveCardVariant(variant: 'default' | 'outlined' | 'elevated', colors: ThemeColors) {
  switch (variant) {
    case 'outlined':
      return { backgroundColor: colors.background, borderColor: colors.border, elevation: 0 };
    case 'elevated':
      return { backgroundColor: colors.card, borderColor: colors.border, elevation: 2 };
    case 'default':
    default:
      return { backgroundColor: colors.card, borderColor: colors.border, elevation: 1 };
  }
}
